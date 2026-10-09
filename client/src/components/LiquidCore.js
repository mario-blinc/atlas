import React, { useRef, useEffect } from 'react';

// ATLAS core: a liquid glass sphere drawn on canvas. Its surface is a smooth blob whose
// edge ripples with ATLAS's real voice while speaking (via `analyserRef`, a Web Audio
// AnalyserNode), and with a synthetic swell otherwise. State sets how alive it feels.
// `mark` draws a small still version for the brand.

const ION = '159,214,255';

const STATE = {
  idle:      { energy: 0.18, swirl: 0.35, swell: 0.0  },
  listening: { energy: 0.7,  swirl: 0.6,  swell: 0.06 },
  thinking:  { energy: 0.5,  swirl: 1.6,  swell: 0.02 },
  speaking:  { energy: 0.6,  swirl: 0.8,  swell: 0.03 },
};

const CTRL = 12; // control points around the rim, interpolated smoothly
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function LiquidCore({ state = 'idle', size = 240, analyserRef, mark = false }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const still = mark || reducedMotion();
    const cx = size / 2, cy = size / 2, R = size / 2;
    const freq = new Uint8Array(64);
    const amps = new Float32Array(CTRL);
    let energy = STATE[stateRef.current]?.energy ?? 0.2;
    let swell = 0, swirlAngle = 0, level = 0;
    let raf = 0;
    const t0 = performance.now();
    let last = t0;

    const rimAt = (a, t, base) => {
      // Smooth cosine interpolation between control amplitudes
      const f = ((a / (Math.PI * 2)) % 1 + 1) % 1 * CTRL;
      const i = Math.floor(f), k = f - i;
      const m = (1 - Math.cos(k * Math.PI)) / 2;
      const audio = amps[i % CTRL] * (1 - m) + amps[(i + 1) % CTRL] * m;
      const liquid =
        Math.sin(a * 3 + t * 0.9) * 0.012 +
        Math.sin(a * 2 - t * 0.6) * 0.016 +
        Math.sin(a * 5 + t * 1.3) * 0.006 * (0.5 + energy);
      return base * (1 + (still ? 0 : liquid) + audio * 0.14);
    };

    const blob = (t, base) => {
      ctx.beginPath();
      const N = 96;
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const r = rimAt(a, t, base);
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
      const cfg = STATE[stateRef.current] || STATE.idle;

      // Voice → rim amplitudes
      const an = analyserRef?.current;
      let hasAudio = false;
      if (an && stateRef.current === 'speaking') {
        an.getByteFrequencyData(freq);
        let sum = 0;
        for (let i = 0; i < 40; i++) sum += freq[i];
        hasAudio = sum > 40;
        level += ((hasAudio ? sum / 40 / 255 : 0) - level) * 0.2;
      } else {
        level += (0 - level) * 0.08;
      }
      for (let c = 0; c < CTRL; c++) {
        const target = hasAudio
          ? freq[2 + Math.floor((c < CTRL / 2 ? c : CTRL - c) * 3)] / 255
          : (stateRef.current === 'speaking' || stateRef.current === 'listening')
            ? (Math.sin(t * 4 + c * 1.7) * 0.5 + 0.5) * 0.35 * energy
            : 0;
        amps[c] += (target - amps[c]) * (hasAudio ? 0.35 : 0.08);
      }
      energy += (cfg.energy + level * 0.4 - energy) * 0.05;
      swell  += (cfg.swell - swell) * 0.06;
      swirlAngle += dt * cfg.swirl;

      ctx.clearRect(0, 0, size, size);
      const base = R * 0.56 * (1 + swell + (still ? 0 : Math.sin(t * 1.2) * 0.008));

      // Halo
      if (!mark) {
        const halo = ctx.createRadialGradient(cx, cy, base * 0.6, cx, cy, R);
        halo.addColorStop(0, `rgba(${ION},${0.16 + energy * 0.22})`);
        halo.addColorStop(1, `rgba(${ION},0)`);
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

        // Two soft orbits with a gliding highlight
        [0.8, 0.94].forEach((k, n) => {
          const r = R * k;
          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(205,214,226,${0.06 + energy * 0.04})`;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
          if (ctx.createConicGradient && !still) {
            const g = ctx.createConicGradient(swirlAngle * (n ? -0.6 : 1) + n * 2, cx, cy);
            g.addColorStop(0, `rgba(${ION},0)`);
            g.addColorStop(0.1, `rgba(${ION},${0.25 + energy * 0.5})`);
            g.addColorStop(0.24, `rgba(${ION},0)`);
            g.addColorStop(1, `rgba(${ION},0)`);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = g;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
          }
        });
      }

      // Liquid body
      blob(t, base);
      const gx = cx + Math.cos(swirlAngle) * base * 0.28;
      const gy = cy + Math.sin(swirlAngle * 0.8) * base * 0.24;
      const body = ctx.createRadialGradient(gx, gy, 0, cx, cy, base * 1.05);
      body.addColorStop(0, 'rgba(246,251,255,1)');
      body.addColorStop(0.28 + energy * 0.06, `rgba(${ION},0.96)`);
      body.addColorStop(0.7, 'rgba(52,84,116,0.98)');
      body.addColorStop(1, 'rgba(18,26,36,1)');
      ctx.save();
      ctx.shadowColor = `rgba(${ION},${0.3 + energy * 0.3})`;
      ctx.shadowBlur = mark ? 0 : R * 0.2;
      ctx.fillStyle = body;
      ctx.fill();
      ctx.restore();

      // Inner current: a second, lighter layer drifting the other way
      ctx.save();
      blob(t * 1.3 + 4, base * 0.98);
      ctx.clip();
      const ix = cx + Math.cos(-swirlAngle * 1.2 + 2) * base * 0.35;
      const iy = cy + Math.sin(-swirlAngle * 0.9 + 1) * base * 0.3;
      const inner = ctx.createRadialGradient(ix, iy, 0, ix, iy, base * 0.7);
      inner.addColorStop(0, `rgba(198,231,255,${0.22 + energy * 0.2})`);
      inner.addColorStop(1, 'rgba(198,231,255,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = inner;
      ctx.fillRect(0, 0, size, size);
      ctx.globalCompositeOperation = 'source-over';

      // Glass specular
      const sx = cx - base * 0.34, sy = cy - base * 0.42;
      const spec = ctx.createRadialGradient(sx, sy, 0, sx, sy, base * 0.5);
      spec.addColorStop(0, 'rgba(255,255,255,0.42)');
      spec.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = spec;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // Soft rim
      blob(t, base);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(230,242,255,0.18)';
      ctx.stroke();

      if (!still) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size, mark, analyserRef]);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ width: size, height: size, display: 'block' }} />;
}
