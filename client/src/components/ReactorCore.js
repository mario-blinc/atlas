import React, { useRef, useEffect } from 'react';

// ATLAS reactor core: machined HUD rings around a white-hot plasma core, drawn on canvas.
// State drives ring speed, the scanner sweep and how hard the core burns. While ATLAS is
// speaking, the waveform ring reads the real voice through `analyserRef` (a Web Audio
// AnalyserNode) and falls back to a synthetic pulse when none is attached.
// `bootKey` replays the spin-up; `mark` draws a small static version for the brand.

const ION   = '159,214,255';
const STEEL = '185,192,202';

const STATE = {
  idle:      { speed: 1.0, activity: 0.18, sweep: 0.35 },
  listening: { speed: 1.6, activity: 0.75, sweep: 0.9  },
  thinking:  { speed: 3.2, activity: 0.55, sweep: 2.6  },
  speaking:  { speed: 1.4, activity: 0.65, sweep: 0.6  },
};

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const easeOut = x => 1 - Math.pow(1 - x, 3);

export default function ReactorCore({ state = 'idle', size = 220, analyserRef, bootKey = 0, mark = false }) {
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
    const BARS = 72;
    const freq = new Uint8Array(64);
    const angles = { a1: 0, a2: 0, a3: 0, sweep: -Math.PI / 2 };
    let activity = STATE[stateRef.current]?.activity ?? 0.2;
    let level = 0;
    let raf = 0;
    const t0 = performance.now();
    let last = t0;

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
      const cfg = STATE[stateRef.current] || STATE.idle;
      const boot = still ? 1 : Math.min(1, t / 1.6);
      const spin = 1 + (1 - easeOut(boot)) * 7;

      // Voice level from the analyser, when ATLAS is actually speaking
      let hasAudio = false;
      const an = analyserRef?.current;
      if (an && stateRef.current === 'speaking') {
        an.getByteFrequencyData(freq);
        let sum = 0;
        for (let i = 0; i < freq.length; i++) sum += freq[i];
        const avg = sum / freq.length / 255;
        hasAudio = avg > 0.01;
        level += ((hasAudio ? avg * 1.6 : 0) - level) * 0.25;
      } else {
        level += (0 - level) * 0.1;
      }
      activity += (cfg.activity + level * 0.5 - activity) * 0.06;

      angles.a1 += dt * 0.08 * cfg.speed * spin;
      angles.a2 -= dt * 0.22 * cfg.speed * spin;
      angles.a3 += dt * 0.4 * cfg.speed * spin;
      angles.sweep += dt * cfg.sweep * spin;

      ctx.clearRect(0, 0, size, size);
      const alphaBoot = still ? 1 : easeOut(Math.min(1, t / 0.9));
      ctx.globalAlpha = alphaBoot;

      // 1. Outer tick ring with a moving scanner highlight
      const rT = R * 0.94;
      for (let i = 0; i < 120; i++) {
        const a = angles.a1 + (i / 120) * Math.PI * 2;
        const major = i % 10 === 0;
        const len = major ? R * 0.065 : R * 0.03;
        let d = Math.abs(((a - angles.sweep) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
        const lit = Math.max(0, 1 - d / 0.45) * (0.4 + activity);
        ctx.strokeStyle = lit > 0.05
          ? `rgba(${ION},${Math.min(1, 0.25 + lit)})`
          : `rgba(${STEEL},${major ? 0.5 : 0.22})`;
        ctx.lineWidth = major ? 1.4 : 1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * rT, cy + Math.sin(a) * rT);
        ctx.lineTo(cx + Math.cos(a) * (rT - len), cy + Math.sin(a) * (rT - len));
        ctx.stroke();
      }

      // 2. Segmented arc ring, one segment lit
      const rS = R * 0.8;
      ctx.lineWidth = Math.max(1.5, R * 0.028);
      ctx.lineCap = 'butt';
      for (let k = 0; k < 3; k++) {
        const start = angles.a2 + k * (Math.PI * 2 / 3);
        ctx.strokeStyle = k === 0 ? `rgba(${ION},${0.35 + activity * 0.6})` : `rgba(${STEEL},0.38)`;
        ctx.beginPath();
        ctx.arc(cx, cy, rS, start, start + Math.PI * 0.42);
        ctx.stroke();
      }

      // 3. Hairline ring and rotating dashed ring
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${STEEL},0.16)`;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2); ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(angles.a3);
      ctx.setLineDash([2, 7]);
      ctx.strokeStyle = `rgba(${STEEL},0.35)`;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.66, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.setLineDash([]);

      // 4. Waveform ring: real voice when available, synthetic pulse otherwise
      if (!mark) {
        const r0 = R * 0.5;
        for (let i = 0; i < BARS; i++) {
          const a = (i / BARS) * Math.PI * 2 - Math.PI / 2;
          let amp;
          if (hasAudio) {
            const bin = freq[Math.floor((i < BARS / 2 ? i : BARS - i) / (BARS / 2) * 40)] / 255;
            amp = bin * 1.1;
          } else {
            amp = (Math.sin(i * 0.7 + t * 3.1) * 0.5 + 0.5) * (Math.sin(i * 0.23 - t * 1.7) * 0.5 + 0.5) * activity * 0.9;
          }
          const len = R * (0.015 + amp * 0.13);
          ctx.strokeStyle = `rgba(${ION},${0.18 + amp * 0.7})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
          ctx.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len));
          ctx.stroke();
        }
      }

      // 5. Inner housing ring
      ctx.strokeStyle = `rgba(${STEEL},0.42)`;
      ctx.lineWidth = Math.max(1, R * 0.012);
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.43, 0, Math.PI * 2); ctx.stroke();

      // 6. Plasma core
      const rc = R * 0.34 * (1 + level * 0.1 + Math.sin(t * 2) * 0.008 * activity);
      ctx.save();
      ctx.beginPath();
      const N = 40;
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const w = still ? 0 : (Math.sin(a * 3 + t * 1.4) + Math.sin(a * 5 - t * 1.1) * 0.5) * R * 0.006 * (0.4 + activity);
        const x = cx + Math.cos(a) * (rc + w), y = cy + Math.sin(a) * (rc + w);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.shadowColor = `rgba(${ION},${0.35 + activity * 0.4})`;
      ctx.shadowBlur = mark ? 0 : R * (0.18 + activity * 0.22);
      const gx = cx + Math.cos(t * 0.6) * rc * 0.18, gy = cy + Math.sin(t * 0.5) * rc * 0.18;
      const g = ctx.createRadialGradient(gx, gy, 0, cx, cy, rc);
      g.addColorStop(0,    'rgba(250,253,255,1)');
      g.addColorStop(0.32 - activity * 0.08, `rgba(${ION},0.95)`);
      g.addColorStop(0.75, 'rgba(46,72,98,0.95)');
      g.addColorStop(1,    'rgba(16,22,30,1)');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();

      // Specular edge highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, rc, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();

      ctx.globalAlpha = 1;
      if (!still) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size, mark, bootKey, analyserRef]);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ width: size, height: size, display: 'block' }} />;
}
