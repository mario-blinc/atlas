import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate, useReducedMotion } from 'framer-motion';

// ATLAS's character: a soft, squishy marshmallow with pill eyes and mitten hands.
//
// Moods come from what ATLAS is doing (`state`), plus a few moments:
//   idle → neutral (sleepy late at night) · listening → attentive · thinking → thinking
//   speaking → talks with the real voice (via `analyserRef`) · reply done → happy
//   `error` → confused · `waveKey` (Daddy's Home) → excited · `pokeKey` (a click) → a random reaction
// `mark` renders a small still head for the brand and reply avatar.

const W = 240, H = 180;
const EYE_L = { x: 104, y: 88 }, EYE_R = { x: 138, y: 88 };
const INK = '#121318';
const ION = '#9fd6ff';
const BODY = 'M100 44 C150 40 176 49 178 84 C180 120 168 141 121 141 C75 142 62 127 62 93 C62 58 72 46 100 44 Z';
const HEAD_BOX = '56 36 128 112';

const EXPR = {
  neutral:   { eyes: 'oval' },
  attentive: { eyes: 'oval', big: true, mark: 'strokes' },
  thinking:  { eyes: 'thinking', mouth: 'hmm' },
  talking:   { eyes: 'oval', mouth: 'talk' },
  happy:     { eyes: 'happy', mouth: 'smile' },
  excited:   { eyes: 'happy', mouth: 'smile', mark: 'sparks' },
  confused:  { eyes: 'oval', brows: true, mouth: 'wobble', mark: 'question' },
  sleepy:    { eyes: 'sleepy', mark: 'zz' },
  wink:      { eyes: 'wink', mouth: 'smirk' },
  cheeky:    { eyes: 'cheeky', mouth: 'smile' },
  laughing:  { eyes: 'happy', mouth: 'laugh' },
  love:      { eyes: 'happy', prop: 'heart' },
  cool:      { eyes: 'shades', mouth: 'smirk' },
};
const POKES = ['wink', 'cheeky', 'laughing', 'love', 'cool'];

const loop = (d, extra = {}) => ({ duration: d, repeat: Infinity, ease: 'easeInOut', ...extra });
const springy = { type: 'spring', stiffness: 220, damping: 17 };
const bob = (delay = 0, d = 3.4) => ({ y: loop(d, { delay }), default: springy });

