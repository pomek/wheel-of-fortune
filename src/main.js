import './styles.css';

import { createAudioPlayer } from './audio.js';
import {
	COLORS,
	DEFAULT_ITEMS,
	MAX_FULL_SPINS,
	MIN_FULL_SPINS,
	SPIN_DURATION,
	TEXT
} from './constants.js';
import { getElements } from './dom.js';
import { formatItems, parseItems } from './items.js';
import { clearPersistedState, loadPersistedState, savePersistedState } from './persisted-state.js';
import { createSpinner } from './spin.js';
import { createState } from './state.js';
import { applyTheme, getInitialTheme, saveThemePreference, THEMES } from './theme.js';
import { getItemsFromHash, syncItemsInUrl } from './url-state.js';
import { createWheelRenderer } from './wheel.js';

const SOUND_MUTED_STORAGE_KEY = 'wheel-of-fortune:audio:muted';
const TEXTAREA_UPDATE_DEBOUNCE = 180;
const TIMER_TICK_INTERVAL = 500;

const elements = getElements();
const state = createState();
let currentTheme = getInitialTheme();
const audio = createAudioPlayer( {
	muted: loadMutedPreference()
} );
const renderer = createWheelRenderer( {
	canvas: elements.canvas,
	ctx: elements.ctx,
	colors: COLORS,
	emptyText: TEXT.emptyWheel
} );
let activeToastTimeout = null;
let winnerBlinkInterval = null;
let winnerBlinkTimeout = null;
let scheduledWheelUpdate = null;
let timerTickInterval = null;
let lastItemsKey = null;

function applyItemsFromHash() {
	elements.textarea.value = formatItems( getItemsFromHash( window.location.hash ) || DEFAULT_ITEMS );
}

function loadMutedPreference( {
	storage = window.localStorage
} = {} ) {
	if ( !storage ) {
		return false;
	}

	try {
		return storage.getItem( SOUND_MUTED_STORAGE_KEY ) === '1';
	} catch {
		return false;
	}
}

function saveMutedPreference( muted, {
	storage = window.localStorage
} = {} ) {
	if ( !storage ) {
		return;
	}

	try {
		if ( muted ) {
			storage.setItem( SOUND_MUTED_STORAGE_KEY, '1' );
			return;
		}

		storage.removeItem( SOUND_MUTED_STORAGE_KEY );
	} catch {
		// Ignore storage failures.
	}
}

function setResult( message ) {
	elements.resultEl.textContent = message;
}

function hideToast() {
	if ( activeToastTimeout !== null ) {
		window.clearTimeout( activeToastTimeout );
		activeToastTimeout = null;
	}

	elements.toastEl.classList.remove( 'visible' );
	elements.toastEl.textContent = '';
}

function showToast( message ) {
	if ( !message ) {
		return;
	}

	if ( activeToastTimeout !== null ) {
		window.clearTimeout( activeToastTimeout );
	}

	elements.toastEl.textContent = message;
	elements.toastEl.classList.add( 'visible' );
	activeToastTimeout = window.setTimeout( () => {
		elements.toastEl.classList.remove( 'visible' );
		activeToastTimeout = null;
	}, 2600 );
}

function persistWheelState() {
	savePersistedState( {
		rotation: state.rotation,
		recentWinnerIndexes: state.recentWinnerIndexes,
		excludedIndexes: state.excludedIndexes
	} );
}

function updateSoundButton() {
	const muted = audio.isMuted();

	elements.soundBtn.textContent = muted ? '🔇' : '🔊';
	elements.soundBtn.setAttribute( 'aria-pressed', String( muted ) );
	elements.soundBtn.setAttribute( 'aria-label', muted ? 'Unmute sounds' : 'Mute sounds' );
	elements.soundBtn.title = muted ? 'Unmute sounds' : 'Mute sounds';
}

function toggleSound() {
	const muted = audio.toggleMuted();

	saveMutedPreference( muted );
	updateSoundButton();
}

