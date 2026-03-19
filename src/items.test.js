import { describe, expect, it } from 'vitest';

import { formatItems, parseItems } from './items.js';

describe( 'items', () => {
	it( 'parses trimmed non-empty items from textarea content', () => {
		expect( parseItems( '  Pizza\n\n Burger \n  \nSushi  ' ) ).toEqual( [ 'Pizza', 'Burger', 'Sushi' ] );
	} );

	it( 'formats items back into textarea content', () => {
		expect( formatItems( [ 'Pizza', 'Burger', 'Sushi' ] ) ).toBe( 'Pizza\nBurger\nSushi' );
	} );
} );