// Body and hand poses per mood (hands are offsets from their resting spots)
const POSE = {
  neutral:   { body: { y: [0, -3, 0], rotate: 0, scale: 1, transition: bob() },
               left: { x: 0, y: [0, -3, 0], rotate: 0, transition: bob(0.3) },
               right: { x: 0, y: [0, -3, 0], rotate: 0, transition: bob(0.9) } },
  attentive: { body: { y: -4, rotate: -6, scale: 1.04, transition: springy },
               left: { x: 2, y: [0, -2, 0], rotate: 0, transition: bob(0, 1.6) },
               right: { x: -6, y: -30, rotate: -18, transition: springy } },
  thinking:  { body: { y: -2, rotate: [-3, 2, -3], scale: 1, transition: { rotate: loop(2.8), default: springy } },
               left: { x: 0, y: [0, -2, 0], rotate: 0, transition: bob(0, 2.8) },
               right: { x: -50, y: [8, 4, 8], rotate: 0, transition: { y: loop(0.8), default: springy } } },
  talking:   { body: { y: -2, rotate: 0, scale: 1.02, transition: springy },
               left: { x: 0, y: [0, -7, 0], rotate: 0, transition: bob(0, 1.1) },
               right: { x: 0, y: [0, -7, 0], rotate: 0, transition: bob(0.4, 1.1) } },
  happy:     { body: { y: [-2, -7, -2], rotate: 0, scale: 1.03, transition: bob(0, 0.9) },
               left: { x: 0, y: -6, rotate: 0, transition: springy },
               right: { x: 0, y: -6, rotate: 0, transition: springy } },
  excited:   { body: { y: [-4, -10, -4], rotate: [-3, 3, -3], scale: 1.05, transition: { y: loop(0.6), rotate: loop(0.6), default: springy } },
               left: { x: -10, y: -30, rotate: [-16, 12, -16], transition: { rotate: loop(0.45), default: springy } },
               right: { x: 10, y: -36, rotate: [18, -14, 18], transition: { rotate: loop(0.45, { delay: 0.2 }), default: springy } } },
  confused:  { body: { y: -1, rotate: 7, scale: 1, transition: springy },
               left: { x: 0, y: [0, -2, 0], rotate: 0, transition: bob() },
               right: { x: -8, y: -14, rotate: -10, transition: springy } },
  sleepy:    { body: { y: [2, 0, 2], rotate: 4, scale: [1, 1.02, 1], transition: { y: loop(4.2), scale: loop(4.2), default: springy } },
               left: { x: 0, y: 4, rotate: 0, transition: springy },
               right: { x: 0, y: 4, rotate: 0, transition: springy } },
  wink:      { body: { y: -3, rotate: -5, scale: 1.03, transition: springy },
               left: { x: 0, y: 0, rotate: 0, transition: springy },
               right: { x: -2, y: -26, rotate: -12, transition: springy } },
  cheeky:    { body: { y: [-2, -5, -2], rotate: [-4, 4, -4], scale: 1.03, transition: { y: loop(0.5), rotate: loop(0.5), default: springy } },
               left: { x: 4, y: -10, rotate: 0, transition: springy },
               right: { x: -4, y: -10, rotate: 0, transition: springy } },
  laughing:  { body: { y: [-2, -6, -2], rotate: [-2, 2, -2], scale: 1.04, transition: { y: loop(0.32), rotate: loop(0.32), default: springy } },
               left: { x: 4, y: -18, rotate: 0, transition: springy },
               right: { x: -4, y: -18, rotate: 0, transition: springy } },
  love:      { body: { y: -3, rotate: 0, scale: [1.02, 1.05, 1.02], transition: { scale: loop(0.9), default: springy } },
               left: { x: 40, y: -2, rotate: 0, transition: springy },
               right: { x: -40, y: -2, rotate: 0, transition: springy } },
  cool:      { body: { y: -3, rotate: -4, scale: 1.04, transition: springy },
               left: { x: 0, y: 0, rotate: 0, transition: springy },
               right: { x: 0, y: -8, rotate: 0, transition: springy } },
};