function updateThemeButton() {
	const isLight = currentTheme === THEMES.LIGHT;
	const nextLabel = isLight ? 'Switch to dark theme' : 'Switch to light theme';

	elements.themeBtn.textContent = isLight ? '🌙' : '☀️';
	elements.themeBtn.setAttribute( 'aria-pressed', String( isLight ) );
	elements.themeBtn.setAttribute( 'aria-label', nextLabel );
	elements.themeBtn.title = nextLabel;
}

function toggleTheme() {
	currentTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
	applyTheme( currentTheme );
	saveThemePreference( currentTheme );
	updateThemeButton();
}

function getActiveTalkedCount() {
	const excludedSet = new Set( state.excludedIndexes );

	return state.talkedIndexes.filter( index => !excludedSet.has( index ) ).length;
}

function formatDuration( milliseconds ) {
	const totalSeconds = Math.max( 0, Math.floor( milliseconds / 1000 ) );
	const minutes = Math.floor( totalSeconds / 60 );
	const seconds = totalSeconds % 60;

	return `${ minutes }:${ String( seconds ).padStart( 2, '0' ) }`;
}

function getCurrentSpeakerElapsed( now = Date.now() ) {
	if ( state.activeSpeakerIndex === null || state.speakerStartedAt === null ) {
		return 0;
	}

	return Math.max( 0, now - state.speakerStartedAt );
}

function getSpeakingTime( index, now = Date.now() ) {
	const stored = state.speakingTimes[ index ] || 0;

	if ( index === state.activeSpeakerIndex ) {
		return stored + getCurrentSpeakerElapsed( now );
	}

	return stored;
}

function getTotalMeetingTime( now = Date.now() ) {
	const stored = Object.values( state.speakingTimes ).reduce( ( sum, value ) => sum + value, 0 );

	return stored + getCurrentSpeakerElapsed( now );
}

function updateCounter() {
	const total = state.items.length;
	const active = getActiveItemsCount();
	const hasExclusions = active < total;
	const talked = getActiveTalkedCount();
	const base = hasExclusions ?
		`<strong>${ active }</strong> / ${ total } active` :
		`${ total } / ${ total } active`;
	const talkedSuffix = talked > 0 ? ` · <strong>${ talked }</strong> talked` : '';

	elements.counterEl.innerHTML = base + talkedSuffix;
}

function drawWheel() {
	renderer.draw( state.items, state.rotation, {
		activeIndex: state.activeWinnerIndex,
		showActiveHighlight: state.isWinnerHighlightVisible,
		excludedIndexes: state.excludedIndexes
	} );
	updateCounter();
	renderRoster();
	renderMeetingStatus();
	renderMeetingSummary();
	updateMeetingButtons();
}

function renderRoster() {
	const excludedSet = new Set( state.excludedIndexes );
	const talkedSet = new Set( state.talkedIndexes );
	const now = Date.now();

	elements.rosterEl.replaceChildren();

	if ( !state.items.length ) {
		const emptyEl = document.createElement( 'li' );

		emptyEl.className = 'roster-empty';
		emptyEl.textContent = TEXT.emptyWheel;
		elements.rosterEl.append( emptyEl );
		return;
	}

	state.items.forEach( ( label, index ) => {
		const isExcluded = excludedSet.has( index );
		const isActiveSpeaker = !isExcluded && state.activeSpeakerIndex === index;
		const elapsed = getSpeakingTime( index, now );
		const hasTime = elapsed > 0;
		const isTalked = !isExcluded && !isActiveSpeaker && ( talkedSet.has( index ) || hasTime );
		const pill = document.createElement( 'li' );
		const button = document.createElement( 'button' );

		button.type = 'button';
		button.className = 'roster-pill';
		button.dataset.index = String( index );
		button.style.setProperty( '--pill-color', COLORS[ index % COLORS.length ] );

		if ( isExcluded ) {
			button.classList.add( 'is-absent' );
			button.setAttribute( 'aria-label', `${ label } — absent. Click to restore.` );
		} else if ( isActiveSpeaker ) {
			button.classList.add( 'is-active' );
			button.setAttribute( 'aria-pressed', 'true' );
			button.setAttribute( 'aria-label', `${ label } — speaking now.` );
		} else if ( isTalked ) {
			button.classList.add( 'is-talked' );
			button.setAttribute( 'aria-pressed', 'true' );
			button.setAttribute( 'aria-label', `${ label } — already spoke. Click to undo.` );
		} else {
			button.setAttribute( 'aria-pressed', 'false' );
			button.setAttribute( 'aria-label', `${ label } — mark as already spoke.` );
		}

		const dot = document.createElement( 'span' );
		dot.className = 'roster-dot';
		dot.setAttribute( 'aria-hidden', 'true' );

		const name = document.createElement( 'span' );
		name.className = 'roster-label';
		name.textContent = label;

		button.append( dot, name );

		if ( !isExcluded && ( hasTime || isActiveSpeaker ) ) {
			const time = document.createElement( 'span' );

			time.className = 'roster-time';
			time.textContent = formatDuration( elapsed );
			button.append( time );
		}

		pill.append( button );
		elements.rosterEl.append( pill );
	} );
}

