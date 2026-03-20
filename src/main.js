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
import { getItemsFromHash, syncItemsInUrl } from './url-state.js';
import { createWheelRenderer } from './wheel.js';

const elements = getElements();
const state = createState();
const audio = createAudioPlayer();
const renderer = createWheelRenderer( {
	canvas: elements.canvas,
	ctx: elements.ctx,
	colors: COLORS,
	emptyText: TEXT.emptyWheel
} );

function setResult( message ) {
	elements.resultEl.textContent = message;
}

function getItems() {
	return parseItems( elements.textarea.value );
}

function restorePersistedState() {
	const persistedState = loadPersistedState();

	state.rotation = persistedState.rotation;
	state.recentWinnerIndexes = persistedState.recentWinnerIndexes
		.filter( index => index >= 0 && index < state.items.length );
}

function updateWheel( { restoreState = true } = {} ) {
	state.items = getItems();
	syncItemsInUrl( state.items, { defaultItems: DEFAULT_ITEMS } );

	if ( restoreState ) {
		restorePersistedState();
	} else {
		state.rotation = 0;
		state.recentWinnerIndexes = [];
	}

	setResult( '' );
	state.lastPointerIndex = state.items.length ?
		renderer.getPointerIndex( state.items, state.rotation ) :
		null;
	renderer.draw( state.items, state.rotation );
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
	persistState: persistedState => savePersistedState( persistedState )
} );

function resetWheel() {
	spinner.stop();
	elements.textarea.value = formatItems( DEFAULT_ITEMS );
	clearPersistedState();
	setResult( '' );
	updateWheel( { restoreState: false } );
}

function spinWheel() {
	state.items = getItems();
	syncItemsInUrl( state.items, { defaultItems: DEFAULT_ITEMS } );
	restorePersistedState();
	state.lastPointerIndex = state.items.length ?
		renderer.getPointerIndex( state.items, state.rotation ) :
		null;
	renderer.draw( state.items, state.rotation );
	spinner.spin();
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
	updateWheel();
}

function handleTextareaKeydown( event ) {
	if ( event.key !== 'Enter' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey ) {
		return;
	}

	window.setTimeout( () => {
		if ( document.activeElement === elements.textarea ) {
			updateWheel();
		}
	}, 0 );
}

elements.spinBtn.addEventListener( 'click', spinWheel );
elements.resetBtn.addEventListener( 'click', resetWheel );
elements.textarea.addEventListener( 'focus', spinner.stop );
elements.textarea.addEventListener( 'blur', handleTextareaBlur );
elements.textarea.addEventListener( 'keydown', handleTextareaKeydown );
window.addEventListener( 'keydown', handleWindowKeydown );

elements.textarea.value = formatItems( getItemsFromHash( window.location.hash ) || DEFAULT_ITEMS );
updateWheel();