export default function Marshmallow({ state = 'idle', size = 240, analyserRef, waveKey = 0, pokeKey = 0, error = false, mark = false }) {
  const reduce = useReducedMotion();
  const svgRef = useRef(null);
  const [moment, setMoment] = useState(null); // a short-lived mood that overrides state
  const momentRef = useRef(null);
  momentRef.current = moment;
  const [late, setLate] = useState(isLate());

  // Pointer-following eyes, as motion values (no re-render per move)
  const lookX = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const lookY = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const blink = useMotionValue(1);

  // Voice → mouth and squish
  const voice = useMotionValue(0);
  const mouthRy = useTransform(voice, [0, 1], [1, 8.5]);
  const squishY = useTransform(voice, [0, 1], [1, 1.05]);
  const squishX = useTransform(voice, [0, 1], [1, 0.97]);

  const stateRef = useRef(state);
  stateRef.current = state;
  const prevState = useRef(state);

  const momentTimer = useRef(null);
  const flash = (m, ms) => {
    setMoment(m);
    clearTimeout(momentTimer.current);
    momentTimer.current = setTimeout(() => setMoment(null), ms);
  };

  useEffect(() => {
    if (mark) return;
    const t = setInterval(() => setLate(isLate()), 60000);
    return () => clearInterval(t);
  }, [mark]);

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
    let raf;
    const t0 = performance.now();
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

  // Moments
  useEffect(() => { if (waveKey && !mark) flash('excited', 2800); }, [waveKey, mark]);
  useEffect(() => { if (pokeKey && !mark) flash(POKES[(Math.random() * POKES.length) | 0], 2200); }, [pokeKey, mark]);
  useEffect(() => { if (error && !mark) flash('confused', 3200); }, [error, mark]);
  useEffect(() => {
    // A finished reply earns a smile, but never interrupts another moment (a wave, a poke)
    if (!mark && prevState.current === 'speaking' && state === 'idle' && !error && !momentRef.current) flash('happy', 1600);
    prevState.current = state;
  }, [state, error, mark]);
  useEffect(() => () => clearTimeout(momentTimer.current), []);

  const fromState = { listening: 'attentive', thinking: 'thinking', speaking: 'talking' }[state] || (late ? 'sleepy' : 'neutral');
  const mood = mark ? 'neutral' : (moment || fromState);
  const expr = EXPR[mood] || EXPR.neutral;
  const pose = POSE[mood] || POSE.neutral;
  const still = reduce || mark;
  const pick = p => (still ? strip(p) : p);
  const uid = mark ? 'mmk' : 'mm';
  const vb = mark ? HEAD_BOX : `0 0 ${W} ${H}`;
  const h = mark ? size * (112 / 128) : size * (H / W);

  return (
    <svg ref={svgRef} viewBox={vb} width={size} height={h} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${uid}-body`} cx="0.38" cy="0.28" r="0.85">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#f6f4f8" />
          <stop offset="0.82" stopColor="#e4e0ea" />
          <stop offset="1" stopColor="#cbc5d6" />
        </radialGradient>
        <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0.45" stopColor="#6f6690" stopOpacity="0" />
          <stop offset="1" stopColor="#6f6690" stopOpacity="0.22" />
        </linearGradient>
        <radialGradient id={`${uid}-mitt`} cx="0.36" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#ece9f0" />
          <stop offset="1" stopColor="#c9c3d4" />
        </radialGradient>
        <filter id={`${uid}-blur`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" /></filter>
        <filter id={`${uid}-lift`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#2a2340" floodOpacity="0.28" />
        </filter>
      </defs>

      {!mark && (
        <motion.ellipse cx={W / 2} cy={156} rx={50} ry={6} fill="#000" opacity={0.55} filter={`url(#${uid}-blur)`}
          initial={false} animate={still ? {} : { scaleX: [1, 0.94, 1] }} transition={loop(3.4)}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }} />
      )}

      {/* Body and face */}
      <motion.g initial={false} animate={pick(pose.body)} style={{ transformBox: 'fill-box', originX: 0.5, originY: 1 }}>
        <motion.g style={{ scaleY: squishY, scaleX: squishX, transformBox: 'fill-box', originX: 0.5, originY: 1 }}>
          <path d={BODY} fill={`url(#${uid}-body)`} />
          <path d={BODY} fill={`url(#${uid}-shade)`} />
          <ellipse cx={96} cy={58} rx={22} ry={9} fill="#fff" opacity={0.9} filter={`url(#${uid}-soft)`} transform="rotate(-12 96 58)" />

          <motion.g initial={false} animate={still ? { scaleY: 1, transition: { duration: 0 } } : { scaleY: expr.big ? 1.12 : 1 }}
            transition={springy} style={{ transformBox: 'fill-box', originX: 0.5, originY: 0.5 }}>
            <Face expr={expr} lookX={lookX} lookY={lookY} blink={blink} mouthRy={mouthRy} still={still} />
          </motion.g>
        </motion.g>
      </motion.g>

      {/* Mitten hands */}
      {!mark && (
        <>
          <motion.circle cx={66} cy={124} r={16} fill={`url(#${uid}-mitt)`} filter={`url(#${uid}-lift)`}
            initial={false} animate={pick(pose.left)} style={{ transformBox: 'fill-box', originX: 0.5, originY: 0.5 }} />
          <motion.circle cx={176} cy={120} r={16} fill={`url(#${uid}-mitt)`} filter={`url(#${uid}-lift)`}
            initial={false} animate={pick(pose.right)} style={{ transformBox: 'fill-box', originX: 0.5, originY: 0.5 }} />
        </>
      )}

      {/* Held props and accent marks */}
      {!mark && (
        <AnimatePresence>
          {expr.prop === 'heart' && (
            <motion.path key="heart" d="M121 138 C108 129 102 122 102 115 C102 109 107 105 112 105 C116 105 119 107 121 110 C123 107 126 105 130 105 C135 105 140 109 140 115 C140 122 134 129 121 138 Z"
              fill={ION} initial={{ scale: 0, opacity: 0 }} animate={{ scale: [1, 1.12, 1], opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              transition={{ scale: loop(0.9), opacity: { duration: 0.2 } }} style={{ transformBox: 'fill-box', originX: 0.5, originY: 0.5 }} />
          )}
          {expr.mark && <Mark key={expr.mark} type={expr.mark} still={still} />}
        </AnimatePresence>
      )}
    </svg>
  );
}

