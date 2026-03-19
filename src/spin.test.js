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
				lastPointerIndex: null,
				recentWinnerIndexes: []
			},
			renderer: {
				draw: vi.fn(),
				getPointerIndex: vi.fn(),
				getWinner: vi.fn(),
				getRotationForIndex: vi.fn()
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
			lastPointerIndex: null,
			recentWinnerIndexes: []
		};
		const setResult = vi.fn();
		const draw = vi.fn();
		const persistState = vi.fn();
		const getPointerIndex = vi
			.fn()
			.mockReturnValueOnce( 0 )
			.mockReturnValueOnce( 1 )
			.mockReturnValueOnce( 1 );
		const getRotationForIndex = vi.fn( () => 0 );
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
				getWinner: vi.fn(),
				getRotationForIndex
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
			selectedPrefix: 'Selected: ',
			persistState
		} );

		spinner.spin();

		expect( ensureAudioContext ).toHaveBeenCalledOnce();
		expect( getRotationForIndex ).toHaveBeenCalledWith( [ 'Pizza', 'Burger' ], 0, 0.08 );
		expect( draw ).toHaveBeenCalledTimes( 2 );
		expect( playTick ).toHaveBeenCalledOnce();
		expect( playBell ).toHaveBeenCalledOnce();
		expect( setResult ).toHaveBeenNthCalledWith( 1, '' );
		expect( setResult ).toHaveBeenNthCalledWith( 2, 'Selected: Pizza' );
		expect( state.isSpinning ).toBe( false );
		expect( state.recentWinnerIndexes ).toEqual( [ 0 ] );
		expect( state.rotation ).toBe( 0 );
		expect( persistState ).toHaveBeenCalledWith( {
			rotation: 0,
			recentWinnerIndexes: [ 0 ]
		} );
	} );

	it( 'stops an active spin when requested', () => {
		const state = {
			items: [],
			rotation: Math.PI / 3,
			isSpinning: false,
			lastPointerIndex: null,
			recentWinnerIndexes: [ 1, 0 ]
		};
		const setResult = vi.fn();
		const draw = vi.fn();
		const persistState = vi.fn();
		const getPointerIndex = vi.fn().mockReturnValue( 0 );
		const spinBtn = { disabled: false };
		let nextHandle = 1;
		let scheduledFrame = null;

		vi.spyOn( Math, 'random' ).mockReturnValue( 0 );
		vi.stubGlobal( 'requestAnimationFrame', callback => {
			scheduledFrame = callback;
			return nextHandle++;
		} );
		const cancelAnimationFrame = vi.fn();
		vi.stubGlobal( 'cancelAnimationFrame', cancelAnimationFrame );

		const spinner = createSpinner( {
			state,
			renderer: {
				draw,
				getPointerIndex,
				getWinner: vi.fn(),
				getRotationForIndex: vi.fn( () => Math.PI / 2 )
			},
			audio: {
				ensureAudioContext: vi.fn(),
				playTick: vi.fn(),
				playBell: vi.fn()
			},
			spinBtn,
			getItems: vi.fn( () => [ 'Pizza', 'Burger' ] ),
			setResult,
			spinDuration: 100,
			minFullSpins: 6,
			maxFullSpins: 10,
			minItemsMessage: 'Add at least 2 items.',
			selectedPrefix: 'Selected: ',
			persistState
		} );

		spinner.spin();
		scheduledFrame( 40 );
		expect( state.rotation ).not.toBe( Math.PI / 3 );
		spinner.stop();

		expect( cancelAnimationFrame ).toHaveBeenCalledWith( 2 );
		expect( spinBtn.disabled ).toBe( false );
		expect( state.isSpinning ).toBe( false );
		expect( state.rotation ).toBeCloseTo( Math.PI / 3, 10 );
		expect( state.recentWinnerIndexes ).toEqual( [ 1, 0 ] );
		expect( setResult ).toHaveBeenNthCalledWith( 1, '' );
		expect( setResult ).toHaveBeenNthCalledWith( 2, '' );
		expect( persistState ).toHaveBeenCalledTimes( 1 );
		expect( persistState.mock.calls[ 0 ][ 0 ].rotation ).toBeCloseTo( Math.PI / 3, 10 );
		expect( persistState.mock.calls[ 0 ][ 0 ].recentWinnerIndexes ).toEqual( [ 1, 0 ] );
	} );

	it( 'avoids the last two winners when enough items exist', () => {
		const state = {
			items: [],
			rotation: 0,
			isSpinning: false,
			lastPointerIndex: null,
			recentWinnerIndexes: [ 0, 1 ]
		};

		vi.spyOn( Math, 'random' )
			.mockReturnValueOnce( 0 )
			.mockReturnValueOnce( 0 )
			.mockReturnValueOnce( 0 )
			.mockReturnValueOnce( 0 )
			.mockReturnValueOnce( 0 )
			.mockReturnValueOnce( 0 )
			.mockReturnValueOnce( 0 );
		vi.stubGlobal( 'requestAnimationFrame', callback => {
			callback( 100 );
			return 1;
		} );

		const setResult = vi.fn();
		const spinner = createSpinner( {
			state,
			renderer: {
				draw: vi.fn(),
				getPointerIndex: vi.fn().mockReturnValue( 1 ),
				getWinner: vi.fn(),
				getRotationForIndex: vi.fn( () => 0 )
			},
			audio: {
				ensureAudioContext: vi.fn(),
				playTick: vi.fn(),
				playBell: vi.fn()
			},
			spinBtn: { disabled: false },
			getItems: vi.fn( () => [ 'Pizza', 'Burger', 'Sushi' ] ),
			setResult,
			spinDuration: 100,
			minFullSpins: 6,
			maxFullSpins: 10,
			minItemsMessage: 'Add at least 2 items.',
			selectedPrefix: 'Selected: '
		} );

		spinner.spin();

		expect( state.recentWinnerIndexes ).toEqual( [ 2, 0 ] );
		expect( setResult ).toHaveBeenLastCalledWith( 'Selected: Sushi' );
	} );

	it( 'still avoids only the most recent winner when there are two items', () => {
		const state = {
			items: [],
			rotation: 0,
			isSpinning: false,
			lastPointerIndex: null,
			recentWinnerIndexes: [ 1, 0 ]
		};

		vi.spyOn( Math, 'random' )
			.mockReturnValueOnce( 0 )
			.mockReturnValueOnce( 0 )
			.mockReturnValueOnce( 0 )
			.mockReturnValueOnce( 0 )
			.mockReturnValueOnce( 0 )
			.mockReturnValueOnce( 0 );
		vi.stubGlobal( 'requestAnimationFrame', callback => {
			callback( 100 );
			return 1;
		} );

		const setResult = vi.fn();
		const spinner = createSpinner( {
			state,
			renderer: {
				draw: vi.fn(),
				getPointerIndex: vi.fn().mockReturnValue( 0 ),
				getWinner: vi.fn(),
				getRotationForIndex: vi.fn( () => 0 )
			},
			audio: {
				ensureAudioContext: vi.fn(),
				playTick: vi.fn(),
				playBell: vi.fn()
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

		expect( state.recentWinnerIndexes ).toEqual( [ 0, 1 ] );
		expect( setResult ).toHaveBeenLastCalledWith( 'Selected: Pizza' );
	} );
} );
