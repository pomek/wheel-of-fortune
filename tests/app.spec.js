import { expect, test } from '@playwright/test';

const defaultItems = [ 'Pizza', 'Burger', 'Sushi', 'Taco', 'Kebab', 'Ramen' ];
const defaultStateStorageKey = 'wheel-of-fortune:state:#default';
const mutedAudioStorageKey = 'wheel-of-fortune:audio:muted';
const sharedHash = '#/LIIQUMAKYNLZBlMAxJkBaQ';
const sharedHashItems = [ 'MB', 'MP', 'KP', 'PS', 'FS', 'PZ' ];

async function stubBrowserApis( page ) {
	await page.addInitScript( () => {
		window.requestAnimationFrame = callback => {
			return window.setTimeout( () => callback( window.performance.now() + 20000 ), 0 );
		};

		window.cancelAnimationFrame = handle => {
			window.clearTimeout( handle );
		};
	} );
}

async function clickWheelSegment( page, index, totalSegments ) {
	const wheel = page.locator( '#wheel' );
	const box = await wheel.boundingBox();
	const angle = ( ( index + 0.5 ) / totalSegments ) * Math.PI * 2;
	const radius = ( box?.width ?? 0 ) * 0.3;

	await wheel.click( {
		position: {
			x: ( box?.width ?? 0 ) / 2 + Math.cos( angle ) * radius,
			y: ( box?.height ?? 0 ) / 2 + Math.sin( angle ) * radius
		}
	} );
}

async function getPersistedWheelState( page ) {
	return page.evaluate( () => {
		const storageKey = `wheel-of-fortune:state:${ window.location.hash || '#default' }`;
		const rawValue = window.localStorage.getItem( storageKey );

		return rawValue ? JSON.parse( rawValue ) : null;
	} );
}

test.beforeEach( async ( { page } ) => {
	await stubBrowserApis( page );
	await page.goto( '/index.html' );
} );

test( 'loads the app with default controls', async ( { page } ) => {
	await expect( page ).toHaveTitle( 'Wheel of Fortune' );
	await expect( page.getByRole( 'heading', { name: 'Wheel of Fortune' } ) ).toBeVisible();
	await expect( page.getByRole( 'button', { name: 'Spin' } ) ).toBeVisible();
	await expect( page.getByRole( 'button', { name: 'Reset' } ) ).toBeVisible();
	await expect( page.getByRole( 'button', { name: 'Mute sounds' } ) ).toBeVisible();
	const textarea = page.getByLabel( 'Wheel items' );

	await expect( textarea ).toHaveValue( defaultItems.join( '\n' ) );
	await expect( textarea ).toHaveAttribute( 'aria-describedby', 'itemsHelp' );
	await expect( page.locator( '#wheel' ) ).toHaveAttribute( 'role', 'img' );
	await expect( page.locator( '#wheel' ) ).toHaveAttribute( 'aria-label', 'Wheel of Fortune segments' );
	await expect( page.locator( '#result' ) ).toHaveAttribute( 'role', 'status' );
	await expect( page.locator( '#result' ) ).toHaveAttribute( 'aria-live', 'polite' );
	await expect( page.locator( '.pointer' ) ).toHaveAttribute( 'aria-hidden', 'true' );
	await expect( page.locator( '#toast' ) ).toHaveAttribute( 'aria-hidden', 'true' );
	await expect( page.getByRole( 'button', { name: 'Mute sounds' } ) ).toHaveAttribute( 'aria-pressed', 'false' );
} );

test( 'persists sound mute preference in local storage', async ( { page } ) => {
	const muteButton = page.getByRole( 'button', { name: 'Mute sounds' } );

	await muteButton.click();
	await expect( page.getByRole( 'button', { name: 'Unmute sounds' } ) ).toHaveAttribute( 'aria-pressed', 'true' );
	await expect.poll( async () => page.evaluate( key => window.localStorage.getItem( key ), mutedAudioStorageKey ) ).toBe( '1' );

	await page.reload();

	const unmuteButton = page.getByRole( 'button', { name: 'Unmute sounds' } );

	await expect( unmuteButton ).toHaveAttribute( 'aria-pressed', 'true' );
	await unmuteButton.click();
	await expect( page.getByRole( 'button', { name: 'Mute sounds' } ) ).toHaveAttribute( 'aria-pressed', 'false' );
	await expect.poll( async () => page.evaluate( key => window.localStorage.getItem( key ), mutedAudioStorageKey ) ).toBeNull();
} );