function Face({ expr, lookX, lookY, blink, mouthRy, still }) {
  const tracks = expr.eyes === 'oval';
  return (
    <motion.g style={tracks && !still ? { x: lookX, y: lookY } : undefined}>
      <Eyes type={expr.eyes} blink={blink} still={still} />
      {expr.brows && (
        <g stroke={INK} strokeWidth={3} strokeLinecap="round">
          <path d={`M${EYE_L.x - 8} ${EYE_L.y - 16} L${EYE_L.x + 5} ${EYE_L.y - 20}`} />
          <path d={`M${EYE_R.x - 5} ${EYE_R.y - 20} L${EYE_R.x + 8} ${EYE_R.y - 16}`} />
        </g>
      )}
      <Mouth type={expr.mouth} mouthRy={mouthRy} />
    </motion.g>
  );
}

function Eyes({ type, blink, still }) {
  const L = EYE_L, R = EYE_R;
  const line = { stroke: INK, strokeWidth: 4.6, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  const oval = (p, rx = 6, ry = 10.5) => (
    <g key={p.x}>
      <ellipse cx={p.x} cy={p.y} rx={rx} ry={ry} fill={INK} />
      <ellipse cx={p.x + 1.8} cy={p.y - 4.2} rx={1.8} ry={2.4} fill="#fff" opacity={0.85} />
    </g>
  );
  const arcUp = p => <path key={p.x} d={`M${p.x - 8} ${p.y + 3} Q${p.x} ${p.y - 8} ${p.x + 8} ${p.y + 3}`} {...line} />;
  const arcDown = p => <path key={p.x} d={`M${p.x - 8} ${p.y - 1} Q${p.x} ${p.y + 7} ${p.x + 8} ${p.y - 1}`} {...line} />;
  const chevL = p => <path key={'l' + p.x} d={`M${p.x - 6} ${p.y - 7} L${p.x + 6} ${p.y} L${p.x - 6} ${p.y + 7}`} {...line} />;
  const chevR = p => <path key={'r' + p.x} d={`M${p.x + 6} ${p.y - 7} L${p.x - 6} ${p.y} L${p.x + 6} ${p.y + 7}`} {...line} />;

  switch (type) {
    case 'happy':    return <g>{arcUp(L)}{arcUp(R)}</g>;
    case 'sleepy':   return <g>{arcDown(L)}{arcDown(R)}</g>;
    case 'wink':     return <g>{oval(L)}{chevR(R)}</g>;
    case 'cheeky':   return <g>{chevL(L)}{chevR(R)}</g>;
    case 'thinking': return (
      <g>
        <path d={`M${L.x - 8} ${L.y + 1} Q${L.x} ${L.y - 3} ${L.x + 8} ${L.y - 2}`} {...line} />
        {oval({ x: R.x + 2, y: R.y - 3 }, 5.2, 8.5)}
      </g>
    );
    case 'shades': return (
      <g>
        <path d="M86 78 C86 76 88 75 90 75 L117 75 C119 75 120 76 120 78 C120 89 114 97 103 97 C93 97 86 90 86 78 Z" fill="#0b0c10" />
        <path d="M124 78 C124 76 125 75 127 75 L154 75 C156 75 158 76 158 78 C158 90 151 97 141 97 C130 97 124 89 124 78 Z" fill="#0b0c10" />
        <path d="M118 79 Q122 76 126 79" stroke="#0b0c10" strokeWidth={4} fill="none" />
        <path d="M80 80 L87 78 M157 78 L164 80" stroke="#0b0c10" strokeWidth={4} strokeLinecap="round" />
        <path d="M92 80 L99 80" stroke="#fff" strokeOpacity={0.5} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M130 80 L137 80" stroke="#fff" strokeOpacity={0.5} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    );
    default:
      return (
        <motion.g style={still ? undefined : { scaleY: blink, transformBox: 'fill-box', originX: 0.5, originY: 0.5 }}>
          {oval(L)}{oval(R)}
        </motion.g>
      );
  }
}

function Mouth({ type, mouthRy }) {
  const line = { stroke: INK, strokeWidth: 3.2, strokeLinecap: 'round', fill: 'none' };
  switch (type) {
    case 'smile':  return <path d="M113 110 Q121 118 129 110" {...line} />;
    case 'smirk':  return <path d="M114 113 Q122 116 129 109" {...line} />;
    case 'hmm':    return <path d="M117 115 L126 113" {...line} />;
    case 'wobble': return <path d="M113 115 Q117 111 121 115 Q125 119 129 115" {...line} />;
    case 'laugh':  return (
      <g>
        <path d="M110 108 Q121 108 132 108 Q131 124 121 124 Q111 124 110 108 Z" fill="#2a1a22" />
        <ellipse cx={121} cy={120} rx={6} ry={3.5} fill="#ff8fa3" />
      </g>
    );
    case 'talk':   return <motion.ellipse cx={121} cy={113} rx={6.5} ry={mouthRy} fill="#2a1a22" />;
    default:       return null;
  }
}

function Mark({ type, still }) {
  const pop = still
    ? { initial: false }
    : { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0, opacity: 0 }, transition: { type: 'spring', stiffness: 400, damping: 18 } };
  const style = { transformBox: 'fill-box', originX: 0.5, originY: 0.5 };
  const stroke = { stroke: ION, strokeWidth: 5, strokeLinecap: 'round' };
  const wiggle = still ? {} : { animate: { rotate: [-6, 6, -6] }, transition: loop(1.4) };
  const text = { fill: ION, fontFamily: "'Geist Sans', ui-sans-serif, system-ui, sans-serif", fontWeight: 700 };

  switch (type) {
    case 'strokes': return (
      <motion.g {...pop} style={style}>
        <path d="M182 44 L188 28" {...stroke} /><path d="M192 50 L205 42" {...stroke} />
      </motion.g>
    );
    case 'sparks': return (
      <motion.g {...pop} style={style}>
        <path d="M182 42 L188 26" {...stroke} /><path d="M192 48 L205 40" {...stroke} />
        <path d="M58 42 L52 26" {...stroke} /><path d="M48 48 L35 40" {...stroke} />
      </motion.g>
    );
    case 'question': return (
      <motion.g {...pop} style={style}>
        <motion.text x={186} y={46} fontSize={34} {...text} {...wiggle} style={style}>?</motion.text>
      </motion.g>
    );
    case 'zz': return (
      <motion.g {...pop} style={style}>
        <motion.g animate={still ? undefined : { y: [0, -4, 0], opacity: [0.7, 1, 0.7] }} transition={loop(2.4)}>
          <text x={172} y={48} fontSize={16} {...text}>z</text>
          <text x={184} y={36} fontSize={24} {...text}>Z</text>
        </motion.g>
      </motion.g>
    );
    default: return null;
  }
}

function isLate() {
  const h = new Date().getHours();
  return h >= 23 || h < 6;
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
