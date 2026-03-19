import { expect, test } from '@playwright/test';

const defaultItems = [ 'Pizza', 'Burger', 'Sushi', 'Taco', 'Kebab', 'Ramen' ];

async function stubBrowserApis( page ) {
	await page.addInitScript( () => {
		class FakeAudioNode {
			connect() {}
		}

		class FakeOscillator extends FakeAudioNode {
			constructor() {
				super();
				this.frequency = {
					setValueAtTime() {},
					exponentialRampToValueAtTime() {}
				};
			}

			start() {}

			stop() {}
		}

		class FakeGainNode extends FakeAudioNode {
			constructor() {
				super();
				this.gain = {
					setValueAtTime() {},
					exponentialRampToValueAtTime() {}
				};
			}
		}

		class FakeBiquadFilterNode extends FakeAudioNode {
			constructor() {
				super();
				this.frequency = {
					setValueAtTime() {}
				};
				this.type = 'highpass';
			}
		}

		class FakeAudioContext {
			constructor() {
				this.state = 'running';
				this.currentTime = 0;
				this.destination = {};
			}

			resume() {
				return Promise.resolve();
			}

			createOscillator() {
				return new FakeOscillator();
			}

			createGain() {
				return new FakeGainNode();
			}

			createBiquadFilter() {
				return new FakeBiquadFilterNode();
			}
		}

		window.AudioContext = FakeAudioContext;
		window.webkitAudioContext = FakeAudioContext;

		window.requestAnimationFrame = callback => {
			return window.setTimeout( () => callback( window.performance.now() + 20000 ), 0 );
		};

		window.cancelAnimationFrame = handle => {
			window.clearTimeout( handle );
		};
	} );
}

test.beforeEach( async ( { page } ) => {
	await stubBrowserApis( page );
	await page.goto( '/index.html' );
} );

test( 'loads the app with default controls', async ( { page } ) => {
	await expect( page ).toHaveTitle( 'Wheel of Fortune' );
	await expect( page.getByRole( 'heading', { name: 'Wheel of Fortune' } ) ).toBeVisible();
	await expect( page.getByRole( 'button', { name: 'Update wheel' } ) ).toBeVisible();
	await expect( page.getByRole( 'button', { name: 'Spin' } ) ).toBeVisible();
	await expect( page.getByRole( 'button', { name: 'Reset' } ) ).toBeVisible();
	await expect( page.getByLabel( 'Wheel items' ) ).toHaveValue( defaultItems.join( '\n' ) );
} );

test( 'shows validation when there are fewer than two items', async ( { page } ) => {
	await page.getByLabel( 'Wheel items' ).fill( 'Only one' );
	await page.getByRole( 'button', { name: 'Spin' } ).click();

	await expect( page.locator( '#result' ) ).toHaveText( 'Add at least 2 items.' );
} );

test( 'spins the wheel and shows a selected item', async ( { page } ) => {
	const items = [ 'Apple', 'Banana', 'Cherry', 'Date' ];

	await page.getByLabel( 'Wheel items' ).fill( items.join( '\n' ) );
	await page.getByRole( 'button', { name: 'Update wheel' } ).click();
	await page.getByRole( 'button', { name: 'Spin' } ).click();

	await expect( page.locator( '#result' ) ).toContainText( 'Selected:' );

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

test( 'does not repeat the same winner after a reload for the same list', async ( { page } ) => {
	const items = [ 'Alice', 'Bob', 'Carol' ];

	await page.getByLabel( 'Wheel items' ).fill( items.join( '\n' ) );
	await page.getByRole( 'button', { name: 'Update wheel' } ).click();
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
	await page.getByRole( 'button', { name: 'Update wheel' } ).click();
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

test( 'persists custom items in the shareable URL', async ( { page } ) => {
	const items = [ 'Alice', 'Bob', 'Carol' ];

	await page.getByLabel( 'Wheel items' ).fill( items.join( '\n' ) );
	await page.getByLabel( 'Wheel items' ).blur();

	await expect.poll( () => new URL( page.url() ).hash ).toMatch( /^#\/.+/ );

	await page.reload();

	await expect( page.getByLabel( 'Wheel items' ) ).toHaveValue( items.join( '\n' ) );
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