function renderMeetingStatus() {
	if ( !state.isMeetingActive ) {
		elements.meetingStatusEl.hidden = true;
		elements.meetingStatusEl.textContent = '';
		return;
	}

	const total = getTotalMeetingTime();
	const speakerLabel = state.activeSpeakerIndex !== null ? state.items[ state.activeSpeakerIndex ] : null;
	const left = speakerLabel ? `Speaking: ${ speakerLabel }` : 'Meeting in progress';

	elements.meetingStatusEl.hidden = false;
	elements.meetingStatusEl.replaceChildren();

	const leftEl = document.createElement( 'span' );
	leftEl.textContent = left;

	const rightEl = document.createElement( 'span' );
	const totalLabel = document.createElement( 'span' );
	totalLabel.textContent = 'Total ';
	const totalValue = document.createElement( 'strong' );
	totalValue.textContent = formatDuration( total );
	rightEl.append( totalLabel, totalValue );

	elements.meetingStatusEl.append( leftEl, rightEl );
}

function renderMeetingSummary() {
	if ( !state.hasMeetingSummary ) {
		elements.meetingSummaryEl.hidden = true;
		elements.meetingSummaryListEl.replaceChildren();
		return;
	}

	const excludedSet = new Set( state.excludedIndexes );
	const entries = state.items
		.map( ( label, index ) => ( {
			index,
			label,
			time: state.speakingTimes[ index ] || 0
		} ) )
		.filter( entry => !excludedSet.has( entry.index ) && entry.time > 0 )
		.sort( ( a, b ) => b.time - a.time );

	elements.meetingSummaryEl.hidden = false;
	elements.meetingSummaryListEl.replaceChildren();

	if ( !entries.length ) {
		const emptyEl = document.createElement( 'li' );
		emptyEl.className = 'meeting-summary-row is-empty';
		emptyEl.textContent = 'No speaking time recorded.';
		elements.meetingSummaryListEl.append( emptyEl );
		return;
	}

	const maxTime = entries[ 0 ].time;

	entries.forEach( ( entry, position ) => {
		const row = document.createElement( 'li' );
		row.className = 'meeting-summary-row';

		const name = document.createElement( 'span' );
		name.className = 'meeting-summary-name';
		const rank = document.createElement( 'span' );
		rank.className = 'meeting-summary-rank';
		rank.textContent = `${ position + 1 }.`;
		name.append( rank, document.createTextNode( entry.label ) );

		const bar = document.createElement( 'span' );
		bar.className = 'meeting-summary-bar';
		const fill = document.createElement( 'span' );
		fill.className = 'meeting-summary-bar-fill';
		fill.style.width = `${ ( entry.time / maxTime ) * 100 }%`;
		fill.style.setProperty( '--pill-color', COLORS[ entry.index % COLORS.length ] );
		bar.append( fill );

		const time = document.createElement( 'span' );
		time.className = 'meeting-summary-time';
		time.textContent = formatDuration( entry.time );

		row.append( name, bar, time );
		elements.meetingSummaryListEl.append( row );
	} );
}

