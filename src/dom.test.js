// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getElements } from './dom.js';

describe( 'dom', () => {
	const ctx = { marker: '2d-context' };
	let getContextSpy;

	beforeEach( () => {
		document.body.innerHTML = `
            <textarea id="items"></textarea>
            <button id="spinBtn"></button>
            <button id="resetBtn"></button>
            <div id="result"></div>
            <div id="toast"></div>
            <canvas id="wheel"></canvas>
        `;

		getContextSpy = vi
			.spyOn( HTMLCanvasElement.prototype, 'getContext' )
			.mockReturnValue( ctx );
	} );

	afterEach( () => {
		getContextSpy.mockRestore();
		document.body.innerHTML = '';
	} );

	it( 'returns the expected DOM references', () => {
		const elements = getElements();

		expect( elements.textarea.id ).toBe( 'items' );
		expect( elements.spinBtn.id ).toBe( 'spinBtn' );
		expect( elements.resetBtn.id ).toBe( 'resetBtn' );
		expect( elements.resultEl.id ).toBe( 'result' );
		expect( elements.toastEl.id ).toBe( 'toast' );
		expect( elements.canvas.id ).toBe( 'wheel' );
		expect( elements.ctx ).toBe( ctx );
		expect( getContextSpy ).toHaveBeenCalledWith( '2d' );
	} );

	it( 'throws when a required element is missing', () => {
		document.getElementById( 'items' ).remove();

		expect( () => getElements() ).toThrow( 'Missing required element: #items' );
	} );

	it( 'throws when the wheel canvas has no 2d context', () => {
		getContextSpy.mockReturnValueOnce( null );

		expect( () => getElements() ).toThrow( 'Canvas #wheel does not support a 2d context.' );
	} );
} );
