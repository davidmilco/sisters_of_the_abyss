// Web Audio Procedural Sound Engine for Dark Fantasy Metroidvania
// Synthesizes all SFX and atmospheric dark ambient soundtrack with zero external dependencies.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.bgmRunning = false;
    this.muted = false;
    this.bgmInterval = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.7;
    this.sfxGain.connect(this.masterGain);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.35;
    this.bgmGain.connect(this.masterGain);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.8;
    }
    return this.muted;
  }

  // Jump swoosh
  playJump() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(380, this.ctx.currentTime + 0.15);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  // Melee sword slash (combo 1, 2, 3)
  playSlash(step = 1) {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const baseFreq = 220 + step * 60;
    const dur = 0.16;

    // Noise component for whoosh
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq * 2.5, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, this.ctx.currentTime + dur);
    filter.Q.value = 3.0;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4 + step * 0.1, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    // Tone bite for blade whistling
    const tone = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    tone.type = 'sawtooth';
    tone.frequency.setValueAtTime(baseFreq * 1.5, this.ctx.currentTime);
    tone.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, this.ctx.currentTime + dur);

    toneGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    toneGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

    tone.connect(toneGain);
    toneGain.connect(this.sfxGain);

    noise.start();
    tone.start();
    noise.stop(this.ctx.currentTime + dur);
    tone.stop(this.ctx.currentTime + dur);
  }

  // Metal/flesh blade impact
  playHit(isCrit = false) {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    // Impact thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isCrit ? 180 : 130, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.18);

    oscGain.gain.setValueAtTime(isCrit ? 0.6 : 0.4, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start();
    osc.stop(t + 0.18);

    // Metallic ring
    const ring = this.ctx.createOscillator();
    const ringGain = this.ctx.createGain();
    ring.type = 'triangle';
    ring.frequency.setValueAtTime(isCrit ? 1240 : 880, t);
    ring.frequency.exponentialRampToValueAtTime(440, t + 0.22);

    ringGain.gain.setValueAtTime(isCrit ? 0.35 : 0.2, t);
    ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    ring.connect(ringGain);
    ringGain.connect(this.sfxGain);
    ring.start();
    ring.stop(t + 0.22);
  }

  // Cast Soul Fireball
  playCast() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(740, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.3);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(t + 0.32);
  }

  // Spell explosion
  playExplosion() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const dur = 0.35;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
    noise.stop(t + dur);
  }

  // Shadow dash / dodge roll
  playRoll() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.22);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(t + 0.24);
  }

  // Player hurt
  playHurt() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(t + 0.25);
  }

  // Soul / item pickup
  playCollect() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const start = t + idx * 0.045;
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.15);
    });
  }

  // Bonfire / Shrine Rest
  playShrineRest() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const chords = [220, 277.18, 329.63, 440, 554.37]; // A major ethereal chord
    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const start = t + idx * 0.08;
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 1.2);
    });
  }

  // Boss Roar
  playBossRoar() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const dur = 1.2;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, t);
    osc.frequency.linearRampToValueAtTime(95, t + 0.4);
    osc.frequency.exponentialRampToValueAtTime(45, t + dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(t + dur);
  }

  // --- PHASE 2: ABILITIES & METROIDVANIA SFX ---

  // Wren's Zephyr Air Dash / Boss Rush: High-speed airy wind whoosh
  playDash() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const dur = 0.24;

    // Filtered white noise wind whoosh
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.08);
    filter.frequency.exponentialRampToValueAtTime(400, t + dur);
    filter.Q.value = 2.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
    noise.stop(t + dur);

    // Subtle pitch whistle tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(860, t + 0.06);
    osc.frequency.exponentialRampToValueAtTime(320, t + dur);

    oscGain.gain.setValueAtTime(0.18, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start();
    osc.stop(t + dur);
  }

  // Precision parry / shield deflection metallic clink
  playParry() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    [1480, 2220].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + 0.2);

      gain.gain.setValueAtTime(0.35, t + idx * 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.015);
      osc.stop(t + 0.2);
    });
  }

  // Percy's Aegis Bash: Heavy metallic shield impact & shockwave
  playShieldBash() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.28);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(t + 0.3);
  }

  // Tilly's Grapple Whip: Chain whip throw
  playGrappleShoot() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(950, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(t + 0.14);
  }

  // Tilly's Grapple Whip: Hook latches onto ring and vaults
  playGrappleLatch() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    // Metallic chime snap
    [880, 1320, 1760].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, t + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.02);
      osc.stop(t + 0.25);
    });
  }

  // Mona's Astral Ray: Celestial beam piercing charge & blast
  playAstralRay() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.18);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(t + 0.45);
  }

  // Alias for Astral Ray sound effect
  playCastRay() {
    this.playAstralRay();
  }

  // Cracked Stone Wall breaking into rubble
  playWallBreak() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(t + 0.38);
  }

  // Alias for wall break / rubble shatter
  playWallShatter() {
    this.playWallBreak();
  }

  // Arcane Crystal activation chime & energy surge
  playCrystalActivate() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = t + idx * 0.09;
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.8);
    });
  }

  // Sister Rescued Fanfare: Majestic harmonic choir chime
  playSisterRescue() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [329.63, 392.00, 493.88, 587.33, 659.25, 783.99, 987.77]; // E minor triumphant pentatonic
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = t + idx * 0.1;
      gain.gain.setValueAtTime(0.28, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 1.4);
    });
  }

  // Atmospheric dark fantasy background ambient drone
  startBGM() {
    if (this.bgmRunning) return;
    this.init();
    this.resume();
    this.bgmRunning = true;

    // Dark Gregorian / Gothic minor drone progressions (D minor / A minor)
    const chords = [
      [73.42, 110.00, 146.83, 174.61], // D minor
      [65.41, 98.00, 130.81, 164.81],  // C add9
      [55.00, 82.41, 110.00, 130.81],  // A minor
      [58.27, 87.31, 116.54, 146.83]   // Bb maj7
    ];

    let chordIdx = 0;

    const playDroneChord = () => {
      if (!this.bgmRunning || !this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const chord = chords[chordIdx % chords.length];
      chordIdx++;

      chord.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, t);
        filter.frequency.linearRampToValueAtTime(340, t + 2.5);
        filter.frequency.linearRampToValueAtTime(220, t + 5.0);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.07, t + 1.2);
        gain.gain.linearRampToValueAtTime(0.05, t + 3.8);
        gain.gain.linearRampToValueAtTime(0.001, t + 5.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(t);
        osc.stop(t + 5.3);
      });
    };

    playDroneChord();
    this.bgmInterval = setInterval(playDroneChord, 4800);
  }

  stopBGM() {
    this.bgmRunning = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  // Phase 3: Arcane Wisp Spark Cast
  playWispSpark() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.3);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Phase 3: Magma Sentinel Heavy Slam
  playSentinelSlam() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.45);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  // Phase 3: Storm Harpy Screech / Dive
  playHarpyDive() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(1400, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.4);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  // Phase 3: Biome Discovery Fanfare Chime
  playBiomeFanfare() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [329.63, 392.00, 493.88, 659.25]; // E minor arpeggio
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);

      gain.gain.setValueAtTime(0.18, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.7);
    });
  }

  // Phase 4: Ancient Sister Keepsake Discovery Chime
  playKeepsakeCollect() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C major celebratory run
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.22, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.85);
    });
  }

  // Phase 4: Cozy Campfire Banter & Acoustic Lute Strum
  playCampfireBanter() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const chords = [392.00, 493.88, 587.33, 783.99]; // G major gentle acoustic pluck
    chords.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.04);

      gain.gain.setValueAtTime(0.16, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.9);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.95);
    });
  }

  // Phase 4: Sister Swap Fanfare
  playSisterSwap() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440.00, 554.37, 659.25, 880.00]; // A major bright fanfare
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.07);

      gain.gain.setValueAtTime(0.18, t + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.7);
    });
  }

  // Phase 5: Heavy Shield Deflection Clang
  playShieldDeflect() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(160, t);
    osc1.frequency.exponentialRampToValueAtTime(45, t + 0.35);
    gain1.gain.setValueAtTime(0.35, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.35);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, t);
    osc2.frequency.exponentialRampToValueAtTime(880.00, t + 0.5);
    gain2.gain.setValueAtTime(0.28, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t);
    osc2.stop(t + 0.5);
  }

  // Phase 5: Astral Aegis Crystalline Shatter
  playBarrierShatter() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const shatterFreqs = [1760, 2093, 2637, 3135, 3520];
    shatterFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.025);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + idx * 0.025 + 0.3);

      gain.gain.setValueAtTime(0.22, t + idx * 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.025 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.025);
      osc.stop(t + idx * 0.025 + 0.35);
    });
  }

  // Phase 5: Aerial Void Storm Thunder / Meteors
  playVoidStorm() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.6);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.65);
  }

  // Phase 5: Boss Phase Shift Roar
  playBossPhaseTransition() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [110, 130.81, 164.81, 220, 293.66];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);

      gain.gain.setValueAtTime(0.25, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.85);
    });
  }

  // Phase 5: Grand Victory Epilogue Fanfare
  playVictoryFanfare() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const fanfare = [
      { f: 523.25, d: 0.14 },
      { f: 659.25, d: 0.14 },
      { f: 783.99, d: 0.14 },
      { f: 1046.50, d: 0.35 },
      { f: 880.00, d: 0.15 },
      { f: 1046.50, d: 0.65 }
    ];

    let offset = 0;
    fanfare.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t + offset);

      gain.gain.setValueAtTime(0.3, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + offset);
      osc.stop(t + offset + note.d + 0.05);
      offset += note.d * 0.9;
    });
  }

  // Phase 6: Procedural Character Themes for the 4 Sisters
  setLeadSister(sisterId) {
    this.currentLead = sisterId;
  }

  playSisterTheme(sisterId = 'wren') {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;

    if (sisterId === 'wren') {
      // Wren: Celtic Zephyr Wind Flute (E Minor Pentatonic)
      const notes = [
        { f: 659.25, d: 0.18 },
        { f: 783.99, d: 0.18 },
        { f: 880.00, d: 0.24 },
        { f: 1174.66, d: 0.22 },
        { f: 987.77, d: 0.20 },
        { f: 1318.51, d: 0.60 }
      ];
      let offset = 0;
      notes.forEach((n) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.f, t + offset);

        // Gentle breath vibrato
        const vibrato = this.ctx.createOscillator();
        const vibGain = this.ctx.createGain();
        vibrato.frequency.value = 5.5;
        vibGain.gain.value = 7.0;
        vibrato.connect(osc.frequency);
        vibrato.start(t + offset);
        vibrato.stop(t + offset + n.d);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, t + offset);

        gain.gain.setValueAtTime(0.001, t + offset);
        gain.gain.linearRampToValueAtTime(0.24, t + offset + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + n.d);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t + offset);
        osc.stop(t + offset + n.d + 0.05);
        offset += n.d * 0.85;
      });
    } else if (sisterId === 'percy') {
      // Percy: Iron Aegis Cathedral Fanfare (D Minor Brass & Bell Resonance)
      const chords = [
        { f1: 146.83, f2: 220.00, d: 0.26 },
        { f1: 174.61, f2: 261.63, d: 0.26 },
        { f1: 220.00, f2: 329.63, d: 0.32 },
        { f1: 293.66, f2: 440.00, d: 0.65 }
      ];
      let offset = 0;
      chords.forEach((c) => {
        [c.f1, c.f2].forEach((freq) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, t + offset);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(750, t + offset);
          filter.frequency.exponentialRampToValueAtTime(320, t + offset + c.d);

          gain.gain.setValueAtTime(0.18, t + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, t + offset + c.d);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.sfxGain);

          osc.start(t + offset);
          osc.stop(t + offset + c.d + 0.05);
        });
        offset += c.d * 0.88;
      });
    } else if (sisterId === 'mona') {
      // Mona: Astral Weaver Starlight Celesta (Ethereal Harmonic Minor Chimes)
      const notes = [
        { f: 493.88, d: 0.22 },
        { f: 622.25, d: 0.22 },
        { f: 739.99, d: 0.24 },
        { f: 987.77, d: 0.28 },
        { f: 1244.51, d: 0.32 },
        { f: 1479.98, d: 0.70 }
      ];
      let offset = 0;
      notes.forEach((n) => {
        const osc = this.ctx.createOscillator();
        const harmonic = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, t + offset);

        harmonic.type = 'sine';
        harmonic.frequency.setValueAtTime(n.f * 2.01, t + offset);

        gain.gain.setValueAtTime(0.22, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + n.d);

        osc.connect(gain);
        harmonic.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t + offset);
        harmonic.start(t + offset);
        osc.stop(t + offset + n.d + 0.05);
        harmonic.stop(t + offset + n.d + 0.05);
        offset += n.d * 0.82;
      });
    } else if (sisterId === 'tilly') {
      // Tilly: Wildheart Scout Ember Lute (Playful Folk Jig Plucks)
      const notes = [
        { f: 293.66, d: 0.14 },
        { f: 369.99, d: 0.14 },
        { f: 440.00, d: 0.15 },
        { f: 493.88, d: 0.15 },
        { f: 587.33, d: 0.26 },
        { f: 493.88, d: 0.18 },
        { f: 440.00, d: 0.45 }
      ];
      let offset = 0;
      notes.forEach((n) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, t + offset);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(n.f * 1.8, t + offset);
        filter.frequency.exponentialRampToValueAtTime(n.f * 0.8, t + offset + n.d);

        gain.gain.setValueAtTime(0.3, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + n.d);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t + offset);
        osc.stop(t + offset + n.d + 0.05);
        offset += n.d * 0.82;
      });
    }
  }

  // --- PHASE 6.5: SIGILS, KEYS & COMBAT ARENAS ---
  playSigilCollect() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Grand celestial chime chord (A major 7 with shimmer)
    const chord = [440, 554.37, 659.25, 830.61, 1108.73];
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.28, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 1.3);
    });
  }

  playKeyCollect() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Metallic chime pickup (D6 -> F#6 -> A6)
    [1174.66, 1479.98, 1760.00].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.25, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.45);
    });
  }

  playDoorUnlock() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Heavy iron mechanical clanking and ratcheting
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.45);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.55);
  }

  playArenaLockdown() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Menacing brass drone and clashing iron gate drop
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(110, t);
    osc1.frequency.linearRampToValueAtTime(82.41, t + 0.7);
    osc2.frequency.setValueAtTime(164.81, t);
    osc2.frequency.linearRampToValueAtTime(123.47, t + 0.7);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.95);
    osc2.stop(t + 0.95);
  }

  playArenaCleared() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Triumphant rising brass fifths
    [261.63, 392.00, 523.25, 783.99].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);

      gain.gain.setValueAtTime(0.3, t + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + 0.85);
    });
  }
}

export const soundFX = new Proxy(new SoundFX(), {
  get(target, prop, receiver) {
    if (prop in target) {
      const val = target[prop];
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    }
    // Safe fallback for any soundFX method so missing audio calls never crash or freeze the game
    if (typeof prop === 'string' && (prop.startsWith('play') || prop.startsWith('stop') || prop.startsWith('start') || prop.startsWith('set'))) {
      return (...args) => {
        // Safe no-op or harmless default hit sound if applicable
      };
    }
    return target[prop];
  }
});