function updateMeetingButtons() {
	const hasClearableState = state.hasMeetingSummary ||
		state.talkedIndexes.length > 0 ||
		Object.keys( state.speakingTimes ).length > 0;

	elements.stopMeetingBtn.hidden = !state.isMeetingActive;
	elements.startMeetingBtn.hidden = state.isMeetingActive;
	elements.startMeetingBtn.disabled = state.lastSelectedIndex === null ||
		state.excludedIndexes.includes( state.lastSelectedIndex );
	elements.newRoundBtn.hidden = state.isMeetingActive || !hasClearableState;
}

function startTimerTicker() {
	if ( timerTickInterval !== null ) {
		return;
	}

	timerTickInterval = window.setInterval( () => {
		if ( !state.isMeetingActive ) {
			stopTimerTicker();
			return;
		}

		renderRoster();
		renderMeetingStatus();
	}, TIMER_TICK_INTERVAL );
}

function stopTimerTicker() {
	if ( timerTickInterval === null ) {
		return;
	}

	window.clearInterval( timerTickInterval );
	timerTickInterval = null;
}

function flushActiveSpeaker( now = Date.now() ) {
	if ( state.activeSpeakerIndex === null || state.speakerStartedAt === null ) {
		return;
	}

	const elapsed = Math.max( 0, now - state.speakerStartedAt );
	const previousIndex = state.activeSpeakerIndex;
	const previous = state.speakingTimes[ previousIndex ] || 0;

	state.speakingTimes = { ...state.speakingTimes, [ previousIndex ]: previous + elapsed };
	state.speakerStartedAt = null;
}

function setActiveSpeaker( index ) {
	if ( typeof state.items[ index ] === 'undefined' ) {
		return;
	}

	if ( state.excludedIndexes.includes( index ) ) {
		return;
	}

	const now = Date.now();
	flushActiveSpeaker( now );

	const wasActive = state.isMeetingActive;
	state.isMeetingActive = true;
	state.hasMeetingSummary = false;
	state.activeSpeakerIndex = index;
	state.speakerStartedAt = now;

	if ( !state.talkedIndexes.includes( index ) ) {
		state.talkedIndexes = [ ...state.talkedIndexes, index ];
	}

	if ( !wasActive ) {
		startTimerTicker();
	}

	renderRoster();
	renderMeetingStatus();
	renderMeetingSummary();
	updateMeetingButtons();
	updateCounter();
}

function startMeeting() {
	if ( state.isMeetingActive ) {
		return;
	}

	if ( state.lastSelectedIndex === null || state.excludedIndexes.includes( state.lastSelectedIndex ) ) {
		showToast( 'Spin the wheel to pick a speaker first.' );
		return;
	}

	if ( state.hasMeetingSummary || Object.keys( state.speakingTimes ).length ) {
		state.speakingTimes = {};
		state.hasMeetingSummary = false;
		state.talkedIndexes = [];
	}

	setActiveSpeaker( state.lastSelectedIndex );
}

function stopMeeting() {
	if ( !state.isMeetingActive && !Object.keys( state.speakingTimes ).length ) {
		return;
	}

	flushActiveSpeaker();
	state.isMeetingActive = false;
	state.activeSpeakerIndex = null;
	state.speakerStartedAt = null;
	state.hasMeetingSummary = true;
	stopTimerTicker();

	renderRoster();
	renderMeetingStatus();
	renderMeetingSummary();
	updateMeetingButtons();
}

function resetMeetingState() {
	stopTimerTicker();
	state.isMeetingActive = false;
	state.activeSpeakerIndex = null;
	state.speakerStartedAt = null;
	state.speakingTimes = {};
	state.hasMeetingSummary = false;
	state.lastSelectedIndex = null;
}

function stopWinnerBlink( { redraw = false } = {} ) {
	if ( winnerBlinkInterval !== null ) {
		window.clearInterval( winnerBlinkInterval );
		winnerBlinkInterval = null;
	}

	if ( winnerBlinkTimeout !== null ) {
		window.clearTimeout( winnerBlinkTimeout );
		winnerBlinkTimeout = null;
	}

	state.isWinnerHighlightVisible = true;

	if ( redraw ) {
		drawWheel();
	}
}

