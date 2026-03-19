import { describe, expect, it } from 'vitest';

import { DEFAULT_ITEMS } from './constants.js';
import {
	HASH_PREFIX,
	decodeItemsFromUrl,
	encodeItemsForUrl,
	getItemsFromHash,
	getUrlWithItems
} from './url-state.js';

describe( 'url-state', () => {
	it( 'encodes and decodes item lists for the URL', () => {
		const items = [ 'Alice', 'Bob', 'Carol' ];

		expect( decodeItemsFromUrl( encodeItemsForUrl( items ) ) ).toEqual( items );
	} );

	it( 'reads a custom item list from the hash', () => {
		const items = [ 'Alice', 'Bob', 'Carol' ];
		const hash = `${ HASH_PREFIX }${ encodeItemsForUrl( items ) }`;

		expect( getItemsFromHash( hash ) ).toEqual( items );
	} );

	it( 'returns null when the hash does not include item data', () => {
		expect( getItemsFromHash( '' ) ).toBeNull();
	} );

	it( 'removes the hash for default items', () => {
		const url = new URL( getUrlWithItems( DEFAULT_ITEMS, {
			currentUrl: 'https://example.com/#/old-value',
			defaultItems: DEFAULT_ITEMS
		} ) );

		expect( url.hash ).toBe( '' );
	} );

	it( 'writes custom items to the hash', () => {
		const items = [ 'Alice', 'Bob', 'Carol' ];
		const url = new URL( getUrlWithItems( items, {
			currentUrl: 'https://example.com/',
			defaultItems: DEFAULT_ITEMS
		} ) );

		expect( decodeItemsFromUrl( url.hash.slice( HASH_PREFIX.length ) ) ).toEqual( items );
	} );
} );
