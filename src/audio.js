export function createAudioPlayer() {
	let audioContext = null;

	function ensureAudioContext() {
		if ( !audioContext ) {
			const AudioContextClass = window.AudioContext || window.webkitAudioContext;
			if ( !AudioContextClass ) {
				return null;
			}

			audioContext = new AudioContextClass();
		}

		if ( audioContext.state === 'suspended' ) {
			audioContext.resume();
		}

		return audioContext;
	}

	function playTick( intensity = 1 ) {
		const context = ensureAudioContext();
		if ( !context ) {
			return;
		}

		const clamped = Math.max( 0.35, Math.min( 1, intensity ) );
		const now = context.currentTime;
		const oscillator = context.createOscillator();
		const gainNode = context.createGain();
		const filter = context.createBiquadFilter();

		oscillator.type = 'square';
		oscillator.frequency.setValueAtTime( 1500 - clamped * 250, now );
		oscillator.frequency.exponentialRampToValueAtTime( 950 - clamped * 120, now + 0.02 );

		filter.type = 'highpass';
		filter.frequency.setValueAtTime( 650, now );

		gainNode.gain.setValueAtTime( 0.0001, now );
		gainNode.gain.exponentialRampToValueAtTime( 0.05 + clamped * 0.09, now + 0.002 );
		gainNode.gain.exponentialRampToValueAtTime( 0.0001, now + 0.028 + clamped * 0.012 );

		oscillator.connect( filter );
		filter.connect( gainNode );
		gainNode.connect( context.destination );

		oscillator.start( now );
		oscillator.stop( now + 0.035 + clamped * 0.012 );
	}

	return {
		ensureAudioContext,
		playTick
	};
}
