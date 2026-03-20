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
	const resultEl = getRequiredElement( 'result', HTMLElement );
	const canvas = getRequiredElement( 'wheel', HTMLCanvasElement );
	const ctx = canvas.getContext( '2d' );

	if ( !ctx ) {
		throw new Error( 'Canvas #wheel does not support a 2d context.' );
	}

	return {
		textarea,
		spinBtn,
		resetBtn,
		resultEl,
		canvas,
		ctx
	};
}
