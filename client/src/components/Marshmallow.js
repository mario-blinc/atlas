import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate, useReducedMotion } from 'framer-motion';

// ATLAS's character: a soft marshmallow with floating mitten hands.
// - idle: breathes, blinks, and its eyes follow the pointer
// - listening: leans in, eyes widen, one hand cupped to its side
// - thinking: sways, glances up, taps its chin
// - speaking: mouth moves with the real voice (via `analyserRef`), body squishes with it
// - `waveKey` changes: happy eyes and a wave (Daddy's Home)
// `mark` renders a small, still head for the brand and reply avatar.

const W = 240, H = 180;
const BODY = { x: 68, y: 46, w: 104, h: 90, r: 38 };
const EYE_L = 105, EYE_R = 135, EYE_Y = 84;

const loop = (d, extra = {}) => ({ duration: d, repeat: Infinity, ease: 'easeInOut', ...extra });
const springy = { type: 'spring', stiffness: 220, damping: 16 };

const POSE = {
  idle: {
    body:  { y: [0, -3, 0], rotate: 0, scale: 1, transition: { y: loop(3.4), default: springy } },
    eyes:  { x: 0, y: 0, scaleY: 1 },
    left:  { x: 0, y: [0, -4, 0], rotate: 0, transition: { y: loop(3.4, { delay: 0.3 }), default: springy } },
    right: { x: 0, y: [0, -4, 0], rotate: 0, transition: { y: loop(3.4, { delay: 0.9 }), default: springy } },
  },
  listening: {
    body:  { y: -4, rotate: -5, scale: 1.04, transition: springy },
    eyes:  { x: -2, y: -1, scaleY: 1.18 },
    left:  { x: 2, y: [0, -2, 0], rotate: 0, transition: { y: loop(1.6), default: springy } },
    right: { x: -8, y: -30, rotate: -20, transition: springy },
  },
  thinking: {
    body:  { y: -2, rotate: [-3, 3, -3], scale: 1, transition: { rotate: loop(2.6), default: springy } },
    eyes:  { x: 4, y: -5, scaleY: 1 },
    left:  { x: 0, y: [0, -3, 0], rotate: 0, transition: { y: loop(2.6), default: springy } },
    right: { x: -46, y: [22, 18, 22], rotate: 0, transition: { y: loop(0.7), default: springy } },
  },
  speaking: {
    body:  { y: -2, rotate: 0, scale: 1.02, transition: springy },
    eyes:  { x: 0, y: -1, scaleY: 1 },
    left:  { x: 0, y: [0, -7, 0], rotate: 0, transition: { y: loop(1.1), default: springy } },
    right: { x: 0, y: [0, -7, 0], rotate: 0, transition: { y: loop(1.1, { delay: 0.4 }), default: springy } },
  },
  wave: {
    body:  { y: -6, rotate: 4, scale: 1.05, transition: springy },
    eyes:  { x: 0, y: 0, scaleY: 1 },
    left:  { x: 0, y: [0, -3, 0], rotate: 0, transition: { y: loop(1.2), default: springy } },
    right: { x: -2, y: -44, rotate: [-24, 18, -24], transition: { rotate: loop(0.5), default: springy } },
  },
};

