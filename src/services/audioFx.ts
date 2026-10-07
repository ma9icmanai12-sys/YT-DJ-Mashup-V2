/**
 * Zero-latency Web Audio Synthesizer for DJ performance sound FX & scratch audio
 */

class AudioFxEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
  }

  /**
   * Classic Jamaican / Club DJ Airhorn Blast
   */
  public playAirhorn() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.9, now);
    masterGain.connect(ctx.destination);

    // Multi-pulse stabs: 3 short bursts followed by one long sustain blast
    const pulses = [
      { start: 0, duration: 0.12 },
      { start: 0.15, duration: 0.12 },
      { start: 0.3, duration: 0.14 },
      { start: 0.48, duration: 0.65 },
    ];

    pulses.forEach(pulse => {
      const pStart = now + pulse.start;
      const pEnd = pStart + pulse.duration;

      // Base frequencies of iconic air horn chords
      const freqs = [466.16, 587.33, 698.46, 932.33]; // Bb chord tones
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Sawtooth wave for brassy bite
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'square';
        // Pitch scoop up at start of horn blast
        osc.frequency.setValueAtTime(freq * 0.92, pStart);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, pStart + 0.04);
        osc.frequency.setValueAtTime(freq, pStart + 0.08);

        // Quick vibrato
        const vibrato = ctx.createOscillator();
        const vibratoGain = ctx.createGain();
        vibrato.frequency.value = 16;
        vibratoGain.gain.value = 8;
        vibrato.connect(osc.frequency);
        vibrato.start(pStart);
        vibrato.stop(pEnd);

        // Envelope
        gain.gain.setValueAtTime(0, pStart);
        gain.gain.linearRampToValueAtTime(0.22, pStart + 0.015);
        gain.gain.setValueAtTime(0.2, pEnd - 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, pEnd);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(pStart);
        osc.stop(pEnd);
      });
    });
  }

  /**
   * 808 Sub Bass Drop
   */
  public play808Drop() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pitch drops from 150Hz punch down to 36Hz sub vibration
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);
    osc.frequency.exponentialRampToValueAtTime(32, now + 1.2);

    // Punch envelope with long decay
    gain.gain.setValueAtTime(this.volume * 0.95, now);
    gain.gain.exponentialRampToValueAtTime(this.volume * 0.6, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.45);
  }

  /**
   * Dub Siren / Laser Sweep
   */
  public playSiren() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const duration = 1.2;

    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(680, now);

    lfo.type = 'sawtooth';
    lfo.frequency.setValueAtTime(4.5, now);
    lfoGain.gain.setValueAtTime(240, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(3800, now + duration * 0.8);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.45, now + 0.1);
    gain.gain.setValueAtTime(this.volume * 0.45, now + duration - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + duration);
    osc.stop(now + duration);
  }

  /**
   * Turntable Vinyl Brake / Tape Stop
   */
  public playVinylBrake() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const duration = 0.9;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(250, now + duration);

    gain.gain.setValueAtTime(this.volume * 0.5, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.4, now + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Vinyl Backspin / Quick Rewind Sound
   */
  public playBackspin() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const duration = 0.65;

    // Fast rising friction pitch chirp
    const osc = ctx.createOscillator();
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const oscGain = ctx.createGain();

    // Noise buffer for vinyl friction
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    noise.buffer = buffer;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(300, now + duration);

    oscGain.gain.setValueAtTime(this.volume * 0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseGain.gain.setValueAtTime(this.volume * 0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.start(now);
    noise.start(now);
    osc.stop(now + duration);
    noise.stop(now + duration);
  }

  /**
   * Real-time Scratch Chirp when user drags vinyl jog wheel
   */
  public playScratchChirp(direction: 1 | -1, speed: number = 1) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const duration = Math.min(0.14, Math.max(0.04, 0.08 / Math.max(0.2, speed)));

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    const baseFreq = direction > 0 ? 300 : 700;
    const targetFreq = direction > 0 ? 800 : 220;

    osc.frequency.setValueAtTime(baseFreq * Math.max(0.5, speed), now);
    osc.frequency.exponentialRampToValueAtTime(targetFreq * Math.max(0.5, speed), now + duration);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, now);
    filter.Q.value = 3.5;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.4, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Rave Synth Stab (90s Oldskool rave / club chord)
   */
  public playRaveStab() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const duration = 0.45;

    // Minor 9th chord frequencies (A minor 9: A, C, E, G, B)
    const freqs = [220, 261.63, 329.63, 392, 493.88];
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.45, now);
    masterGain.connect(ctx.destination);

    freqs.forEach(f => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(500, now + duration);
      filter.Q.value = 4;

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  /**
   * Laser Zap FX
   */
  public playLaser() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const duration = 0.22;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + duration);

    gain.gain.setValueAtTime(this.volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Metronome / Beat Click
   */
  public playBeatClick(isHigh: boolean = false) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHigh ? 1200 : 800, now);

    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const audioFx = new AudioFxEngine();
