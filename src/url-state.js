import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

import { formatItems, parseItems } from './items.js';

export const HASH_PREFIX = '#/';

export function encodeItemsForUrl( items ) {
	return compressToEncodedURIComponent( formatItems( items ) );
}

export function decodeItemsFromUrl( value ) {
	if ( !value ) {
		return null;
	}

	const decodedValue = decompressFromEncodedURIComponent( value );

	if ( decodedValue === null ) {
		return null;
	}

	return parseItems( decodedValue );
}

export function getItemsFromHash( hash ) {
	if ( !hash.startsWith( HASH_PREFIX ) ) {
		return null;
	}

	return decodeItemsFromUrl( hash.slice( HASH_PREFIX.length ) );
}

export function getUrlWithItems( items, { currentUrl, defaultItems } ) {
	const url = new URL( currentUrl );
	const itemsValue = formatItems( items );

	if ( !itemsValue || itemsValue === formatItems( defaultItems ) ) {
		url.hash = '';
		return url.toString();
	}

	url.hash = `/${ encodeItemsForUrl( items ) }`;

	return url.toString();
}

export function syncItemsInUrl( items, { defaultItems, history = window.history, location = window.location } ) {
	history.replaceState( history.state, '', getUrlWithItems( items, {
		currentUrl: location.href,
		defaultItems
	} ) );
}