function startWinnerBlink() {
	if ( state.activeWinnerIndex === null ) {
		return;
	}

	stopWinnerBlink();
	state.isWinnerHighlightVisible = true;
	drawWheel();

	winnerBlinkInterval = window.setInterval( () => {
		state.isWinnerHighlightVisible = !state.isWinnerHighlightVisible;
		drawWheel();
	}, 220 );

	winnerBlinkTimeout = window.setTimeout( () => {
		stopWinnerBlink();
		state.activeWinnerIndex = null;
		drawWheel();
	}, 3000 );
}

function getItems() {
	return parseItems( elements.textarea.value );
}

function restorePersistedState() {
	const persistedState = loadPersistedState();

	state.rotation = persistedState.rotation;
	state.recentWinnerIndexes = persistedState.recentWinnerIndexes
		.filter( index => index >= 0 && index < state.items.length );
	state.excludedIndexes = persistedState.excludedIndexes
		.filter( index => index >= 0 && index < state.items.length );
	state.talkedIndexes = state.talkedIndexes
		.filter( index => index >= 0 && index < state.items.length );

	const validSpeakingTimes = {};
	for ( const [ key, value ] of Object.entries( state.speakingTimes ) ) {
		const idx = Number( key );

		if ( Number.isInteger( idx ) && idx >= 0 && idx < state.items.length ) {
			validSpeakingTimes[ idx ] = value;
		}
	}
	state.speakingTimes = validSpeakingTimes;

	if (
		state.activeSpeakerIndex !== null &&
		( state.activeSpeakerIndex >= state.items.length || state.excludedIndexes.includes( state.activeSpeakerIndex ) )
	) {
		flushActiveSpeaker();
		state.activeSpeakerIndex = null;
		state.speakerStartedAt = null;
		state.isMeetingActive = false;
		stopTimerTicker();
	}
}

function updateWheel( { restoreState = true } = {} ) {
	state.items = getItems();
	syncItemsInUrl( state.items, { defaultItems: DEFAULT_ITEMS } );

	const itemsKey = state.items.join( '\n' );
	const itemsChanged = lastItemsKey !== null && lastItemsKey !== itemsKey;

	if ( restoreState ) {
		restorePersistedState();

		if ( itemsChanged ) {
			state.talkedIndexes = [];
			resetMeetingState();
		}
	} else {
		state.rotation = 0;
		state.recentWinnerIndexes = [];
		state.excludedIndexes = [];
		state.talkedIndexes = [];
		resetMeetingState();
	}

	lastItemsKey = itemsKey;

	stopWinnerBlink();
	state.activeWinnerIndex = null;
	setResult( '' );
	hideToast();
	state.lastPointerIndex = state.items.length ?
		renderer.getPointerIndex( state.items, state.rotation ) :
		null;
	drawWheel();
}

function clearScheduledWheelUpdate() {
	if ( scheduledWheelUpdate !== null ) {
		window.clearTimeout( scheduledWheelUpdate );
		scheduledWheelUpdate = null;
	}
}

function scheduleWheelUpdate() {
	clearScheduledWheelUpdate();
	scheduledWheelUpdate = window.setTimeout( () => {
		scheduledWheelUpdate = null;
		updateWheel();
	}, TEXTAREA_UPDATE_DEBOUNCE );
}

function flushScheduledWheelUpdate() {
	clearScheduledWheelUpdate();
	updateWheel();
}

const spinner = createSpinner( {
	state,
	renderer,
	audio,
	spinBtn: elements.spinBtn,
	getItems,
	setResult,
	spinDuration: SPIN_DURATION,
	minFullSpins: MIN_FULL_SPINS,
	maxFullSpins: MAX_FULL_SPINS,
	minItemsMessage: TEXT.minItems,
	selectedPrefix: TEXT.selectedPrefix,
	onWinnerSelected: winner => {
		showToast( `${ TEXT.selectedPrefix }${ winner }` );
		startWinnerBlink();

		if ( state.activeWinnerIndex === null ) {
			return;
		}

		state.lastSelectedIndex = state.activeWinnerIndex;

		if ( state.isMeetingActive ) {
			setActiveSpeaker( state.activeWinnerIndex );
		} else {
			updateMeetingButtons();
		}
	},
	persistState: persistWheelState
} );

