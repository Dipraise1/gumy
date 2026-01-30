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

    // Enhanced Jump - Swoosh with pitch bend
    playJump() {
        if (!this.enabled || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        
        // Main swoosh
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(200, now);
        osc1.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        
        osc1.start(now);
        osc1.stop(now + 0.15);
        
        // Harmonic for richness
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(300, now);
        osc2.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        
        gain2.gain.setValueAtTime(0.08, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        
        osc2.start(now);
        osc2.stop(now + 0.12);
    }

    // Enhanced Score - Satisfying ping with overtones
    playScore(type = 'GEM') {
        if (!this.enabled || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        const baseFreq = type === 'KEY' ? 1320 : (type === 'BOX' ? 880 : 1046); // C6, A5, C5
        
        // Main tone
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(baseFreq, now);
        
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        
        osc1.start(now);
        osc1.stop(now + 0.3);
        
        // Harmonic overtone
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq * 2, now);
        
        gain2.gain.setValueAtTime(0.1, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        
        osc2.start(now);
        osc2.stop(now + 0.25);
        
        // Sparkle for KEY
        if (type === 'KEY') {
            setTimeout(() => {
                const osc3 = this.ctx.createOscillator();
                const gain3 = this.ctx.createGain();
                
                osc3.type = 'sine';
                osc3.frequency.setValueAtTime(1976, this.ctx.currentTime); // B6
                
                gain3.gain.setValueAtTime(0.12, this.ctx.currentTime);
                gain3.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
                
                osc3.connect(gain3);
                gain3.connect(this.ctx.destination);
                
                osc3.start();
                osc3.stop(this.ctx.currentTime + 0.2);
            }, 80);
        }
    }

    // Enhanced Die - Dramatic descent with bass
    playDie() {
        if (!this.enabled || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        
        // Main descent
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(400, now);
        osc1.frequency.exponentialRampToValueAtTime(50, now + 0.6);
        
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        
        osc1.start(now);
        osc1.stop(now + 0.6);
        
        // Bass thump
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(80, now);
        osc2.frequency.exponentialRampToValueAtTime(40, now + 0.4);
        
        gain2.gain.setValueAtTime(0.3, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        
        osc2.start(now);
        osc2.stop(now + 0.4);
    }
}

export default new SoundManager();
