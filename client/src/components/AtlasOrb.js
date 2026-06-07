import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function AtlasOrb({ speaking = false, listening = false, thinking = false }) {
  const state = listening ? 'listening' : thinking ? 'thinking' : speaking ? 'speaking' : 'idle';

  const colors = {
    idle:      { core: ['#1a3a6e', '#0d1f3c'], ring: 'rgba(0,201,255,0.15)', glow: 'rgba(0,201,255,0.08)' },
    speaking:  { core: ['#0d4a7a', '#1a6aaa'], ring: 'rgba(0,201,255,0.4)',  glow: 'rgba(0,201,255,0.2)'  },
    listening: { core: ['#4a1a6e', '#2d0d4c'], ring: 'rgba(160,80,255,0.4)', glow: 'rgba(140,60,255,0.2)' },
    thinking:  { core: ['#0d3a5a', '#0a2a45'], ring: 'rgba(77,126,247,0.35)', glow: 'rgba(77,126,247,0.15)' },
  };
  const c = colors[state];

  return (
    <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer ambient glow */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: state === 'idle' ? 3 : 1.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: 160, height: 160,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />

      {/* Outer ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: state === 'idle' ? 12 : 4, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          width: 148, height: 148,
          borderRadius: '50%',
          border: `1px solid ${c.ring}`,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
        }}
      />

      {/* Middle ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: state === 'idle' ? 8 : 3, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          width: 124, height: 124,
          borderRadius: '50%',
          border: `1px solid ${c.ring}`,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          opacity: 0.6,
        }}
      />

      {/* Pulse rings when speaking/listening */}
      {(speaking || listening || thinking) && [0, 1, 2].map(i => (
        <motion.div
          key={i}
          initial={{ scale: 0.7, opacity: 0.6 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: 90, height: 90,
            borderRadius: '50%',
            border: `1px solid ${c.ring}`,
          }}
        />
      ))}

      {/* Core sphere */}
      <motion.div
        animate={{
          scale: state === 'idle' ? [1, 1.04, 1] : state === 'speaking' ? [1, 1.08, 1, 1.05, 1] : [1, 1.06, 1],
        }}
        transition={{ duration: state === 'idle' ? 3 : 0.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 90, height: 90,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${c.core[0]}, ${c.core[1]} 70%, #050810 100%)`,
          boxShadow: `0 0 30px ${c.ring}, 0 0 60px ${c.glow}, inset 0 0 30px rgba(0,0,0,0.5)`,
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Inner highlight */}
        <div style={{
          position: 'absolute', top: '18%', left: '22%',
          width: '30%', height: '20%',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
          filter: 'blur(4px)',
        }} />

        {/* State indicator */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: state === 'idle' ? 2.5 : 0.6, repeat: Infinity }}
          style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: state === 'listening' ? '#c080ff' : state === 'thinking' ? '#4d7ef7' : 'rgba(0,201,255,0.7)',
          }}
        >
          {state === 'idle' ? 'ATLAS' : state === 'listening' ? '●' : state === 'thinking' ? '···' : '◈'}
        </motion.div>
      </motion.div>
    </div>
  );
}
