export const THEMES = {
	LIGHT: 'light',
	DARK: 'dark'
};

const THEME_STORAGE_KEY = 'wheel-of-fortune:theme';

function isValidTheme( value ) {
	return value === THEMES.LIGHT || value === THEMES.DARK;
}

export function loadThemePreference( {
	storage = window.localStorage
} = {} ) {
	if ( !storage ) {
		return null;
	}

	try {
		const value = storage.getItem( THEME_STORAGE_KEY );

		return isValidTheme( value ) ? value : null;
	} catch {
		return null;
	}
}

export function saveThemePreference( theme, {
	storage = window.localStorage
} = {} ) {
	if ( !storage || !isValidTheme( theme ) ) {
		return;
	}

	try {
		storage.setItem( THEME_STORAGE_KEY, theme );
	} catch {
		// Ignore storage failures.
	}
}

export function getInitialTheme( {
	storage = window.localStorage,
	matchMedia = typeof window !== 'undefined' ? window.matchMedia : null
} = {} ) {
	const stored = loadThemePreference( { storage } );

	if ( stored ) {
		return stored;
	}

	if ( typeof matchMedia === 'function' && matchMedia( '(prefers-color-scheme: light)' ).matches ) {
		return THEMES.LIGHT;
	}

	return THEMES.DARK;
}

export function applyTheme( theme, {
	root = document.documentElement
} = {} ) {
	if ( !root || !isValidTheme( theme ) ) {
		return;
	}

	root.setAttribute( 'data-theme', theme );
}