function getActiveItemsCount() {
	return state.items.length - state.excludedIndexes.length;
}

function clearWinnerSelection() {
	stopWinnerBlink();
	state.activeWinnerIndex = null;
	state.lastPointerIndex = state.items.length ?
		renderer.getPointerIndex( state.items, state.rotation ) :
		null;
}

function toggleTalkedIndex( index ) {
	const itemLabel = state.items[ index ];

	if ( typeof itemLabel === 'undefined' ) {
		return;
	}

	if ( state.excludedIndexes.includes( index ) ) {
		return;
	}

	if ( state.talkedIndexes.includes( index ) ) {
		state.talkedIndexes = state.talkedIndexes.filter( talkedIndex => talkedIndex !== index );
	} else {
		state.talkedIndexes = [ ...state.talkedIndexes, index ];
	}

	renderRoster();
	updateMeetingButtons();
	updateCounter();
}

function startNewRound() {
	const hasTimes = Object.keys( state.speakingTimes ).length > 0 || state.activeSpeakerIndex !== null;

	if ( !state.talkedIndexes.length && !hasTimes && !state.hasMeetingSummary ) {
		return;
	}

	resetMeetingState();
	state.talkedIndexes = [];
	renderRoster();
	renderMeetingStatus();
	renderMeetingSummary();
	updateMeetingButtons();
	updateCounter();
	showToast( 'New round — turn marks cleared.' );
}

function setActiveTab( tabName ) {
	const isItems = tabName === 'items';

	elements.itemsTabBtn.setAttribute( 'aria-selected', String( isItems ) );
	elements.rosterTabBtn.setAttribute( 'aria-selected', String( !isItems ) );
	elements.itemsTabBtn.tabIndex = isItems ? 0 : -1;
	elements.rosterTabBtn.tabIndex = isItems ? -1 : 0;
	elements.itemsTab.hidden = !isItems;
	elements.rosterTab.hidden = isItems;
}

function handleRosterClick( event ) {
	const button = event.target instanceof Element ? event.target.closest( '.roster-pill' ) : null;

	if ( !button || !elements.rosterEl.contains( button ) ) {
		return;
	}

	const index = Number( button.dataset.index );

	if ( !Number.isInteger( index ) ) {
		return;
	}

	if ( state.excludedIndexes.includes( index ) ) {
		toggleExcludedIndex( index );
		return;
	}

	if ( state.isMeetingActive ) {
		if ( index === state.activeSpeakerIndex ) {
			return;
		}

		setActiveSpeaker( index );
		return;
	}

	toggleTalkedIndex( index );
}

function toggleExcludedIndex( index ) {
	const itemLabel = state.items[ index ];

	if ( typeof itemLabel === 'undefined' ) {
		return;
	}

	if ( state.excludedIndexes.includes( index ) ) {
		state.excludedIndexes = state.excludedIndexes.filter( excludedIndex => excludedIndex !== index );
		clearWinnerSelection();
		persistWheelState();
		drawWheel();
		showToast( `${ TEXT.restoredPrefix }${ itemLabel }` );
		return;
	}

	if ( getActiveItemsCount() <= 2 ) {
		showToast( TEXT.minItems );
		return;
	}

	state.excludedIndexes = [ ...state.excludedIndexes, index ];
	clearWinnerSelection();
	persistWheelState();
	drawWheel();
	showToast( `${ TEXT.excludedPrefix }${ itemLabel }` );
}

function resetWheel() {
	const previousHash = window.location.hash;

	clearScheduledWheelUpdate();
	stopWinnerBlink();
	spinner.stop();
	elements.textarea.value = formatItems( DEFAULT_ITEMS );
	clearPersistedState( { hash: previousHash } );
	clearPersistedState( { hash: '' } );
	setResult( '' );
	hideToast();
	updateWheel( { restoreState: false } );
}

