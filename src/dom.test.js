// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getElements } from './dom.js';

describe( 'dom', () => {
	const ctx = { marker: '2d-context' };
	let getContextSpy;

	beforeEach( () => {
		document.body.innerHTML = `
            <button id="itemsTabBtn"></button>
            <button id="rosterTabBtn"></button>
            <div id="itemsTab"></div>
            <div id="rosterTab"></div>
            <textarea id="items"></textarea>
            <button id="spinBtn"></button>
            <button id="resetBtn"></button>
            <button id="soundBtn"></button>
            <button id="themeBtn"></button>
            <button id="newRoundBtn"></button>
            <button id="startMeetingBtn"></button>
            <button id="stopMeetingBtn"></button>
            <div id="meetingStatus"></div>
            <div id="meetingSummary"><ol id="meetingSummaryList"></ol></div>
            <ul id="roster"></ul>
            <div id="counter"></div>
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
		expect( elements.soundBtn.id ).toBe( 'soundBtn' );
		expect( elements.themeBtn.id ).toBe( 'themeBtn' );
		expect( elements.newRoundBtn.id ).toBe( 'newRoundBtn' );
		expect( elements.startMeetingBtn.id ).toBe( 'startMeetingBtn' );
		expect( elements.stopMeetingBtn.id ).toBe( 'stopMeetingBtn' );
		expect( elements.meetingStatusEl.id ).toBe( 'meetingStatus' );
		expect( elements.meetingSummaryEl.id ).toBe( 'meetingSummary' );
		expect( elements.meetingSummaryListEl.id ).toBe( 'meetingSummaryList' );
		expect( elements.itemsTabBtn.id ).toBe( 'itemsTabBtn' );
		expect( elements.rosterTabBtn.id ).toBe( 'rosterTabBtn' );
		expect( elements.itemsTab.id ).toBe( 'itemsTab' );
		expect( elements.rosterTab.id ).toBe( 'rosterTab' );
		expect( elements.rosterEl.id ).toBe( 'roster' );
		expect( elements.counterEl.id ).toBe( 'counter' );
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
