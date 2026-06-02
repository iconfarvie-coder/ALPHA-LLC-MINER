// Web Audio API Sound Synthesizer for Fast Hash Sovereign

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export type SoundType = 'click' | 'toggle' | 'trade' | 'alarm' | 'booster' | 'shutdown' | 'startup';

export function playSound(type: SoundType) {
  // Check master setting from localStorage
  const isEnabled = localStorage.getItem('fast_miner_sound_enabled') !== 'false';
  if (!isEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  try {
    switch (type) {
      case 'click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'toggle': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);

        gain.gain.setValueAtTime(0.10, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'trade': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now);
        gain1.gain.setValueAtTime(0.08, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.06);
        osc2.frequency.setValueAtTime(783.99, now + 0.12);
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.setValueAtTime(0.08, now + 0.06);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

        osc1.start(now);
        osc1.stop(now + 0.22);
        osc2.start(now + 0.06);
        osc2.stop(now + 0.32);
        break;
      }
      case 'alarm': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }
      case 'booster': {
        const notes = [440.00, 554.37, 659.25, 880.00];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.05);

          gain.gain.setValueAtTime(0, now);
          gain.gain.setValueAtTime(0.08, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.004, now + i * 0.05 + 0.18);

          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.18);
        });
        break;
      }
      case 'shutdown': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
      case 'startup': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sawtooth';
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(900, now + 0.4);

        osc.disconnect(gain);
        osc.connect(filter);
        filter.connect(gain);

        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.4);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }
    }
  } catch (e) {
    console.warn('AudioContext failed to play synth sound:', e);
  }
}

export function speakVoice(text: string) {
  const isEnabled = localStorage.getItem('fast_miner_sound_enabled') !== 'false';
  const isVoiceEnabled = localStorage.getItem('fast_miner_voice_enabled') !== 'false';
  if (!isEnabled || !isVoiceEnabled) return;

  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    // Instantly cut off previous voice statements for snappy, lightning-fast transitions
    window.speechSynthesis.cancel();

    // Configure the AI text-to-speech engine
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to pick a premium robotic, natural, or synthetic voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en-US') && (
        v.name.includes('Natural') || 
        v.name.includes('Google') || 
        v.name.includes('Zira') || 
        v.name.includes('David') ||
        v.name.includes('Microsoft')
      )
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Tone & timbre: slightly pitch-shifted, optimized speed for high-tech alerts
    utterance.pitch = 1.05;
    utterance.rate = 1.25;
    utterance.volume = 0.95;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('AI vocal prompt synthesis unsuccessful:', err);
  }
}

