import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAudioPlayer } from './audio.js';

function createFakeAudioContext( { state = 'running' } = {} ) {
	const oscillator = {
		connect: vi.fn(),
		start: vi.fn(),
		stop: vi.fn(),
		frequency: {
			setValueAtTime: vi.fn(),
			exponentialRampToValueAtTime: vi.fn()
		},
		type: 'sine'
	};

	const gainNode = {
		connect: vi.fn(),
		gain: {
			setValueAtTime: vi.fn(),
			exponentialRampToValueAtTime: vi.fn()
		}
	};

	const filter = {
		connect: vi.fn(),
		frequency: {
			setValueAtTime: vi.fn()
		},
		type: 'lowpass'
	};

	class FakeAudioContext {
		constructor() {
			this.state = state;
			this.currentTime = 12;
			this.destination = { marker: 'destination' };
			this.resume = vi.fn( () => Promise.resolve() );
		}

		createOscillator() {
			return oscillator;
		}

		createGain() {
			return gainNode;
		}

		createBiquadFilter() {
			return filter;
		}
	}

	return {
		FakeAudioContext,
		oscillator,
		gainNode,
		filter
	};
}

describe( 'audio', () => {
	beforeEach( () => {
		vi.unstubAllGlobals();
	} );

	afterEach( () => {
		vi.unstubAllGlobals();
	} );

	it( 'returns null when audio context is unavailable', () => {
		vi.stubGlobal( 'window', {} );

		const player = createAudioPlayer();

		expect( player.ensureAudioContext() ).toBeNull();
	} );

	it( 'creates and resumes the audio context once when suspended', () => {
		const { FakeAudioContext } = createFakeAudioContext( { state: 'suspended' } );
		vi.stubGlobal( 'window', { AudioContext: FakeAudioContext } );

		const player = createAudioPlayer();
		const first = player.ensureAudioContext();
		const second = player.ensureAudioContext();

		expect( first ).toBe( second );
		expect( first.resume ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'plays a tick with the expected audio graph', () => {
		const { FakeAudioContext, oscillator, gainNode, filter } = createFakeAudioContext();
		vi.stubGlobal( 'window', { AudioContext: FakeAudioContext } );

		const player = createAudioPlayer();
		player.playTick( 1.5 );

		expect( oscillator.type ).toBe( 'square' );
		expect( oscillator.frequency.setValueAtTime ).toHaveBeenCalledWith( 1250, 12 );
		expect( oscillator.frequency.exponentialRampToValueAtTime ).toHaveBeenCalledWith( 830, 12.02 );
		expect( filter.type ).toBe( 'highpass' );
		expect( filter.frequency.setValueAtTime ).toHaveBeenCalledWith( 650, 12 );
		expect( gainNode.gain.setValueAtTime ).toHaveBeenCalledWith( 0.0001, 12 );
		expect( oscillator.connect ).toHaveBeenCalledWith( filter );
		expect( filter.connect ).toHaveBeenCalledWith( gainNode );
		expect( gainNode.connect ).toHaveBeenCalledWith( expect.objectContaining( { marker: 'destination' } ) );
		expect( oscillator.start ).toHaveBeenCalledWith( 12 );
		expect( oscillator.stop ).toHaveBeenCalledWith( 12.047 );
	} );
} );
