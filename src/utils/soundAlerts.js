// Web Audio API Synthesizer Chimes for Real-time Order & Waiter Alerts
// Works reliably across all browsers without external asset dependencies or CORS issues.

class SoundAlertManager {
  constructor() {
    this.audioCtx = null;
    this.isMuted = localStorage.getItem('order_alerts_muted') === 'true';
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  setMuted(muted) {
    this.isMuted = muted;
    localStorage.setItem('order_alerts_muted', String(muted));
  }

  toggleMute() {
    const nextState = !this.isMuted;
    this.setMuted(nextState);
    return nextState;
  }

  // Play pleasant 2-tone chime for incoming orders
  playOrderBell() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2: B5 (987.77 Hz) - played 0.12s later
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.4, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.75);
    } catch (e) {
      console.warn('Audio alert playback error:', e);
    }
  }

  // Play crisp bell chime for Waiter Calls
  playWaiterChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Double-ding chime: A5 (880Hz) -> C#6 (1108.73Hz)
      const tones = [
        { freq: 880, start: 0, duration: 0.35 },
        { freq: 1108.73, start: 0.15, duration: 0.45 }
      ];

      tones.forEach(t => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(t.freq, now + t.start);
        gain.gain.setValueAtTime(0.35, now + t.start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t.start + t.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t.start);
        osc.stop(now + t.start + t.duration);
      });
    } catch (e) {
      console.warn('Waiter chime audio error:', e);
    }
  }
}

export const soundAlerts = new SoundAlertManager();
