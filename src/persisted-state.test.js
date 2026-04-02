import { describe, expect, it } from 'vitest';

import {
	clearPersistedState,
	getPersistedStateStorageKey,
	loadPersistedState,
	savePersistedState
} from './persisted-state.js';

function createStorage() {
	const values = new Map();

	return {
		getItem( key ) {
			return values.has( key ) ? values.get( key ) : null;
		},
		setItem( key, value ) {
			values.set( key, value );
		},
		removeItem( key ) {
			values.delete( key );
		}
	};
}

describe( 'persisted-state', () => {
	it( 'stores state per URL hash', () => {
		const storage = createStorage();

		savePersistedState( {
			rotation: Math.PI,
			recentWinnerIndexes: [ 2, 0 ],
			excludedIndexes: [ 1 ]
		}, {
			hash: '#/team-a',
			storage
		} );

		savePersistedState( {
			rotation: Math.PI / 2,
			recentWinnerIndexes: [ 1 ],
			excludedIndexes: [ 0, 2 ]
		}, {
			hash: '#/team-b',
			storage
		} );

		expect( loadPersistedState( { hash: '#/team-a', storage } ) ).toEqual( {
			rotation: Math.PI,
			recentWinnerIndexes: [ 2, 0 ],
			excludedIndexes: [ 1 ]
		} );
		expect( loadPersistedState( { hash: '#/team-b', storage } ) ).toEqual( {
			rotation: Math.PI / 2,
			recentWinnerIndexes: [ 1 ],
			excludedIndexes: [ 0, 2 ]
		} );
	} );

	it( 'supports older persisted state with one last winner', () => {
		const storage = createStorage();

		storage.setItem( getPersistedStateStorageKey( '#/team-a' ), JSON.stringify( {
			rotation: Math.PI,
			lastWinnerIndex: 2
		} ) );

		expect( loadPersistedState( { hash: '#/team-a', storage } ) ).toEqual( {
			rotation: Math.PI,
			recentWinnerIndexes: [ 2 ],
			excludedIndexes: []
		} );
	} );

	it( 'ignores invalid or duplicate excluded indexes', () => {
		const storage = createStorage();

		storage.setItem( getPersistedStateStorageKey( '#/team-a' ), JSON.stringify( {
			rotation: Math.PI,
			excludedIndexes: [ 1, 1, 3, 'x', 2.5 ]
		} ) );

		expect( loadPersistedState( { hash: '#/team-a', storage } ) ).toEqual( {
			rotation: Math.PI,
			recentWinnerIndexes: [],
			excludedIndexes: [ 1, 3 ]
		} );
	} );

	it( 'returns defaults when persisted data is missing or invalid', () => {
		const storage = createStorage();

		storage.setItem( getPersistedStateStorageKey( '#/team-a' ), '{invalid json' );

		expect( loadPersistedState( { hash: '#/team-a', storage } ) ).toEqual( {
			rotation: 0,
			recentWinnerIndexes: [],
			excludedIndexes: []
		} );
		expect( loadPersistedState( { hash: '#/missing', storage } ) ).toEqual( {
			rotation: 0,
			recentWinnerIndexes: [],
			excludedIndexes: []
		} );
	} );

	it( 'clears persisted state for the current hash', () => {
		const storage = createStorage();

		savePersistedState( {
			rotation: Math.PI,
			recentWinnerIndexes: [ 2, 0 ],
			excludedIndexes: [ 1 ]
		}, {
			hash: '#/team-a',
			storage
		} );

		clearPersistedState( { hash: '#/team-a', storage } );

		expect( loadPersistedState( { hash: '#/team-a', storage } ) ).toEqual( {
			rotation: 0,
			recentWinnerIndexes: [],
			excludedIndexes: []
		} );
	} );
} );
