import { describe, expect, it } from 'vitest';

import { createState } from './state.js';

describe( 'state', () => {
	it( 'creates the default application state', () => {
		expect( createState() ).toEqual( {
			items: [],
			excludedIndexes: [],
			talkedIndexes: [],
			rotation: 0,
			isSpinning: false,
			activeWinnerIndex: null,
			isWinnerHighlightVisible: true,
			lastPointerIndex: null,
			recentWinnerIndexes: [],
			speakingTimes: {},
			activeSpeakerIndex: null,
			speakerStartedAt: null,
			isMeetingActive: false,
			hasMeetingSummary: false,
			lastSelectedIndex: null
		} );
	} );

	it( 'returns a fresh state object each time', () => {
		const first = createState();
		const second = createState();

		first.items.push( 'Pizza' );

		expect( second.items ).toEqual( [] );
	} );
} );
