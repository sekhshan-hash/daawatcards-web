// Built-in tracks are synthesised live with Web Audio: original, royalty-free and zero download size.
const TRACKS = {
  "royal-raag": { step: 0.75, scale: [0, 2, 4, 6, 7, 9, 11, 12, 14], base: 196, drone: true, wave: "triangle", decay: 1.8, gain: 0.11, rest: 0.25 },
  "party-pop": { step: 0.2, scale: [0, 2, 4, 7, 9, 12, 14, 16], base: 261.63, wave: "square", decay: 0.22, gain: 0.035, kick: true, rest: 0.1 },
  lullaby: { step: 0.62, scale: [0, 4, 7, 9, 12, 16], base: 392, wave: "sine", decay: 1.6, gain: 0.06, rest: 0.3 },
  "music-box": { step: 0.5, scale: [0, 4, 7, 12, 16, 19, 24], base: 523.25, wave: "sine", decay: 1.3, gain: 0.07, rest: 0.2 },
};

let ctx = null;
const freq = (semi, base) => base * Math.pow(2, semi / 12);

export const createPlayer = (trackId) => {
  const cfg = TRACKS[trackId];
  if (!cfg) return null;
  let timer = null;
  let master = null;
  let drones = [];
  let idx = 0;
  let count = 0;
  let next = 0;

  const note = (time, f, wave, gain, decay) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = wave;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    o.connect(g).connect(master);
    o.start(time);
    o.stop(time + decay + 0.05);
  };

  const kick = (time) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(130, time);
    o.frequency.exponentialRampToValueAtTime(40, time + 0.15);
    g.gain.setValueAtTime(0.18, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
    o.connect(g).connect(master);
    o.start(time);
    o.stop(time + 0.22);
  };

  const schedule = () => {
    while (next < ctx.currentTime + 0.35) {
      const moves = [-2, -1, -1, 1, 1, 2, 0];
      idx = Math.max(0, Math.min(cfg.scale.length - 1, idx + moves[Math.floor(Math.random() * moves.length)]));
      if (Math.random() > cfg.rest) note(next, freq(cfg.scale[idx], cfg.base), cfg.wave, cfg.gain, cfg.decay);
      if (cfg.kick && count % 4 === 0) kick(next);
      count += 1;
      next += cfg.step;
    }
  };

  return {
    start() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = ctx || new AC();
      ctx.resume();
      master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 1.2);
      master.connect(ctx.destination);
      if (cfg.drone) {
        drones = [cfg.base / 2, cfg.base * 0.75].map((f) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = f;
          g.gain.value = 0.035;
          o.connect(g).connect(master);
          o.start();
          return o;
        });
      }
      next = ctx.currentTime + 0.15;
      timer = setInterval(schedule, 100);
    },
    stop() {
      clearInterval(timer);
      drones.forEach((o) => o.stop());
      drones = [];
      master?.disconnect();
      master = null;
    },
  };
};

export const MUSIC_TRACKS = ["none", "royal-raag", "party-pop", "music-box", "lullaby"];
