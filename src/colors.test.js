import { describe, expect, it } from 'vitest';

import { paletteForCount } from './colors.js';
import { COLORS } from './constants.js';

function hasAdjacentClash( palette ) {
	for ( let i = 0; i < palette.length; i += 1 ) {
		const next = ( i + 1 ) % palette.length;

		if ( palette[ i ] === palette[ next ] ) {
			return { i, next, color: palette[ i ] };
		}
	}

	return null;
}

describe( 'paletteForCount', () => {
	it( 'returns an empty array for non-positive counts', () => {
		expect( paletteForCount( 0 ) ).toEqual( [] );
		expect( paletteForCount( -3 ) ).toEqual( [] );
	} );

	it( 'returns the palette colors in order when count fits the palette', () => {
		expect( paletteForCount( COLORS.length ) ).toEqual( COLORS );
	} );

	it( 'avoids adjacent clashes on the circular wheel when items wrap past the palette', () => {
		const result = paletteForCount( COLORS.length + 1 );

		expect( result ).toHaveLength( COLORS.length + 1 );
		expect( hasAdjacentClash( result ) ).toBeNull();
	} );

	it( 'keeps wraparound distinct for every multiple-plus-one count', () => {
		for ( const count of [ COLORS.length + 1, 2 * COLORS.length + 1, 3 * COLORS.length + 1 ] ) {
			const result = paletteForCount( count );

			expect( result ).toHaveLength( count );
			expect( hasAdjacentClash( result ) ).toBeNull();
		}
	} );

	it( 'produces clash-free palettes across a wide range of counts', () => {
		for ( let count = 1; count <= 64; count += 1 ) {
			const result = paletteForCount( count );

			expect( result ).toHaveLength( count );

			if ( count > 1 ) {
				expect( hasAdjacentClash( result ) ).toBeNull();
			}
		}
	} );

	it( 'falls back to the default palette when no palette is supplied', () => {
		expect( paletteForCount( 3 ) ).toEqual( COLORS.slice( 0, 3 ) );
	} );

	it( 'accepts a custom palette', () => {
		const palette = [ '#aaa', '#bbb', '#ccc' ];

		expect( paletteForCount( 4, palette ) ).toEqual( [ '#aaa', '#bbb', '#ccc', '#bbb' ] );
	} );
} );
