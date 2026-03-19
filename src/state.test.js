import { describe, expect, it } from 'vitest';

import { createState } from './state.js';

describe( 'state', () => {
	it( 'creates the default application state', () => {
		expect( createState() ).toEqual( {
			items: [],
			rotation: 0,
			isSpinning: false,
			lastPointerIndex: null,
			recentWinnerIndexes: []
		} );
	} );

	it( 'returns a fresh state object each time', () => {
		const first = createState();
		const second = createState();

		first.items.push( 'Pizza' );

		expect( second.items ).toEqual( [] );
	} );
} );
