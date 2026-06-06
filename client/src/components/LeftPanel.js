import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function HeartbeatLine() {
  return (
    <svg width="100%" height="40" viewBox="0 0 200 40" preserveAspectRatio="none">
      <motion.polyline
        points="0,20 30,20 40,8 50,32 60,12 70,28 80,20 110,20 120,6 130,34 140,20 200,20"
        fill="none"
        stroke="var(--accent-blue)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop', repeatDelay: 1.5 }}
        style={{ filter: 'drop-shadow(0 0 4px var(--accent-blue))' }}
      />
    </svg>
  );
}

function StatusDot({ active, color = 'var(--accent-blue)' }) {
  return (
    <motion.span
      style={{
        display: 'inline-block',
        width: 7, height: 7,
        borderRadius: '50%',
        background: active ? color : 'rgba(120,160,200,0.3)',
        boxShadow: active ? `0 0 8px ${color}` : 'none',
        flexShrink: 0,
      }}
      animate={active ? { opacity: [1, 0.5, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    />
  );
}

export default function LeftPanel({ apiOnline, voiceActive, sessionLive, voiceOutput }) {
  const { availableVoices, selectedVoiceName, setSelectedVoiceName, rate, setRate, pitch, setPitch, previewVoice, muted, setMuted } = voiceOutput || {};
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <motion.div
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      style={{
        width: 240,
        minWidth: 240,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        padding: '24px 20px',
        borderRight: '1px solid var(--border-blue)',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* ATLAS Wordmark */}
      <div style={{ marginBottom: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: '0.15em',
            color: 'var(--accent-blue)',
            textShadow: '0 0 20px rgba(0,180,255,0.6), 0 0 40px rgba(0,180,255,0.2)',
            lineHeight: 1,
            marginBottom: 4,
          }}
        >
          ATLAS
        </motion.div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          letterSpacing: '0.2em',
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
        }}>
          Adaptive Thinking Lifestyle<br />Admin System
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border-blue)' }} />

      {/* Clock */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>
          Local Time
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '0.05em',
          textShadow: '0 0 10px rgba(0,180,255,0.3)',
        }}>
          {timeStr}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
          {dateStr}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border-blue)' }} />

      {/* Heartbeat */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>
          System Pulse
        </div>
        <HeartbeatLine />
      </div>

      <div style={{ height: 1, background: 'var(--border-blue)' }} />

      {/* Status indicators */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>
          System Status
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'API Connected', active: apiOnline, color: 'var(--green-accent)' },
            { label: 'Voice Module', active: voiceActive, color: 'var(--accent-cyan)' },
            { label: 'Session Live', active: sessionLive, color: 'var(--accent-blue)' },
          ].map(({ label, active, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StatusDot active={active} color={color} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: active ? 'var(--text-secondary)' : 'var(--text-dim)',
                letterSpacing: '0.05em',
              }}>
                {label}
              </span>
              <span style={{
                marginLeft: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: active ? color : 'var(--text-dim)',
                letterSpacing: '0.1em',
              }}>
                {active ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Voice Settings */}
      {availableVoices && (
        <div>
          <button
            onClick={() => setVoiceOpen(v => !v)}
            style={{
              width: '100%',
              background: voiceOpen ? 'rgba(0,180,255,0.1)' : 'transparent',
              border: '1px solid var(--border-blue)',
              borderRadius: 6,
              padding: '7px 10px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.15em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: voiceOpen ? 10 : 0,
              transition: 'all 0.2s',
            }}
          >
            <span>VOICE SETTINGS</span>
            <span style={{ opacity: 0.5 }}>{voiceOpen ? '▲' : '▼'}</span>
          </button>

          {voiceOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {/* Voice selector */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 5 }}>VOICE</div>
                <select
                  value={selectedVoiceName}
                  onChange={e => setSelectedVoiceName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-blue)',
                    borderRadius: 4,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    padding: '5px 6px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="">Auto (default)</option>
                  {availableVoices.map(v => (
                    <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                  ))}
                </select>
                <button
                  onClick={() => previewVoice(selectedVoiceName || (availableVoices[0]?.name))}
                  style={{
                    marginTop: 5, width: '100%',
                    background: 'transparent',
                    border: '1px solid var(--border-blue)',
                    borderRadius: 4,
                    color: 'var(--accent-blue)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8,
                    letterSpacing: '0.1em',
                    padding: '4px',
                    cursor: 'pointer',
                  }}
                >
                  ▶ PREVIEW VOICE
                </button>
              </div>

              {/* Rate */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>SPEED</span><span style={{ color: 'var(--accent-blue)' }}>{rate.toFixed(2)}x</span>
                </div>
                <input type="range" min="0.5" max="1.5" step="0.05" value={rate}
                  onChange={e => setRate(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
                />
              </div>

              {/* Pitch */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>PITCH</span><span style={{ color: 'var(--accent-blue)' }}>{pitch.toFixed(2)}</span>
                </div>
                <input type="range" min="0.5" max="1.5" step="0.05" value={pitch}
                  onChange={e => setPitch(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
                />
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Version tag */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        color: 'var(--text-dim)',
        letterSpacing: '0.15em',
        textAlign: 'center',
        paddingTop: 12,
        borderTop: '1px solid var(--border-blue)',
      }}>
        ATLAS v1.0 // SONNET-4
      </div>
    </motion.div>
  );
}
