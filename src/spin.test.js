import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSpinner } from './spin.js';

describe( 'spin', () => {
	beforeEach( () => {
		vi.spyOn( performance, 'now' ).mockReturnValue( 0 );
	} );

	afterEach( () => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	} );

	it( 'shows a validation message when there are fewer than two items', () => {
		const setResult = vi.fn();
		const spinner = createSpinner( {
			state: {
				items: [],
				rotation: 0,
				isSpinning: false,
				lastPointerIndex: null
			},
			renderer: {
				draw: vi.fn(),
				getPointerIndex: vi.fn(),
				getWinner: vi.fn()
			},
			audio: {
				ensureAudioContext: vi.fn(),
				playTick: vi.fn(),
				playBell: vi.fn()
			},
			spinBtn: { disabled: false },
			getItems: vi.fn( () => [ 'Only one' ] ),
			setResult,
			spinDuration: 100,
			minFullSpins: 6,
			maxFullSpins: 10,
			minItemsMessage: 'Add at least 2 items.',
			selectedPrefix: 'Selected: '
		} );

		spinner.spin();

		expect( setResult ).toHaveBeenCalledWith( 'Add at least 2 items.' );
	} );

	it( 'animates the spin and reports the winner', () => {
		const state = {
			items: [],
			rotation: 0,
			isSpinning: false,
			lastPointerIndex: null
		};
		const setResult = vi.fn();
		const draw = vi.fn();
		const getPointerIndex = vi
			.fn()
			.mockReturnValueOnce( 0 )
			.mockReturnValueOnce( 1 )
			.mockReturnValueOnce( 1 );
		const getWinner = vi.fn( () => 'Pizza' );
		const ensureAudioContext = vi.fn();
		const playTick = vi.fn();
		const playBell = vi.fn();

		vi.spyOn( Math, 'random' ).mockReturnValue( 0 );
		vi.stubGlobal( 'requestAnimationFrame', callback => {
			callback( 100 );
			return 1;
		} );

		const spinner = createSpinner( {
			state,
			renderer: {
				draw,
				getPointerIndex,
				getWinner
			},
			audio: {
				ensureAudioContext,
				playTick,
				playBell
			},
			spinBtn: { disabled: false },
			getItems: vi.fn( () => [ 'Pizza', 'Burger' ] ),
			setResult,
			spinDuration: 100,
			minFullSpins: 6,
			maxFullSpins: 10,
			minItemsMessage: 'Add at least 2 items.',
			selectedPrefix: 'Selected: '
		} );

		spinner.spin();

		expect( ensureAudioContext ).toHaveBeenCalledOnce();
		expect( draw ).toHaveBeenCalledTimes( 2 );
		expect( playTick ).toHaveBeenCalledOnce();
		expect( playBell ).toHaveBeenCalledOnce();
		expect( setResult ).toHaveBeenNthCalledWith( 1, '' );
		expect( setResult ).toHaveBeenNthCalledWith( 2, 'Selected: Pizza' );
		expect( state.isSpinning ).toBe( false );
		expect( state.rotation ).toBe( 0 );
	} );
} );
