import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion';

// Melo: a digital marshmallow, ATLAS's little companion.
// Curious, cheeky, clever and occasionally dramatic.
//
// Moods follow what ATLAS is doing (`state`) and a handful of moments:
//   idle → neutral (sleepy late at night), with the odd fidget when left alone
//   you're typing → holds a chat bubble · listening → attentive
//   thinking → hand on chin, then a laptop if it runs long · answer arrives → lightbulb
//   speaking → talks with the real voice (via `analyserRef`) · reply done → happy
//   error → confused · Daddy's Home (`waveKey`) → celebrates · Blinc mode → sunglasses
//   poked (`pokeKey`) → a random reaction; poked too often → angry; poked while asleep → surprised
// `mark` renders a small still head for the brand and reply avatar.

const W = 240, H = 180;
const EYE_L = { x: 104, y: 88 }, EYE_R = { x: 138, y: 88 };
const INK = '#121318';
const ION = '#9fd6ff';
const BODY = 'M100 44 C150 40 176 49 178 84 C180 120 168 141 121 141 C75 142 62 127 62 93 C62 58 72 46 100 44 Z';
const HEAD_BOX = '56 36 128 112';

const EXPR = {
  neutral:    { eyes: 'oval' },
  attentive:  { eyes: 'oval', big: true, mark: 'strokes' },
  thinking:   { eyes: 'thinking', mouth: 'hmm' },
  working:    { eyes: 'down', prop: 'laptop', mark: 'strokes' },
  idea:       { eyes: 'happy', mouth: 'smile', prop: 'bulb' },
  supporting: { eyes: 'oval', prop: 'bubble' },
  talking:    { eyes: 'oval', mouth: 'talk' },
  happy:      { eyes: 'happy', mouth: 'smile' },
  celebrate:  { eyes: 'happy', mouth: 'smile', mark: 'confetti' },
  confused:   { eyes: 'oval', brows: 'worried', mouth: 'wobble', mark: 'question' },
  curious:    { eyes: 'oval', mark: 'question' },
  surprised:  { eyes: 'oval', big: true, mouth: 'o', mark: 'sparks' },
  sad:        { eyes: 'oval', brows: 'worried', mouth: 'frown' },
  angry:      { eyes: 'oval', brows: 'angry', mouth: 'frown', mark: 'anger' },
  sleepy:     { eyes: 'sleepy', mark: 'zz' },
  wink:       { eyes: 'wink', mouth: 'smirk' },
  cheeky:     { eyes: 'cheeky', mouth: 'smile' },
  laughing:   { eyes: 'happy', mouth: 'laugh' },
  love:       { eyes: 'happy', prop: 'heart' },
  cool:       { eyes: 'shades', mouth: 'smirk' },
};
const POKES = ['wink', 'cheeky', 'laughing', 'love', 'cool', 'surprised'];
const FIDGETS = ['curious', 'wink', 'cheeky', 'laughing', 'surprised', 'cool', 'sad'];

const loop = (d, extra = {}) => ({ duration: d, repeat: Infinity, ease: 'easeInOut', ...extra });
const springy = { type: 'spring', stiffness: 220, damping: 17 };
const bob = (delay = 0, d = 3.4) => ({ y: loop(d, { delay }), default: springy });
const still = (x = 0, y = 0, rotate = 0) => ({ x, y, rotate, transition: springy });

