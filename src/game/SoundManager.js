class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Helper: create a quick oscillator tone
    _tone(type, freq, start, dur, vol = 0.15) {
        if (!this.ctx) return null;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(vol, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
        return osc;
    }

    // --- Jump: swoosh with pitch bend ---
    playJump() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc1 = this._tone('sine', 200, now, 0.15, 0.12);
        if (osc1) osc1.frequency.exponentialRampToValueAtTime(400, now + 0.1);

        const osc2 = this._tone('triangle', 300, now, 0.12, 0.06);
        if (osc2) osc2.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    }

    // --- Double Jump: higher swoosh + sparkle ---
    playDoubleJump() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc1 = this._tone('sine', 350, now, 0.12, 0.12);
        if (osc1) osc1.frequency.exponentialRampToValueAtTime(700, now + 0.08);

        this._tone('triangle', 800, now + 0.02, 0.1, 0.07);
        this._tone('sine', 1200, now + 0.04, 0.1, 0.04);
    }

    // --- Score: satisfying ping per collectible type ---
    playScore(type = 'GEM') {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const baseFreq = type === 'KEY' ? 1320 : (type === 'BOX' ? 880 : 1046);

        // Main tone
        this._tone('sine', baseFreq, now, 0.3, 0.18);
        // Overtone
        this._tone('sine', baseFreq * 2, now, 0.25, 0.08);

        // Extra sparkle for KEY
        if (type === 'KEY') {
            this._tone('sine', 1976, now + 0.08, 0.2, 0.1);
            this._tone('triangle', 2400, now + 0.12, 0.15, 0.05);
        }
    }

    // --- Combo: ascending ping based on count ---
    playCombo(count) {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const freq = 600 + Math.min(count, 15) * 80;

        this._tone('sine', freq, now, 0.12, 0.08);
        this._tone('sine', freq * 1.5, now + 0.03, 0.1, 0.04);
    }

    // --- Near Miss: quick high whoosh ---
    playNearMiss() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this._tone('sine', 800, now, 0.1, 0.07);
        if (osc) {
            osc.frequency.exponentialRampToValueAtTime(1600, now + 0.05);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
        }
        this._tone('triangle', 1400, now + 0.01, 0.08, 0.04);
    }

    // --- Milestone: short fanfare (C-E-G) ---
    playMilestone() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;

        this._tone('sine', 523, now, 0.2, 0.1);         // C5
        this._tone('sine', 659, now + 0.1, 0.2, 0.1);   // E5
        this._tone('sine', 784, now + 0.2, 0.35, 0.14);  // G5
        this._tone('triangle', 1046, now + 0.25, 0.3, 0.05); // Shimmer
    }

    // --- Power-Up: magical ascending shimmer ---
    playPowerUp() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;

        for (let i = 0; i < 5; i++) {
            const t = now + i * 0.035;
            const freq = 500 + i * 220;
            this._tone('sine', freq, t, 0.15, Math.max(0.02, 0.09 - i * 0.012));
        }
        // Bass warmth
        this._tone('triangle', 250, now, 0.25, 0.06);
    }

    // --- Shield Break: impact + shatter ---
    playShieldBreak() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;

        // Low impact
        this._tone('sine', 100, now, 0.25, 0.22);
        // Shatter descend
        const osc = this._tone('sawtooth', 1200, now, 0.3, 0.1);
        if (osc) osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        // Glass bits
        this._tone('triangle', 2000, now + 0.02, 0.1, 0.06);
        this._tone('triangle', 2800, now + 0.05, 0.08, 0.04);
    }

    // --- Die: dramatic descent with bass thump ---
    playDie() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;

        // Main descent
        const osc1 = this._tone('sawtooth', 400, now, 0.6, 0.22);
        if (osc1) osc1.frequency.exponentialRampToValueAtTime(50, now + 0.6);

        // Bass thump
        const osc2 = this._tone('sine', 80, now, 0.4, 0.28);
        if (osc2) osc2.frequency.exponentialRampToValueAtTime(40, now + 0.4);

        // Impact noise
        const osc3 = this._tone('square', 200, now, 0.15, 0.08);
        if (osc3) osc3.frequency.exponentialRampToValueAtTime(30, now + 0.15);
    }
}

export default new SoundManager();
