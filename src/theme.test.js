import { describe, expect, it, vi } from 'vitest';

import {
	applyTheme,
	getInitialTheme,
	loadThemePreference,
	saveThemePreference,
	THEMES
} from './theme.js';

function createStorage( initial = {} ) {
	const values = new Map( Object.entries( initial ) );

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

function createMatchMedia( prefersLight ) {
	return vi.fn( query => ( {
		matches: prefersLight && query === '(prefers-color-scheme: light)',
		media: query
	} ) );
}

describe( 'theme', () => {
	describe( 'loadThemePreference', () => {
		it( 'returns null when nothing is stored', () => {
			expect( loadThemePreference( { storage: createStorage() } ) ).toBeNull();
		} );

		it( 'returns the stored theme when valid', () => {
			const storage = createStorage( { 'wheel-of-fortune:theme': THEMES.LIGHT } );

			expect( loadThemePreference( { storage } ) ).toBe( THEMES.LIGHT );
		} );

		it( 'returns null when stored value is invalid', () => {
			const storage = createStorage( { 'wheel-of-fortune:theme': 'neon' } );

			expect( loadThemePreference( { storage } ) ).toBeNull();
		} );

		it( 'returns null when storage throws', () => {
			const storage = {
				getItem() {
					throw new Error( 'denied' );
				}
			};

			expect( loadThemePreference( { storage } ) ).toBeNull();
		} );

		it( 'returns null when storage is missing', () => {
			expect( loadThemePreference( { storage: null } ) ).toBeNull();
		} );
	} );

	describe( 'saveThemePreference', () => {
		it( 'persists valid themes', () => {
			const storage = createStorage();

			saveThemePreference( THEMES.LIGHT, { storage } );

			expect( storage.getItem( 'wheel-of-fortune:theme' ) ).toBe( THEMES.LIGHT );
		} );

		it( 'ignores invalid themes', () => {
			const storage = createStorage();

			saveThemePreference( 'neon', { storage } );

			expect( storage.getItem( 'wheel-of-fortune:theme' ) ).toBeNull();
		} );

		it( 'swallows storage errors', () => {
			const storage = {
				setItem() {
					throw new Error( 'denied' );
				}
			};

			expect( () => saveThemePreference( THEMES.DARK, { storage } ) ).not.toThrow();
		} );
	} );

	describe( 'getInitialTheme', () => {
		it( 'returns the stored theme when present', () => {
			const storage = createStorage( { 'wheel-of-fortune:theme': THEMES.LIGHT } );
			const matchMedia = createMatchMedia( false );

			expect( getInitialTheme( { storage, matchMedia } ) ).toBe( THEMES.LIGHT );
			expect( matchMedia ).not.toHaveBeenCalled();
		} );

		it( 'falls back to prefers-color-scheme when light', () => {
			const storage = createStorage();
			const matchMedia = createMatchMedia( true );

			expect( getInitialTheme( { storage, matchMedia } ) ).toBe( THEMES.LIGHT );
		} );

		it( 'falls back to dark when no preference matches', () => {
			const storage = createStorage();
			const matchMedia = createMatchMedia( false );

			expect( getInitialTheme( { storage, matchMedia } ) ).toBe( THEMES.DARK );
		} );

		it( 'returns dark when matchMedia is unavailable', () => {
			const storage = createStorage();

			expect( getInitialTheme( { storage, matchMedia: null } ) ).toBe( THEMES.DARK );
		} );
	} );

	describe( 'applyTheme', () => {
		it( 'sets the data-theme attribute on the root', () => {
			const root = { setAttribute: vi.fn() };

			applyTheme( THEMES.LIGHT, { root } );

			expect( root.setAttribute ).toHaveBeenCalledWith( 'data-theme', 'light' );
		} );

		it( 'ignores invalid themes', () => {
			const root = { setAttribute: vi.fn() };

			applyTheme( 'neon', { root } );

			expect( root.setAttribute ).not.toHaveBeenCalled();
		} );
	} );
} );
