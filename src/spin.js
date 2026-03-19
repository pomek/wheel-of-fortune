function easeInOutCubic( t ) {
	return t < 0.5 ?
		4 * t * t * t :
		1 - Math.pow( -2 * t + 2, 3 ) / 2;
}

function smoothNoise( t, seed ) {
	return (
		Math.sin( t * 7.1 + seed ) * 0.55 +
		Math.sin( t * 15.7 + seed * 1.37 ) * 0.3 +
		Math.sin( t * 28.3 + seed * 0.73 ) * 0.15
	);
}

function normalizeRotation( rotation ) {
	return ( ( rotation % ( Math.PI * 2 ) ) + Math.PI * 2 ) % ( Math.PI * 2 );
}

function pickWinnerIndex( items, lastWinnerIndex ) {
	const eligibleWinnerIndexes = items
		.map( ( item, index ) => index )
		.filter( index => items.length < 2 || index !== lastWinnerIndex );

	return eligibleWinnerIndexes[ Math.floor( Math.random() * eligibleWinnerIndexes.length ) ];
}

function pickWinnerOffset() {
	const edgePadding = 0.08;
	const edgeBand = 0.18;
	const landsNearLeadingEdge = Math.random() < 0.5;
	const edgeOffset = edgePadding + Math.random() * edgeBand;

	return landsNearLeadingEdge ? edgeOffset : 1 - edgeOffset;
}

export function createSpinner( {
	state,
	renderer,
	audio,
	spinBtn,
	getItems,
	setResult,
	spinDuration,
	minFullSpins,
	maxFullSpins,
	minItemsMessage,
	selectedPrefix,
	persistState = () => {}
} ) {
	let activeAnimationFrame = null;
	let activeSpinToken = null;
	let activeSpinStartRotation = null;

	function stop() {
		if ( !state.isSpinning ) {
			return;
		}

		activeSpinToken = null;

		if ( typeof cancelAnimationFrame === 'function' && activeAnimationFrame !== null ) {
			cancelAnimationFrame( activeAnimationFrame );
		}

		activeAnimationFrame = null;
		state.rotation = normalizeRotation( activeSpinStartRotation ?? state.rotation );
		activeSpinStartRotation = null;
		state.isSpinning = false;
		spinBtn.disabled = false;
		setResult( '' );
		state.lastPointerIndex = state.items.length ?
			renderer.getPointerIndex( state.items, state.rotation ) :
			null;
		renderer.draw( state.items, state.rotation );
		persistState( {
			rotation: state.rotation,
			lastWinnerIndex: state.lastWinnerIndex
		} );
	}

	function spin() {
		state.items = getItems();

		if ( state.isSpinning || state.items.length < 2 ) {
			if ( state.items.length < 2 ) {
				setResult( minItemsMessage );
			}

			return;
		}

		audio.ensureAudioContext();

		state.isSpinning = true;
		spinBtn.disabled = true;
		setResult( '' );

		const spins = minFullSpins + Math.floor( Math.random() * ( maxFullSpins - minFullSpins + 1 ) );
		const arc = ( Math.PI * 2 ) / state.items.length;
		const winnerIndex = pickWinnerIndex( state.items, state.lastWinnerIndex );
		const winnerOffset = pickWinnerOffset();
		const edgeDistance = Math.min( winnerOffset, 1 - winnerOffset );
		const edgeRotationDirection = winnerOffset < 0.5 ? 1 : -1;
		const dramaticJump = Math.random() < 0.35;
		const teaseAmplitude = edgeDistance * arc + arc * ( dramaticJump ? 0.07 : -0.015 );
		const startRotation = state.rotation;
		const normalizedStartRotation = normalizeRotation( state.rotation );
		const finalRotation = renderer.getRotationForIndex( state.items, winnerIndex, winnerOffset );
		const additionalRotation = ( ( finalRotation - normalizedStartRotation ) % ( Math.PI * 2 ) + Math.PI * 2 ) % ( Math.PI * 2 );
		const targetRotation = state.rotation + spins * Math.PI * 2 + additionalRotation;
		const startTime = performance.now();
		const noiseSeed = Math.random() * Math.PI * 2;
		state.lastPointerIndex = renderer.getPointerIndex( state.items, state.rotation );
		const spinToken = Symbol( 'spin' );

		activeSpinToken = spinToken;
		activeSpinStartRotation = state.rotation;

		function animate( now ) {
			if ( activeSpinToken !== spinToken ) {
				return;
			}

			const elapsed = now - startTime;
			const progress = Math.min( elapsed / spinDuration, 1 );
			const eased = easeInOutCubic( progress );
			const baseRotation = startRotation + ( targetRotation - startRotation ) * eased;

			let wobble = 0;

			if ( progress < 0.35 ) {
				const intro = progress / 0.35;
				const envelope = Math.sin( intro * Math.PI );
				wobble += smoothNoise( intro, noiseSeed ) * arc * 0.12 * envelope;
			}

			if ( progress > 0.9 ) {
				const outro = ( progress - 0.9 ) / 0.1;
				const speedFactor = 1 - eased;
				const overshootAmplitude = arc * 0.06 * Math.max( 0.35, speedFactor * 8 );
				const damped = Math.sin( outro * Math.PI * 1.6 ) * Math.exp( -outro * 2.8 );
				wobble += overshootAmplitude * damped;
			}

			if ( progress > 0.82 ) {
				const suspense = ( progress - 0.82 ) / 0.18;
				const teaseEnvelope = Math.sin( suspense * Math.PI ) * Math.exp( -suspense * 1.35 );

				wobble += edgeRotationDirection * teaseAmplitude * teaseEnvelope;
			}

			state.rotation = baseRotation + wobble;
			renderer.draw( state.items, state.rotation );

			const currentPointerIndex = renderer.getPointerIndex( state.items, state.rotation );
			if ( currentPointerIndex !== state.lastPointerIndex ) {
				const intensity = Math.min( 1, Math.abs( targetRotation - state.rotation ) / ( Math.PI * 1.5 ) );
				audio.playTick( intensity );
				state.lastPointerIndex = currentPointerIndex;
			}

			if ( progress < 1 ) {
				activeAnimationFrame = requestAnimationFrame( animate );
				return;
			}

			activeAnimationFrame = null;
			activeSpinToken = null;
			activeSpinStartRotation = null;
			state.rotation = normalizeRotation( targetRotation );
			state.lastWinnerIndex = winnerIndex;
			renderer.draw( state.items, state.rotation );
			setResult( `${ selectedPrefix }${ state.items[ winnerIndex ] }` );
			audio.playBell();
			state.isSpinning = false;
			spinBtn.disabled = false;
			state.lastPointerIndex = renderer.getPointerIndex( state.items, state.rotation );
			persistState( {
				rotation: state.rotation,
				lastWinnerIndex: state.lastWinnerIndex
			} );
		}

		activeAnimationFrame = requestAnimationFrame( animate );
	}

	return {
		spin,
		stop
	};
}