export default function Marshmallow({ state = 'idle', size = 240, analyserRef, waveKey = 0, mark = false }) {
  const reduce = useReducedMotion();
  const svgRef = useRef(null);
  const [waving, setWaving] = useState(false);

  // Pointer-following eyes, as motion values (no re-render per move)
  const lookX = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const lookY = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const blink = useMotionValue(1);

  // Voice → mouth and squish
  const voice = useMotionValue(0);
  const mouthRy = useTransform(voice, [0, 1], [0.8, 8]);
  const squishY = useTransform(voice, [0, 1], [1, 1.05]);
  const squishX = useTransform(voice, [0, 1], [1, 0.97]);

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (mark || reduce) return;
    const onMove = e => {
      const r = svgRef.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.max(1, Math.hypot(dx, dy));
      const k = Math.min(1, d / 400);
      lookX.set((dx / d) * 5 * k);
      lookY.set((dy / d) * 3.5 * k);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [mark, reduce, lookX, lookY]);

  // Blink at natural, irregular intervals
  useEffect(() => {
    if (mark || reduce) return;
    let t;
    const next = () => {
      t = setTimeout(() => {
        animate(blink, [1, 0.08, 1], { duration: 0.22, ease: 'easeInOut' });
        if (Math.random() < 0.25) setTimeout(() => animate(blink, [1, 0.08, 1], { duration: 0.2 }), 260);
        next();
      }, 2200 + Math.random() * 3200);
    };
    next();
    return () => clearTimeout(t);
  }, [mark, reduce, blink]);

  // Mouth follows the real voice while speaking; synthetic chatter as a fallback
  useEffect(() => {
    if (mark) return;
    const freq = new Uint8Array(64);
    let raf, t0 = performance.now();
    const tick = now => {
      let target = 0;
      if (stateRef.current === 'speaking') {
        const an = analyserRef?.current;
        let level = 0;
        if (an) {
          an.getByteFrequencyData(freq);
          let sum = 0;
          for (let i = 2; i < 30; i++) sum += freq[i];
          level = sum / 28 / 255;
        }
        if (level > 0.02) target = Math.min(1, level * 2.2);
        else if (!reduce) {
          const t = (now - t0) / 1000;
          target = (Math.sin(t * 13) * 0.5 + 0.5) * (Math.sin(t * 2.7) * 0.35 + 0.65) * 0.75;
        }
      }
      voice.set(voice.get() + (target - voice.get()) * 0.35);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mark, reduce, analyserRef, voice]);

  // Daddy's Home: wave and smile for a moment
  useEffect(() => {
    if (!waveKey || mark) return;
    setWaving(true);
    const t = setTimeout(() => setWaving(false), 2600);
    return () => clearTimeout(t);
  }, [waveKey, mark]);

  const pose = POSE[waving ? 'wave' : state] || POSE.idle;
  const still = reduce || mark;
  const pick = p => (still ? strip(p) : p);
  const happy = waving;
  const speaking = state === 'speaking' && !waving;
  const vb = mark ? `${BODY.x - 6} ${BODY.y - 6} ${BODY.w + 12} ${BODY.h + 12}` : `0 0 ${W} ${H}`;
  const h = mark ? size : size * (H / W);
  const uid = mark ? 'mm-mark' : 'mm';

  return (
    <svg ref={svgRef} viewBox={vb} width={size} height={h} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#f1f2f6" />
          <stop offset="1" stopColor="#dcdfe6" />
        </linearGradient>
        <radialGradient id={`${uid}-mitten`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dde0e7" />
        </radialGradient>
        <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {!mark && (
        <motion.ellipse cx={W / 2} cy={150} rx={44} ry={5} fill="#000" opacity={0.5} filter={`url(#${uid}-soft)`}
          initial={false} animate={still ? {} : { scaleX: [1, 0.94, 1] }} transition={loop(3.4)}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }} />
      )}

      {/* Body and face */}
      <motion.g initial={false} animate={pick(pose.body)} style={{ transformBox: 'fill-box', originX: 0.5, originY: 1 }}>
        <motion.g style={{ scaleY: squishY, scaleX: squishX, transformBox: 'fill-box', originX: 0.5, originY: 1 }}>
          <rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} rx={BODY.r} fill={`url(#${uid}-body)`} />
          <ellipse cx={98} cy={60} rx={20} ry={7} fill="#fff" opacity={0.85} transform="rotate(-14 98 60)" />

          <ellipse cx={93} cy={104} rx={9} ry={5} fill="#ffb3bf" opacity={0.32} />
          <ellipse cx={147} cy={104} rx={9} ry={5} fill="#ffb3bf" opacity={0.32} />

          <motion.g style={{ x: lookX, y: lookY }}>
            <motion.g initial={false} animate={still ? strip(pose.eyes) : pose.eyes} transition={springy}>
              {happy ? (
                <g stroke="#171a20" strokeWidth={3.2} strokeLinecap="round" fill="none">
                  <path d={`M${EYE_L - 6} ${EYE_Y + 2} Q${EYE_L} ${EYE_Y - 6} ${EYE_L + 6} ${EYE_Y + 2}`} />
                  <path d={`M${EYE_R - 6} ${EYE_Y + 2} Q${EYE_R} ${EYE_Y - 6} ${EYE_R + 6} ${EYE_Y + 2}`} />
                </g>
              ) : (
                <motion.g style={{ scaleY: blink, transformBox: 'fill-box', transformOrigin: '50% 50%' }}>
                  <ellipse cx={EYE_L} cy={EYE_Y} rx={4.6} ry={7.4} fill="#171a20" />
                  <ellipse cx={EYE_R} cy={EYE_Y} rx={4.6} ry={7.4} fill="#171a20" />
                  <circle cx={EYE_L + 1.4} cy={EYE_Y - 3} r={1.4} fill="#fff" opacity={0.9} />
                  <circle cx={EYE_R + 1.4} cy={EYE_Y - 3} r={1.4} fill="#fff" opacity={0.9} />
                </motion.g>
              )}
              {happy && (
                <path d="M113 102 Q120 109 127 102" stroke="#171a20" strokeWidth={2.6} strokeLinecap="round" fill="none" />
              )}
              <motion.ellipse cx={120} cy={104} rx={5.5} ry={mouthRy} fill="#2a1c22"
                initial={false} animate={{ opacity: speaking ? 1 : 0 }} transition={{ duration: 0.15 }} />
            </motion.g>
          </motion.g>
        </motion.g>
      </motion.g>

      {/* Floating mitten hands */}
      {!mark && (
        <>
          <motion.circle cx={52} cy={112} r={11} fill={`url(#${uid}-mitten)`}
            initial={false} animate={pick(pose.left)} style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }} />
          <motion.circle cx={188} cy={108} r={11} fill={`url(#${uid}-mitten)`}
            initial={false} animate={pick(pose.right)} style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }} />
        </>
      )}
    </svg>
  );
}

// Reduced motion / mark: hold the pose, drop the loops
function strip(p) {
  const out = {};
  for (const [k, v] of Object.entries(p)) {
    if (k === 'transition') continue;
    out[k] = Array.isArray(v) ? v[0] : v;
  }
  out.transition = { duration: 0 };
  return out;
}
