import bellRingUrl from 'ion-sound/sounds/bell_ring.mp3';
import clickSoundUrl from 'ion-sound/sounds/snap.mp3';

function createSoundTemplate( AudioClass, url, volume ) {
	if ( !AudioClass ) {
		return null;
	}

	const sound = new AudioClass( url );

	sound.preload = 'auto';
	sound.volume = volume;

	return sound;
}

function playSound( AudioClass, template, { volume, playbackRate = 1 } = {} ) {
	if ( !AudioClass || !template ) {
		return;
	}

	const sound = new AudioClass( template.src );

	sound.preload = 'auto';
	sound.volume = volume;
	sound.playbackRate = playbackRate;
	sound.currentTime = 0;

	const playResult = sound.play();

	if ( typeof playResult?.catch === 'function' ) {
		playResult.catch( () => {} );
	}
}

export function createAudioPlayer( {
	AudioClass = typeof window !== 'undefined' ? window.Audio : null,
	clickUrl = clickSoundUrl,
	bellUrl = bellRingUrl
} = {} ) {
	const clickTemplate = createSoundTemplate( AudioClass, clickUrl, 0.18 );
	const bellTemplate = createSoundTemplate( AudioClass, bellUrl, 0.25 );
	let isPrepared = false;

	function ensureAudioContext() {
		if ( !clickTemplate || !bellTemplate ) {
			return null;
		}

		if ( !isPrepared ) {
			clickTemplate.load();
			bellTemplate.load();
			isPrepared = true;
		}

		return true;
	}

	function playTick( intensity = 1 ) {
		const clamped = Math.max( 0.35, Math.min( 1, intensity ) );

		playSound( AudioClass, clickTemplate, {
			volume: 0.08 + clamped * 0.08,
			playbackRate: 0.94 + clamped * 0.12
		} );
	}

	function playBell() {
		playSound( AudioClass, bellTemplate, { volume: 0.25 } );
	}

	return {
		ensureAudioContext,
		playTick,
		playBell
	};
}
