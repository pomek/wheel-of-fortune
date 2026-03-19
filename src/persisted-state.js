const STORAGE_PREFIX = 'wheel-of-fortune:state:';
const DEFAULT_HASH_KEY = '#default';

function getHashStorageKey( hash ) {
	return `${ STORAGE_PREFIX }${ hash || DEFAULT_HASH_KEY }`;
}

function getDefaultState() {
	return {
		rotation: 0,
		recentWinnerIndexes: []
	};
}

function getRecentWinnerIndexes( parsedValue ) {
	if ( Array.isArray( parsedValue.recentWinnerIndexes ) ) {
		return parsedValue.recentWinnerIndexes.filter( Number.isInteger ).slice( 0, 2 );
	}

	if ( Number.isInteger( parsedValue.lastWinnerIndex ) ) {
		return [ parsedValue.lastWinnerIndex ];
	}

	return [];
}

export function loadPersistedState( {
	hash = window.location.hash,
	storage = window.localStorage
} = {} ) {
	if ( !storage ) {
		return getDefaultState();
	}

	try {
		const rawValue = storage.getItem( getHashStorageKey( hash ) );

		if ( !rawValue ) {
			return getDefaultState();
		}

		const parsedValue = JSON.parse( rawValue );

		return {
			rotation: Number.isFinite( parsedValue.rotation ) ? parsedValue.rotation : 0,
			recentWinnerIndexes: getRecentWinnerIndexes( parsedValue )
		};
	} catch {
		return getDefaultState();
	}
}

export function savePersistedState( state, {
	hash = window.location.hash,
	storage = window.localStorage
} = {} ) {
	if ( !storage ) {
		return;
	}

	try {
		storage.setItem( getHashStorageKey( hash ), JSON.stringify( state ) );
	} catch {
		// Ignore storage failures.
	}
}

export function clearPersistedState( {
	hash = window.location.hash,
	storage = window.localStorage
} = {} ) {
	if ( !storage ) {
		return;
	}

	try {
		storage.removeItem( getHashStorageKey( hash ) );
	} catch {
		// Ignore storage failures.
	}
}

export function getPersistedStateStorageKey( hash ) {
	return getHashStorageKey( hash );
}