test( 'shows validation when there are fewer than two items', async ( { page } ) => {
	await page.getByLabel( 'Wheel items' ).fill( 'Only one' );
	await page.getByRole( 'button', { name: 'Spin' } ).click();

	await expect( page.locator( '#result' ) ).toHaveText( 'Keep at least 2 active items.' );
} );

test( 'clicking a segment excludes it from the draw and clicking again restores it', async ( { page } ) => {
	const items = [ 'Alice', 'Bob', 'Carol' ];

	await page.getByLabel( 'Wheel items' ).fill( items.join( '\n' ) );
	await page.getByLabel( 'Wheel items' ).blur();
	await clickWheelSegment( page, 0, items.length );

	await expect.poll( async () => ( await getPersistedWheelState( page ) )?.excludedIndexes ).toEqual( [ 0 ] );
	await expect( page.locator( '#toast' ) ).toHaveText( 'Excluded: Alice' );

	await page.getByRole( 'button', { name: 'Spin' } ).click();
	await expect( page.locator( '#result' ) ).toContainText( 'Selected:' );
	await expect( page.locator( '#result' ) ).not.toHaveText( 'Selected: Alice' );

	await clickWheelSegment( page, 0, items.length );

	await expect.poll( async () => ( await getPersistedWheelState( page ) )?.excludedIndexes ).toEqual( [] );
	await expect( page.locator( '#toast' ) ).toHaveText( 'Back in draw: Alice' );
	await page.reload();
	await expect.poll( async () => ( await getPersistedWheelState( page ) )?.excludedIndexes ).toEqual( [] );
} );

test( 'keeps at least two active items when excluding segments', async ( { page } ) => {
	const items = [ 'Alice', 'Bob', 'Carol' ];

	await page.getByLabel( 'Wheel items' ).fill( items.join( '\n' ) );
	await page.getByLabel( 'Wheel items' ).blur();
	await clickWheelSegment( page, 0, items.length );
	await clickWheelSegment( page, 1, items.length );

	await expect.poll( async () => ( await getPersistedWheelState( page ) )?.excludedIndexes ).toEqual( [ 0 ] );
	await expect( page.locator( '#toast' ) ).toHaveText( 'Keep at least 2 active items.' );
	await page.getByRole( 'button', { name: 'Spin' } ).click();
	await expect( page.locator( '#result' ) ).toContainText( 'Selected:' );
	await expect( page.locator( '#result' ) ).not.toHaveText( 'Selected: Alice' );
} );

test( 'spins the wheel and shows a selected item', async ( { page } ) => {
	const items = [ 'Apple', 'Banana', 'Cherry', 'Date' ];

	await page.getByLabel( 'Wheel items' ).fill( items.join( '\n' ) );
	await page.getByLabel( 'Wheel items' ).blur();
	await page.getByRole( 'button', { name: 'Spin' } ).click();

	await expect( page.locator( '#result' ) ).toContainText( 'Selected:' );
	await expect( page.locator( '#toast' ) ).toContainText( 'Selected:' );

	const resultText = await page.locator( '#result' ).textContent();
	expect( items ).toContain( resultText.replace( 'Selected: ', '' ) );
} );

test( 'pressing Space starts the spin when the textarea is not focused', async ( { page } ) => {
	await page.locator( 'body' ).click( { position: { x: 20, y: 20 } } );
	await page.keyboard.press( 'Space' );

	await expect( page.locator( '#result' ) ).toContainText( 'Selected:' );
} );

