import React from 'react';
import { motion } from 'framer-motion';

export default function SessionRestore({ onRestore, onFresh }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,10,15,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(10px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-blue-strong)',
          borderRadius: 12,
          padding: '36px 40px',
          maxWidth: 420,
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 0 60px rgba(0,180,255,0.1)',
        }}
      >
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          letterSpacing: '0.3em',
          color: 'var(--accent-blue)',
          marginBottom: 16,
        }}>
          SESSION DETECTED
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          color: 'var(--text-primary)',
          marginBottom: 8,
          fontWeight: 500,
        }}>
          Previous session found.
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginBottom: 28,
          lineHeight: 1.6,
        }}>
          Resume where you left off, or start a clean session.
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onRestore}
            style={{
              flex: 1,
              background: 'rgba(0,180,255,0.15)',
              border: '1px solid var(--border-blue-strong)',
              borderRadius: 8,
              padding: '12px',
              color: 'var(--accent-blue)',
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              letterSpacing: '0.15em',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,180,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,180,255,0.15)'}
          >
            RESUME
          </button>
          <button
            onClick={onFresh}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid var(--border-blue)',
              borderRadius: 8,
              padding: '12px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              letterSpacing: '0.15em',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-blue-strong)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-blue)'}
          >
            START FRESH
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
