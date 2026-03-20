import { describe, expect, it, vi } from 'vitest';

import { createAudioPlayer } from './audio.js';

function createFakeAudioClass() {
	const instances = [];

	class FakeAudio {
		constructor( src ) {
			this.src = src;
			this.preload = 'none';
			this.volume = 1;
			this.playbackRate = 1;
			this.currentTime = 5;
			this.load = vi.fn();
			this.play = vi.fn( () => Promise.resolve() );

			instances.push( this );
		}
	}

	return {
		FakeAudio,
		instances
	};
}

describe( 'audio', () => {
	it( 'returns null when audio playback is unavailable', () => {
		const player = createAudioPlayer( { AudioClass: null } );

		expect( player.ensureAudioContext() ).toBeNull();
	} );

	it( 'preloads the click and bell assets once', () => {
		const { FakeAudio, instances } = createFakeAudioClass();
		const player = createAudioPlayer( {
			AudioClass: FakeAudio,
			clickUrl: '/click.mp3',
			bellUrl: '/bell.mp3'
		} );

		expect( instances ).toHaveLength( 2 );
		expect( instances[ 0 ].src ).toBe( '/click.mp3' );
		expect( instances[ 1 ].src ).toBe( '/bell.mp3' );

		expect( player.ensureAudioContext() ).toBe( true );
		expect( instances[ 0 ].load ).toHaveBeenCalledOnce();
		expect( instances[ 1 ].load ).toHaveBeenCalledOnce();

		player.ensureAudioContext();
		expect( instances[ 0 ].load ).toHaveBeenCalledOnce();
		expect( instances[ 1 ].load ).toHaveBeenCalledOnce();
	} );

	it( 'plays a click from the packaged sound with intensity-based shaping', async () => {
		const { FakeAudio, instances } = createFakeAudioClass();
		const player = createAudioPlayer( {
			AudioClass: FakeAudio,
			clickUrl: '/click.mp3',
			bellUrl: '/bell.mp3'
		} );

		player.playTick( 1.5 );

		expect( instances ).toHaveLength( 3 );
		expect( instances[ 2 ].src ).toBe( '/click.mp3' );
		expect( instances[ 2 ].preload ).toBe( 'auto' );
		expect( instances[ 2 ].volume ).toBeCloseTo( 0.16, 6 );
		expect( instances[ 2 ].playbackRate ).toBeCloseTo( 1.06, 6 );
		expect( instances[ 2 ].currentTime ).toBe( 0 );
		expect( instances[ 2 ].play ).toHaveBeenCalledOnce();

		await instances[ 2 ].play.mock.results[ 0 ].value;
	} );

	it( 'plays the packaged bell ring when the spin finishes', async () => {
		const { FakeAudio, instances } = createFakeAudioClass();
		const player = createAudioPlayer( {
			AudioClass: FakeAudio,
			clickUrl: '/click.mp3',
			bellUrl: '/bell.mp3'
		} );

		player.playBell();

		expect( instances ).toHaveLength( 3 );
		expect( instances[ 2 ].src ).toBe( '/bell.mp3' );
		expect( instances[ 2 ].volume ).toBe( 0.25 );
		expect( instances[ 2 ].playbackRate ).toBe( 1 );
		expect( instances[ 2 ].currentTime ).toBe( 0 );
		expect( instances[ 2 ].play ).toHaveBeenCalledOnce();

		await instances[ 2 ].play.mock.results[ 0 ].value;
	} );

	it( 'supports toggling the muted state', () => {
		const { FakeAudio } = createFakeAudioClass();
		const player = createAudioPlayer( {
			AudioClass: FakeAudio,
			clickUrl: '/click.mp3',
			bellUrl: '/bell.mp3'
		} );

		expect( player.isMuted() ).toBe( false );
		expect( player.toggleMuted() ).toBe( true );
		expect( player.isMuted() ).toBe( true );
		expect( player.setMuted( false ) ).toBe( false );
		expect( player.isMuted() ).toBe( false );
	} );

	it( 'does not play sounds when muted', () => {
		const { FakeAudio, instances } = createFakeAudioClass();
		const player = createAudioPlayer( {
			AudioClass: FakeAudio,
			clickUrl: '/click.mp3',
			bellUrl: '/bell.mp3',
			muted: true
		} );

		player.playTick( 1 );
		player.playBell();

		expect( instances ).toHaveLength( 2 );
	} );
} );