test( 'focusing the textarea stops an active spin', async ( { page } ) => {
	await page.evaluate( () => {
		let frame = 0;

		window.requestAnimationFrame = callback => {
			return window.setTimeout( () => {
				frame += 1;
				callback( frame * 450 );
			}, 60 );
		};

		window.cancelAnimationFrame = handle => {
			window.clearTimeout( handle );
		};
	} );

	const spinButton = page.getByRole( 'button', { name: 'Spin' } );
	const textarea = page.getByLabel( 'Wheel items' );

	await spinButton.click();
	await expect( spinButton ).toBeDisabled();

	await textarea.focus();
	await expect( spinButton ).toBeEnabled();
	await page.waitForTimeout( 200 );
	await expect( page.locator( '#result' ) ).toHaveText( '' );
	await expect( textarea ).toBeFocused();
} );

test( 'reset stops an active spin before it can finish', async ( { page } ) => {
	await page.evaluate( () => {
		let frame = 0;

		window.requestAnimationFrame = callback => {
			return window.setTimeout( () => {
				frame += 1;
				callback( frame * 9000 );
			}, 60 );
		};

		window.cancelAnimationFrame = handle => {
			window.clearTimeout( handle );
		};
	} );

	const spinButton = page.getByRole( 'button', { name: 'Spin' } );
	const resetButton = page.getByRole( 'button', { name: 'Reset' } );
	const result = page.locator( '#result' );

	await spinButton.click();
	await expect( spinButton ).toBeDisabled();

	await resetButton.click();
	await expect( spinButton ).toBeEnabled();
	await expect( page.getByLabel( 'Wheel items' ) ).toHaveValue( defaultItems.join( '\n' ) );
	await expect( result ).toHaveText( '' );
	await expect( page.locator( '#toast' ) ).toHaveText( '' );

	await page.waitForTimeout( 250 );
	await expect( result ).toHaveText( '' );
} );

