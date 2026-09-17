import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// Fluid plasma-glass orb — canvas-rendered organic blob with a rotating rim light,
// replacing the old static radial-gradient sphere.
const PALETTES = {
  idle:      { stops: ['#1a2a6c', '#4d3dbc', '#00c8ff'], rim: '#7db8ff', bg: '#060a18' },
  speaking:  { stops: ['#0a3d62', '#00c8ff', '#6affe0'], rim: '#7fe8ff', bg: '#04141c' },
  listening: { stops: ['#3d1a6c', '#a259e6', '#ff8ad8'], rim: '#e0a0ff', bg: '#160a24' },
  thinking:  { stops: ['#142a6c', '#3d5ce6', '#00ccff'], rim: '#8ab4ff', bg: '#0a1230' },
};

export default function TalkingOrb({ state = 'idle', size = 84 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const palette = PALETTES[state] || PALETTES.idle;
    const speed      = state === 'idle' ? 0.35 : state === 'thinking' ? 0.9 : state === 'listening' ? 1.1 : 0.75;
    const wobbleAmp  = state === 'idle' ? 1.6  : state === 'thinking' ? 3   : state === 'listening' ? 4   : 2.4;
    const N   = 48;
    const cx  = size / 2, cy = size / 2;
    const baseR = size * 0.42;

    function blobPath(time) {
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const wob =
          Math.sin(a * 3 + time * 1.3) * wobbleAmp +
          Math.sin(a * 5 - time * 0.9) * wobbleAmp * 0.5 +
          Math.sin(a * 2 + time * 0.6) * wobbleAmp * 0.7;
        const r = baseR + wob;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
      ctx.beginPath();
      ctx.moveTo((pts[0][0] + pts[N][0]) / 2, (pts[0][1] + pts[N][1]) / 2);
      for (let i = 0; i < N; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
        ctx.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2);
      }
      ctx.closePath();
    }

    function render() {
      tRef.current += 0.016 * speed;
      const time = tRef.current;
      ctx.clearRect(0, 0, size, size);

      // Flowing plasma fill
      blobPath(time);
      const gx = cx + Math.cos(time * 0.5) * baseR * 0.3;
      const gy = cy + Math.sin(time * 0.4) * baseR * 0.3;
      const grad = ctx.createRadialGradient(gx, gy, baseR * 0.1, cx, cy, baseR * 1.15);
      grad.addColorStop(0,   palette.stops[2]);
      grad.addColorStop(0.5, palette.stops[1]);
      grad.addColorStop(1,   palette.bg);
      ctx.fillStyle = grad;
      ctx.fill();

      // Glass highlight, clipped to the blob
      ctx.save();
      ctx.clip();
      ctx.beginPath();
      ctx.ellipse(cx - baseR * 0.28, cy - baseR * 0.3, baseR * 0.32, baseR * 0.18, -0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      if ('filter' in ctx) ctx.filter = 'blur(3px)';
      ctx.fill();
      if ('filter' in ctx) ctx.filter = 'none';
      ctx.restore();

      // Rotating rim light
      blobPath(time);
      if (ctx.createConicGradient) {
        const conic = ctx.createConicGradient(time * 1.4, cx, cy);
        conic.addColorStop(0,    'rgba(255,255,255,0)');
        conic.addColorStop(0.08, palette.rim);
        conic.addColorStop(0.18, 'rgba(255,255,255,0)');
        conic.addColorStop(0.5,  'rgba(255,255,255,0)');
        conic.addColorStop(0.58, palette.rim + '80');
        conic.addColorStop(0.68, 'rgba(255,255,255,0)');
        conic.addColorStop(1,    'rgba(255,255,255,0)');
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = conic;
        ctx.shadowColor = palette.rim;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = palette.rim + '55';
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(render);
    }
    render();
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, size]);

  const palette = PALETTES[state] || PALETTES.idle;

  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <motion.div animate={{ scale:[1,1.4,1], opacity:[0.3,0.6,0.3] }} transition={{ duration: state==='idle'?4:1.5, repeat:Infinity }}
        style={{ position:'absolute', inset:-18, borderRadius:'50%', background:`radial-gradient(circle, ${palette.rim}30 0%, transparent 70%)`, filter:'blur(10px)', pointerEvents:'none' }} />
      <canvas ref={canvasRef} style={{ width:size, height:size, display:'block', filter:`drop-shadow(0 0 22px ${palette.rim}55)` }} />
      {state !== 'idle' && [0, 1].map(i => (
        <motion.div key={i} initial={{ scale:0.9, opacity:0.5 }} animate={{ scale:1.9, opacity:0 }}
          transition={{ duration:1.8, repeat:Infinity, delay:i*0.9 }}
          style={{ position:'absolute', inset:0, borderRadius:'50%', border:`1px solid ${palette.rim}50`, pointerEvents:'none' }} />
      ))}
    </div>
  );
}
