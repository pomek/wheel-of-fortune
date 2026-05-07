function getRequiredElement( id, ExpectedClass ) {
	const element = document.getElementById( id );

	if ( !element ) {
		throw new Error( `Missing required element: #${ id }` );
	}

	if ( ExpectedClass && !( element instanceof ExpectedClass ) ) {
		throw new TypeError( `Element #${ id } is not a ${ ExpectedClass.name }.` );
	}

	return element;
}

export function getElements() {
	const textarea = getRequiredElement( 'items', HTMLTextAreaElement );
	const spinBtn = getRequiredElement( 'spinBtn', HTMLButtonElement );
	const resetBtn = getRequiredElement( 'resetBtn', HTMLButtonElement );
	const soundBtn = getRequiredElement( 'soundBtn', HTMLButtonElement );
	const themeBtn = getRequiredElement( 'themeBtn', HTMLButtonElement );
	const newRoundBtn = getRequiredElement( 'newRoundBtn', HTMLButtonElement );
	const startMeetingBtn = getRequiredElement( 'startMeetingBtn', HTMLButtonElement );
	const stopMeetingBtn = getRequiredElement( 'stopMeetingBtn', HTMLButtonElement );
	const itemsTabBtn = getRequiredElement( 'itemsTabBtn', HTMLButtonElement );
	const rosterTabBtn = getRequiredElement( 'rosterTabBtn', HTMLButtonElement );
	const itemsTab = getRequiredElement( 'itemsTab', HTMLElement );
	const rosterTab = getRequiredElement( 'rosterTab', HTMLElement );
	const rosterEl = getRequiredElement( 'roster', HTMLElement );
	const meetingStatusEl = getRequiredElement( 'meetingStatus', HTMLElement );
	const meetingSummaryEl = getRequiredElement( 'meetingSummary', HTMLElement );
	const meetingSummaryTotalEl = getRequiredElement( 'meetingSummaryTotal', HTMLElement );
	const meetingSummaryListEl = getRequiredElement( 'meetingSummaryList', HTMLElement );
	const counterEl = getRequiredElement( 'counter', HTMLElement );
	const resultEl = getRequiredElement( 'result', HTMLElement );
	const toastEl = getRequiredElement( 'toast', HTMLElement );
	const canvas = getRequiredElement( 'wheel', HTMLCanvasElement );
	const ctx = canvas.getContext( '2d' );

	if ( !ctx ) {
		throw new Error( 'Canvas #wheel does not support a 2d context.' );
	}

	return {
		textarea,
		spinBtn,
		resetBtn,
		soundBtn,
		themeBtn,
		newRoundBtn,
		startMeetingBtn,
		stopMeetingBtn,
		itemsTabBtn,
		rosterTabBtn,
		itemsTab,
		rosterTab,
		rosterEl,
		meetingStatusEl,
		meetingSummaryEl,
		meetingSummaryTotalEl,
		meetingSummaryListEl,
		counterEl,
		resultEl,
		toastEl,
		canvas,
		ctx
	};
}