test( 'reset clears persisted default state while using a custom list', async ( { page } ) => {
	const textarea = page.getByLabel( 'Wheel items' );
	const spinButton = page.getByRole( 'button', { name: 'Spin' } );

	await spinButton.click();
	await expect( page.locator( '#result' ) ).toContainText( 'Selected:' );
	await expect.poll( async () => page.evaluate( key => window.localStorage.getItem( key ), defaultStateStorageKey ) ).not.toBeNull();

	await textarea.fill( 'Alice\nBob\nCarol' );
	await textarea.blur();
	await expect.poll( () => new URL( page.url() ).hash ).toMatch( /^#\/.+/ );

	await page.getByRole( 'button', { name: 'Reset' } ).click();

	await expect.poll( () => new URL( page.url() ).hash ).toBe( '' );
	await expect( textarea ).toHaveValue( defaultItems.join( '\n' ) );
	await expect.poll( async () => page.evaluate( key => window.localStorage.getItem( key ), defaultStateStorageKey ) ).toBeNull();
} );

test( 'does not repeat the same winner after a reload for the same list', async ( { page } ) => {
	const items = [ 'Alice', 'Bob', 'Carol' ];

	await page.getByLabel( 'Wheel items' ).fill( items.join( '\n' ) );
	await page.getByLabel( 'Wheel items' ).blur();
	await page.getByRole( 'button', { name: 'Spin' } ).click();
	await expect( page.locator( '#result' ) ).toContainText( 'Selected:' );

	const firstWinner = ( await page.locator( '#result' ).textContent() ).replace( 'Selected: ', '' );

	await page.reload();
	await page.getByRole( 'button', { name: 'Spin' } ).click();
	await expect( page.locator( '#result' ) ).toContainText( 'Selected:' );

	const secondWinner = ( await page.locator( '#result' ).textContent() ).replace( 'Selected: ', '' );

	expect( secondWinner ).not.toBe( firstWinner );
	expect( items ).toContain( secondWinner );
} );

test( 'avoids the previous two winners when enough items exist', async ( { page } ) => {
	const items = [ 'Alice', 'Bob', 'Carol', 'Dave' ];

	await page.getByLabel( 'Wheel items' ).fill( items.join( '\n' ) );
	await page.getByLabel( 'Wheel items' ).blur();
	await page.getByRole( 'button', { name: 'Spin' } ).click();
	await expect( page.locator( '#result' ) ).toContainText( 'Selected:' );

	const firstWinner = ( await page.locator( '#result' ).textContent() ).replace( 'Selected: ', '' );

	await page.reload();
	await page.getByRole( 'button', { name: 'Spin' } ).click();
	await expect( page.locator( '#result' ) ).toContainText( 'Selected:' );

	const secondWinner = ( await page.locator( '#result' ).textContent() ).replace( 'Selected: ', '' );

	await page.reload();
	await page.getByRole( 'button', { name: 'Spin' } ).click();
	await expect( page.locator( '#result' ) ).toContainText( 'Selected:' );

	const thirdWinner = ( await page.locator( '#result' ).textContent() ).replace( 'Selected: ', '' );

	expect( thirdWinner ).not.toBe( firstWinner );
	expect( thirdWinner ).not.toBe( secondWinner );
	expect( items ).toContain( thirdWinner );
} );

test( 'pressing Enter in the textarea updates the wheel state', async ( { page } ) => {
	const textarea = page.getByLabel( 'Wheel items' );

	await textarea.fill( 'Alice\nBob' );
	await textarea.press( 'End' );
	await textarea.press( 'Enter' );

	await expect.poll( () => new URL( page.url() ).hash ).toMatch( /^#\/.+/ );
} );

test( 'typing updates the wheel state after a short debounce', async ( { page } ) => {
	const textarea = page.getByLabel( 'Wheel items' );

	await page.clock.install();

	await textarea.focus();
	await textarea.evaluate( element => {
		element.value = 'Alice\nBob';
		element.dispatchEvent( new Event( 'input', { bubbles: true } ) );
	} );

	await expect( textarea ).toBeFocused();
	expect( new URL( page.url() ).hash ).toBe( '' );
	await page.clock.runFor( 100 );
	expect( new URL( page.url() ).hash ).toBe( '' );

	await textarea.evaluate( element => {
		element.value = 'Alice\nBob\nCarol';
		element.dispatchEvent( new Event( 'input', { bubbles: true } ) );
	} );

	expect( new URL( page.url() ).hash ).toBe( '' );
	await page.clock.runFor( 100 );
	expect( new URL( page.url() ).hash ).toBe( '' );

	await page.clock.runFor( 80 );

	await expect.poll( () => new URL( page.url() ).hash ).toMatch( /^#\/.+/ );
} );

test( 'persists custom items in the shareable URL', async ( { page } ) => {
	const items = [ 'Alice', 'Bob', 'Carol' ];

	await page.getByLabel( 'Wheel items' ).fill( items.join( '\n' ) );
	await page.getByLabel( 'Wheel items' ).blur();

	await expect.poll( () => new URL( page.url() ).hash ).toMatch( /^#\/.+/ );

	await page.reload();

	await expect( page.getByLabel( 'Wheel items' ) ).toHaveValue( items.join( '\n' ) );
} );

test( 'updates the wheel when the URL hash changes without reload', async ( { page } ) => {
	await page.evaluate( hash => {
		window.location.hash = hash;
	}, sharedHash );

	await expect.poll( () => new URL( page.url() ).hash ).toBe( sharedHash );
	await expect( page.getByLabel( 'Wheel items' ) ).toHaveValue( sharedHashItems.join( '\n' ) );

	await page.getByRole( 'button', { name: 'Spin' } ).click();
	await expect( page.locator( '#result' ) ).toContainText( 'Selected:' );

	const winner = ( await page.locator( '#result' ).textContent() ).replace( 'Selected: ', '' );

	expect( sharedHashItems ).toContain( winner );
} );

test( 'reset restores the default items and clears the result', async ( { page } ) => {
	await page.getByLabel( 'Wheel items' ).fill( 'Apple\nBanana\nCherry' );
	await page.getByLabel( 'Wheel items' ).blur();
	await expect.poll( () => new URL( page.url() ).hash ).toMatch( /^#\/.+/ );
	await page.getByRole( 'button', { name: 'Spin' } ).click();
	await expect( page.locator( '#result' ) ).toContainText( 'Selected:' );

	await page.getByRole( 'button', { name: 'Reset' } ).click();

	await expect( page.getByLabel( 'Wheel items' ) ).toHaveValue( defaultItems.join( '\n' ) );
	await expect( page.locator( '#result' ) ).toHaveText( '' );
	await expect.poll( () => new URL( page.url() ).hash ).toBe( '' );
} );