function spinWheel() {
	clearScheduledWheelUpdate();
	state.items = getItems();
	syncItemsInUrl( state.items, { defaultItems: DEFAULT_ITEMS } );
	restorePersistedState();
	stopWinnerBlink();
	state.activeWinnerIndex = null;
	state.lastPointerIndex = state.items.length ?
		renderer.getPointerIndex( state.items, state.rotation ) :
		null;
	drawWheel();
	spinner.spin();
}

function handleCanvasClick( event ) {
	if ( state.isSpinning || !state.items.length ) {
		return;
	}

	const rect = elements.canvas.getBoundingClientRect();
	const x = ( event.clientX - rect.left ) * ( elements.canvas.width / rect.width );
	const y = ( event.clientY - rect.top ) * ( elements.canvas.height / rect.height );
	const index = renderer.getIndexAtPoint( state.items, state.rotation, x, y );

	if ( index === null ) {
		return;
	}

	toggleExcludedIndex( index );
}

function handleWindowKeydown( event ) {
	if ( event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey ) {
		return;
	}

	if ( event.target instanceof HTMLElement ) {
		const interactiveTags = [ 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA' ];

		if ( interactiveTags.includes( event.target.tagName ) || event.target.isContentEditable ) {
			return;
		}
	}

	event.preventDefault();
	spinWheel();
}

function handleTextareaBlur() {
	flushScheduledWheelUpdate();
}

function handleTextareaKeydown( event ) {
	if ( event.key !== 'Enter' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey ) {
		return;
	}

	window.setTimeout( () => {
		if ( document.activeElement === elements.textarea ) {
			flushScheduledWheelUpdate();
		}
	}, 0 );
}

function handleTextareaInput() {
	scheduleWheelUpdate();
}

function handleHashChange() {
	clearScheduledWheelUpdate();
	spinner.stop();
	state.talkedIndexes = [];
	resetMeetingState();
	applyItemsFromHash();
	updateWheel();
}

function handleTabKeydown( event ) {
	if ( event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' ) {
		return;
	}

	event.preventDefault();
	const nextTab = event.target === elements.itemsTabBtn ? 'roster' : 'items';

	setActiveTab( nextTab );
	const focusTarget = nextTab === 'items' ? elements.itemsTabBtn : elements.rosterTabBtn;

	focusTarget.focus();
}

elements.spinBtn.addEventListener( 'click', spinWheel );
elements.resetBtn.addEventListener( 'click', resetWheel );
elements.soundBtn.addEventListener( 'click', toggleSound );
elements.themeBtn.addEventListener( 'click', toggleTheme );
elements.newRoundBtn.addEventListener( 'click', startNewRound );
elements.startMeetingBtn.addEventListener( 'click', startMeeting );
elements.stopMeetingBtn.addEventListener( 'click', stopMeeting );
elements.itemsTabBtn.addEventListener( 'click', () => setActiveTab( 'items' ) );
elements.rosterTabBtn.addEventListener( 'click', () => setActiveTab( 'roster' ) );
elements.itemsTabBtn.addEventListener( 'keydown', handleTabKeydown );
elements.rosterTabBtn.addEventListener( 'keydown', handleTabKeydown );
elements.rosterEl.addEventListener( 'click', handleRosterClick );
elements.canvas.addEventListener( 'click', handleCanvasClick );
elements.textarea.addEventListener( 'focus', spinner.stop );
elements.textarea.addEventListener( 'input', handleTextareaInput );
elements.textarea.addEventListener( 'blur', handleTextareaBlur );
elements.textarea.addEventListener( 'keydown', handleTextareaKeydown );
window.addEventListener( 'keydown', handleWindowKeydown );
window.addEventListener( 'hashchange', handleHashChange );

applyTheme( currentTheme );
updateThemeButton();
applyItemsFromHash();
updateSoundButton();
updateWheel();
