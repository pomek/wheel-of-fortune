import { describe, expect, it } from 'vitest';

import {
	COLORS,
	DEFAULT_ITEMS,
	MAX_FULL_SPINS,
	MIN_FULL_SPINS,
	SPIN_DURATION,
	TEXT
} from './constants.js';

describe( 'constants', () => {
	it( 'defines the configured spin range and duration', () => {
		expect( SPIN_DURATION ).toBe( 10000 );
		expect( MIN_FULL_SPINS ).toBe( 6 );
		expect( MAX_FULL_SPINS ).toBe( 10 );
	} );

	it( 'exposes default wheel items and labels', () => {
		expect( DEFAULT_ITEMS ).toEqual( [ 'Pizza', 'Burger', 'Sushi', 'Taco', 'Kebab', 'Ramen' ] );
		expect( COLORS ).toHaveLength( 8 );
		expect( TEXT ).toEqual( {
			emptyWheel: 'Add items',
			minItems: 'Add at least 2 items.',
			selectedPrefix: 'Selected: '
		} );
	} );
} );
