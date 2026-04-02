import { describe, expect, it } from 'vitest';

import {
	COLORS,
	DEFAULT_ITEMS,
	MAX_FULL_SPINS,
	MIN_FULL_SPINS,
	SPIN_DURATION,
	TEXT
} from './constants.js';

function hexToRgb( hex ) {
	const value = hex.replace( '#', '' );

	return [
		Number.parseInt( value.slice( 0, 2 ), 16 ),
		Number.parseInt( value.slice( 2, 4 ), 16 ),
		Number.parseInt( value.slice( 4, 6 ), 16 )
	];
}

function getHue( [ red, green, blue ] ) {
	const redNormalized = red / 255;
	const greenNormalized = green / 255;
	const blueNormalized = blue / 255;
	const max = Math.max( redNormalized, greenNormalized, blueNormalized );
	const min = Math.min( redNormalized, greenNormalized, blueNormalized );
	const delta = max - min;

	if ( delta === 0 ) {
		return 0;
	}

	let hue = 0;

	if ( max === redNormalized ) {
		hue = ( ( greenNormalized - blueNormalized ) / delta ) % 6;
	} else if ( max === greenNormalized ) {
		hue = ( blueNormalized - redNormalized ) / delta + 2;
	} else {
		hue = ( redNormalized - greenNormalized ) / delta + 4;
	}

	const degrees = hue * 60;

	return degrees < 0 ? degrees + 360 : degrees;
}

function getHueDistance( firstHue, secondHue ) {
	const distance = Math.abs( firstHue - secondHue );

	return Math.min( distance, 360 - distance );
}

describe( 'constants', () => {
	it( 'defines the configured spin range and duration', () => {
		expect( SPIN_DURATION ).toBe( 10000 );
		expect( MIN_FULL_SPINS ).toBe( 6 );
		expect( MAX_FULL_SPINS ).toBe( 10 );
	} );

	it( 'exposes default wheel items and labels', () => {
		expect( DEFAULT_ITEMS ).toEqual( [ 'Pizza', 'Burger', 'Sushi', 'Taco', 'Kebab', 'Ramen' ] );
		expect( COLORS ).toHaveLength( 16 );
		expect( TEXT ).toEqual( {
			emptyWheel: 'Add items',
			minItems: 'Keep at least 2 active items.',
			selectedPrefix: 'Selected: ',
			excludedPrefix: 'Excluded: ',
			restoredPrefix: 'Back in draw: '
		} );
	} );

	it( 'keeps adjacent wheel colors visually distinct', () => {
		const colorHues = COLORS.map( color => getHue( hexToRgb( color ) ) );

		for ( let index = 0; index < colorHues.length; index += 1 ) {
			const nextIndex = ( index + 1 ) % colorHues.length;
			const distance = getHueDistance( colorHues[ index ], colorHues[ nextIndex ] );

			expect( distance ).toBeGreaterThanOrEqual( 60 );
		}
	} );
} );