// Body and hand poses per mood (hands are offsets from their resting spots)
const NEUTRAL = {
  body: { y: [0, -3, 0], rotate: 0, scale: 1, transition: bob() },
  left: { x: 0, y: [0, -3, 0], rotate: 0, transition: bob(0.3) },
  right: { x: 0, y: [0, -3, 0], rotate: 0, transition: bob(0.9) },
};
const CELEBRATE = {
  body: { y: [-4, -10, -4], rotate: [-3, 3, -3], scale: 1.05, transition: { y: loop(0.6), rotate: loop(0.6), default: springy } },
  left: { x: -10, y: -30, rotate: [-16, 12, -16], transition: { rotate: loop(0.45), default: springy } },
  right: { x: 10, y: -36, rotate: [18, -14, 18], transition: { rotate: loop(0.45, { delay: 0.2 }), default: springy } },
};
const POSE = {
  neutral: NEUTRAL,
  attentive: { body: { y: -4, rotate: -6, scale: 1.04, transition: springy }, left: { x: 2, y: [0, -2, 0], rotate: 0, transition: bob(0, 1.6) }, right: still(-6, -30, -18) },
  thinking:  { body: { y: -2, rotate: [-3, 2, -3], scale: 1, transition: { rotate: loop(2.8), default: springy } },
               left: { x: 0, y: [0, -2, 0], rotate: 0, transition: bob(0, 2.8) },
               right: { x: -50, y: [8, 4, 8], rotate: 0, transition: { y: loop(0.8), default: springy } } },
  working:   { body: { y: [0, -1.5, 0], rotate: 0, scale: 1, transition: bob(0, 0.5) },
               left: { x: 30, y: [8, 5, 8], rotate: 0, transition: { y: loop(0.22), default: springy } },
               right: { x: -24, y: [8, 5, 8], rotate: 0, transition: { y: loop(0.22, { delay: 0.11 }), default: springy } } },
  idea:      { body: { y: -5, rotate: 5, scale: 1.04, transition: springy }, left: still(0, -4), right: still(2, -38, 0) },
  supporting:{ body: { y: -2, rotate: -3, scale: 1.02, transition: springy }, left: still(0, -2), right: still(16, 2, 0) },
  talking:   { body: { y: -2, rotate: 0, scale: 1.02, transition: springy },
               left: { x: 0, y: [0, -7, 0], rotate: 0, transition: bob(0, 1.1) },
               right: { x: 0, y: [0, -7, 0], rotate: 0, transition: bob(0.4, 1.1) } },
  happy:     { body: { y: [-2, -7, -2], rotate: 0, scale: 1.03, transition: bob(0, 0.9) }, left: still(0, -6), right: still(0, -6) },
  celebrate: CELEBRATE,
  confused:  { body: { y: -1, rotate: 7, scale: 1, transition: springy }, left: { x: 0, y: [0, -2, 0], rotate: 0, transition: bob() }, right: still(-8, -14, -10) },
  curious:   { body: { y: -3, rotate: -9, scale: 1.02, transition: springy }, left: still(0, -2), right: still(-4, -12, -8) },
  surprised: { body: { y: -8, rotate: 0, scale: 1.06, transition: { type: 'spring', stiffness: 500, damping: 12 } }, left: still(-8, -16, -10), right: still(8, -16, 10) },
  sad:       { body: { y: 5, rotate: -3, scale: 0.96, transition: { type: 'spring', stiffness: 90, damping: 14 } }, left: still(2, 8), right: still(-2, 8) },
  angry:     { body: { y: -2, rotate: [-3, 3, -3], scale: 1.03, transition: { rotate: loop(0.14), default: springy } },
               left: { x: 4, y: [-10, -14, -10], rotate: 0, transition: { y: loop(0.28), default: springy } },
               right: { x: -4, y: [-14, -10, -14], rotate: 0, transition: { y: loop(0.28), default: springy } } },
  sleepy:    { body: { y: [2, 0, 2], rotate: 4, scale: [1, 1.02, 1], transition: { y: loop(4.2), scale: loop(4.2), default: springy } }, left: still(0, 4), right: still(0, 4) },
  wink:      { body: { y: -3, rotate: -5, scale: 1.03, transition: springy }, left: still(), right: still(-2, -26, -12) },
  cheeky:    { body: { y: [-2, -5, -2], rotate: [-4, 4, -4], scale: 1.03, transition: { y: loop(0.5), rotate: loop(0.5), default: springy } }, left: still(4, -10), right: still(-4, -10) },
  laughing:  { body: { y: [-2, -6, -2], rotate: [-2, 2, -2], scale: 1.04, transition: { y: loop(0.32), rotate: loop(0.32), default: springy } }, left: still(4, -18), right: still(-4, -18) },
  love:      { body: { y: -3, rotate: 0, scale: [1.02, 1.05, 1.02], transition: { scale: loop(0.9), default: springy } }, left: still(40, -2), right: still(-40, -2) },
  cool:      { body: { y: -3, rotate: -4, scale: 1.04, transition: springy }, left: still(), right: still(0, -8) },
};

export default function Melo({ state = 'idle', size = 240, analyserRef, waveKey = 0, pokeKey = 0, error = false, typing = false, mode = 'personal', mark = false }) {
  const reduce = useReducedMotion();
  const [moment, setMoment] = useState(null); // a short-lived mood that overrides everything else
  const momentRef = useRef(null);
  momentRef.current = moment;
  const [late, setLate] = useState(isLate());
  const [longThink, setLongThink] = useState(false);
  const blink = useMotionValue(1);

  // Voice → mouth and squish
  const voice = useMotionValue(0);
  const mouthRy = useTransform(voice, [0, 1], [1, 8.5]);
  const squishY = useTransform(voice, [0, 1], [1, 1.05]);
  const squishX = useTransform(voice, [0, 1], [1, 0.97]);

  const stateRef = useRef(state);
  stateRef.current = state;
  const prevState = useRef(state);
  const pokes = useRef([]);
  const firstMode = useRef(true);

  const momentTimer = useRef(null);
  const flash = (m, ms) => {
    setMoment(m);
    clearTimeout(momentTimer.current);
    momentTimer.current = setTimeout(() => setMoment(null), ms);
  };
  useEffect(() => () => clearTimeout(momentTimer.current), []);

  useEffect(() => {
    if (mark) return;
    const t = setInterval(() => setLate(isLate()), 60000);
    return () => clearInterval(t);
  }, [mark]);

  // Blink at natural, irregular intervals, sometimes twice
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

  // Thinking that runs long turns into working on the laptop
  useEffect(() => {
    setLongThink(false);
    if (state !== 'thinking' || mark) return;
    const t = setTimeout(() => setLongThink(true), 2500);
    return () => clearTimeout(t);
  }, [state, mark]);

  // State changes: the answer arriving is a lightbulb moment; a finished reply earns a smile
  useEffect(() => {
    if (!mark) {
      const was = prevState.current;
      if (was === 'thinking' && state === 'speaking') flash('idea', 1100);
      else if (was === 'speaking' && state === 'idle' && !error && !momentRef.current) flash('happy', 1600);
    }
    prevState.current = state;
  }, [state, error, mark]);

  // Moments from outside
  useEffect(() => { if (waveKey && !mark) flash('celebrate', 3000); }, [waveKey, mark]);
  useEffect(() => { if (error && !mark) flash('confused', 3200); }, [error, mark]);
  useEffect(() => {
    if (mark) return;
    if (firstMode.current) { firstMode.current = false; return; }
    flash(mode === 'business' ? 'cool' : 'happy', 1800);
  }, [mode, mark]);
  useEffect(() => {
    if (!pokeKey || mark) return;
    const now = Date.now();
    pokes.current = [...pokes.current.filter(t => now - t < 4000), now];
    if (pokes.current.length >= 5) { pokes.current = []; flash('angry', 2600); }
    else if (late && !momentRef.current && stateRef.current === 'idle') flash('surprised', 1800);
    else flash(POKES[(Math.random() * POKES.length) | 0], 2200);
  }, [pokeKey, mark]);

  // Left alone, Melo gets bored and plays
  useEffect(() => {
    if (mark || reduce) return;
    let t;
    const next = () => {
      t = setTimeout(() => {
        if (stateRef.current === 'idle' && !momentRef.current && !isLate()) {
          const pick = FIDGETS[(Math.random() * FIDGETS.length) | 0];
          flash(pick, pick === 'sad' ? 2600 : 2000);
        }
        next();
      }, 14000 + Math.random() * 12000);
    };
    next();
    return () => clearTimeout(t);
  }, [mark, reduce]);

  const fromState =
    state === 'listening' ? 'attentive' :
    state === 'thinking'  ? (longThink ? 'working' : 'thinking') :
    state === 'speaking'  ? 'talking' :
    typing ? 'supporting' :
    late ? 'sleepy' : 'neutral';
  const mood = mark ? 'neutral' : (moment || fromState);
  const expr = EXPR[mood] || EXPR.neutral;
  const pose = POSE[mood] || POSE.neutral;
  const frozen = reduce || mark;
  const pick = p => (frozen ? strip(p) : p);
  const uid = mark ? 'mlk' : 'ml';
  const vb = mark ? HEAD_BOX : `0 0 ${W} ${H}`;
  const h = mark ? size * (112 / 128) : size * (H / W);
  const handStyle = { transformBox: 'fill-box', originX: 0.5, originY: 0.5 };

  return (
    <svg viewBox={vb} width={size} height={h} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
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
        <radialGradient id={`${uid}-bulb`} cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#fffbe8" />
          <stop offset="0.6" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#f5b84a" />
        </radialGradient>
        <filter id={`${uid}-blur`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" /></filter>
        <filter id={`${uid}-glow`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9" /></filter>
        <filter id={`${uid}-lift`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#2a2340" floodOpacity="0.28" />
        </filter>
      </defs>

      {!mark && (
        <motion.ellipse cx={W / 2} cy={156} rx={50} ry={6} fill="#000" opacity={0.55} filter={`url(#${uid}-blur)`}
          initial={false} animate={frozen ? {} : { scaleX: [1, 0.94, 1] }} transition={loop(3.4)}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }} />
      )}

      {/* Body and face */}
      <motion.g initial={false} animate={pick(pose.body)} style={{ transformBox: 'fill-box', originX: 0.5, originY: 1 }}>
        <motion.g style={{ scaleY: squishY, scaleX: squishX, transformBox: 'fill-box', originX: 0.5, originY: 1 }}>
          <path d={BODY} fill={`url(#${uid}-body)`} />
          <path d={BODY} fill={`url(#${uid}-shade)`} />
          <ellipse cx={96} cy={58} rx={22} ry={9} fill="#fff" opacity={0.9} filter={`url(#${uid}-soft)`} transform="rotate(-12 96 58)" />
          <motion.g initial={false} animate={frozen ? { scaleY: 1, transition: { duration: 0 } } : { scaleY: expr.big ? 1.12 : 1 }}
            transition={springy} style={{ transformBox: 'fill-box', originX: 0.5, originY: 0.5 }}>
            <Eyes type={expr.eyes} blink={blink} frozen={frozen} />
            {expr.brows && <Brows type={expr.brows} />}
            <Mouth type={expr.mouth} mouthRy={mouthRy} />
          </motion.g>
        </motion.g>
      </motion.g>

      {!mark && (
        <AnimatePresence>
          {expr.prop === 'laptop' && <Laptop key="laptop" />}
        </AnimatePresence>
      )}

      {/* Mitten hands (props they hold travel with them) */}
      {!mark && (
        <>
          <motion.g initial={false} animate={pick(pose.left)} style={handStyle}>
            <circle cx={66} cy={124} r={16} fill={`url(#${uid}-mitt)`} filter={`url(#${uid}-lift)`} />
          </motion.g>
          <motion.g initial={false} animate={pick(pose.right)} style={handStyle}>
            <AnimatePresence>
              {expr.prop === 'bulb' && <Bulb key="bulb" uid={uid} />}
              {expr.prop === 'bubble' && <Bubble key="bubble" frozen={frozen} />}
            </AnimatePresence>
            <circle cx={176} cy={120} r={16} fill={`url(#${uid}-mitt)`} filter={`url(#${uid}-lift)`} />
          </motion.g>
        </>
      )}

      {!mark && (
        <AnimatePresence>
          {expr.prop === 'heart' && (
            <motion.path key="heart" d="M121 138 C108 129 102 122 102 115 C102 109 107 105 112 105 C116 105 119 107 121 110 C123 107 126 105 130 105 C135 105 140 109 140 115 C140 122 134 129 121 138 Z"
              fill={ION} initial={{ scale: 0, opacity: 0 }} animate={{ scale: [1, 1.12, 1], opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              transition={{ scale: loop(0.9), opacity: { duration: 0.2 } }} style={{ transformBox: 'fill-box', originX: 0.5, originY: 0.5 }} />
          )}
          {expr.mark && <Mark key={expr.mark} type={expr.mark} frozen={frozen} />}
        </AnimatePresence>
      )}
    </svg>
  );
}

const popIn = { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0, opacity: 0 }, transition: { type: 'spring', stiffness: 380, damping: 20 } };
const center = { transformBox: 'fill-box', originX: 0.5, originY: 0.5 };

function Eyes({ type, blink, frozen }) {
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
  const blinking = el => (
    <motion.g style={frozen ? undefined : { scaleY: blink, transformBox: 'fill-box', originX: 0.5, originY: 0.5 }}>{el}</motion.g>
  );

  switch (type) {
    case 'happy':    return <g>{arcUp(L)}{arcUp(R)}</g>;
    case 'sleepy':   return <g>{arcDown(L)}{arcDown(R)}</g>;
    case 'wink':     return <g>{oval(L)}{chevR(R)}</g>;
    case 'cheeky':   return <g>{chevL(L)}{chevR(R)}</g>;
    case 'down':     return blinking(<g>{oval({ x: L.x - 1, y: L.y + 5 }, 5.6, 8.5)}{oval({ x: R.x - 1, y: R.y + 5 }, 5.6, 8.5)}</g>);
    case 'thinking': return (
      <g>
        <path d={`M${L.x - 8} ${L.y + 1} Q${L.x} ${L.y - 3} ${L.x + 8} ${L.y - 2}`} {...line} />
        {oval({ x: R.x + 2, y: R.y - 3 }, 5.2, 8.5)}
      </g>
    );
    case 'shades': return (
      <motion.g initial={{ y: -26, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
        <path d="M86 78 C86 76 88 75 90 75 L117 75 C119 75 120 76 120 78 C120 89 114 97 103 97 C93 97 86 90 86 78 Z" fill="#0b0c10" />
        <path d="M124 78 C124 76 125 75 127 75 L154 75 C156 75 158 76 158 78 C158 90 151 97 141 97 C130 97 124 89 124 78 Z" fill="#0b0c10" />
        <path d="M118 79 Q122 76 126 79" stroke="#0b0c10" strokeWidth={4} fill="none" />
        <path d="M80 80 L87 78 M157 78 L164 80" stroke="#0b0c10" strokeWidth={4} strokeLinecap="round" />
        <path d="M92 80 L99 80" stroke="#fff" strokeOpacity={0.5} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M130 80 L137 80" stroke="#fff" strokeOpacity={0.5} strokeWidth={2.5} strokeLinecap="round" />
      </motion.g>
    );
    default: return blinking(<g>{oval(L)}{oval(R)}</g>);
  }
}

function Brows({ type }) {
  const s = { stroke: INK, strokeWidth: 3.2, strokeLinecap: 'round' };
  return type === 'angry' ? (
    <g {...s}>
      <path d={`M${EYE_L.x - 9} ${EYE_L.y - 19} L${EYE_L.x + 6} ${EYE_L.y - 13}`} />
      <path d={`M${EYE_R.x - 6} ${EYE_R.y - 13} L${EYE_R.x + 9} ${EYE_R.y - 19}`} />
    </g>
  ) : (
    <g {...s}>
      <path d={`M${EYE_L.x - 8} ${EYE_L.y - 16} L${EYE_L.x + 5} ${EYE_L.y - 20}`} />
      <path d={`M${EYE_R.x - 5} ${EYE_R.y - 20} L${EYE_R.x + 8} ${EYE_R.y - 16}`} />
    </g>
  );
}

function Mouth({ type, mouthRy }) {
  const line = { stroke: INK, strokeWidth: 3.2, strokeLinecap: 'round', fill: 'none' };
  switch (type) {
    case 'smile':  return <path d="M113 110 Q121 118 129 110" {...line} />;
    case 'smirk':  return <path d="M114 113 Q122 116 129 109" {...line} />;
    case 'hmm':    return <path d="M117 115 L126 113" {...line} />;
    case 'frown':  return <path d="M114 117 Q121 111 128 117" {...line} />;
    case 'wobble': return <path d="M113 115 Q117 111 121 115 Q125 119 129 115" {...line} />;
    case 'o':      return <ellipse cx={121} cy={115} rx={4.2} ry={5.4} fill="#2a1a22" />;
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

// Laptop held in front, lid facing Melo
function Laptop() {
  return (
    <motion.g {...popIn} style={center}>
      <path d="M92 104 L152 104 C155 104 157 106 157 109 L160 140 L84 140 L87 109 C87 106 89 104 92 104 Z" fill="#1c1e25" />
      <path d="M92 104 L152 104 C155 104 157 106 157 109 L157.6 114 L86.4 114 L87 109 C87 106 89 104 92 104 Z" fill="#2a2d36" />
      <circle cx={122} cy={122} r={3.2} fill={ION} opacity={0.75} />
      <rect x={78} y={139} width={88} height={6} rx={3} fill="#2a2d36" />
    </motion.g>
  );
}

// Lightbulb held up in the right hand
function Bulb({ uid }) {
  return (
    <motion.g {...popIn} style={center}>
      <circle cx={176} cy={86} r={32} fill="#ffd36b" opacity={0.45} filter={`url(#${uid}-glow)`} />
      <circle cx={176} cy={86} r={18} fill={`url(#${uid}-bulb)`} />
      <path d="M169 100 L183 100 L181.5 112 L170.5 112 Z" fill="#c9cbd3" />
      <path d="M170 104 L182 104 M170.5 108 L181.5 108" stroke="#9a9caa" strokeWidth={1.6} />
      <path d="M171 84 Q176 93 181 84" stroke="#f0a43a" strokeWidth={2} fill="none" strokeLinecap="round" />
      <ellipse cx={170} cy={79} rx={4} ry={6} fill="#fff" opacity={0.7} transform="rotate(-20 170 79)" />
    </motion.g>
  );
}

// Chat bubble with typing dots, held in the right hand
function Bubble({ frozen }) {
  return (
    <motion.g {...popIn} style={center}>
      <path d="M146 74 L194 74 C201 74 206 79 206 86 L206 98 C206 105 201 110 194 110 L158 110 L146 119 L148 110 L146 110 C139 110 134 105 134 98 L134 86 C134 79 139 74 146 74 Z" fill={ION} />
      {[152, 170, 188].map((x, i) => (
        <motion.circle key={x} cx={x} cy={92} r={4} fill={INK}
          animate={frozen ? undefined : { opacity: [0.35, 1, 0.35] }} transition={loop(1, { delay: i * 0.18 })} />
      ))}
    </motion.g>
  );
}

function Mark({ type, frozen }) {
  const pop = frozen ? { initial: false } : popIn;
  const stroke = { stroke: ION, strokeWidth: 5, strokeLinecap: 'round' };
  const wiggle = frozen ? {} : { animate: { rotate: [-6, 6, -6] }, transition: loop(1.4) };
  const text = { fill: ION, fontFamily: "'Geist Sans', ui-sans-serif, system-ui, sans-serif", fontWeight: 700 };

  switch (type) {
    case 'strokes': return (
      <motion.g {...pop} style={center}>
        <path d="M182 44 L188 28" {...stroke} /><path d="M192 50 L205 42" {...stroke} />
      </motion.g>
    );
    case 'sparks': return (
      <motion.g {...pop} style={center}>
        <path d="M182 42 L188 26" {...stroke} /><path d="M192 48 L205 40" {...stroke} />
        <path d="M58 42 L52 26" {...stroke} /><path d="M48 48 L35 40" {...stroke} />
      </motion.g>
    );
    case 'confetti': {
      const bits = [
        [40, 40, 50, 30, ION], [196, 26, 204, 40, '#ff9fc2'], [28, 92, 42, 98, '#ffc46b'],
        [204, 80, 216, 70, ION], [58, 20, 62, 34, '#ffc46b'], [178, 16, 190, 22, '#ff9fc2'],
        [214, 120, 222, 132, '#ff9fc2'], [24, 130, 34, 122, ION],
      ];
      return (
        <motion.g {...pop} style={center}>
          {bits.map(([x1, y1, x2, y2, c], i) => (
            <motion.path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} stroke={c} strokeWidth={5} strokeLinecap="round"
              animate={frozen ? undefined : { y: [0, 5, 0], opacity: [1, 0.6, 1] }} transition={loop(0.9, { delay: i * 0.1 })} />
          ))}
        </motion.g>
      );
    }
    case 'question': return (
      <motion.g {...pop} style={center}>
        <motion.text x={186} y={46} fontSize={34} {...text} {...wiggle} style={center}>?</motion.text>
      </motion.g>
    );
    case 'anger': return (
      <motion.g {...pop} style={center}>
        <motion.g animate={frozen ? undefined : { scale: [1, 1.15, 1] }} transition={loop(0.4)} style={center}
          stroke={ION} strokeWidth={4} strokeLinecap="round" fill="none">
          <path d="M184 30 Q190 36 184 42" /><path d="M200 30 Q194 36 200 42" />
          <path d="M186 26 Q192 32 198 26" /><path d="M186 46 Q192 40 198 46" />
        </motion.g>
      </motion.g>
    );
    case 'zz': return (
      <motion.g {...pop} style={center}>
        <motion.g animate={frozen ? undefined : { y: [0, -4, 0], opacity: [0.7, 1, 0.7] }} transition={loop(2.4)}>
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
