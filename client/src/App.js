import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GridBackground from './components/GridBackground';
import LeftPanel from './components/LeftPanel';
import Dashboard from './components/Dashboard';
import { useVoiceOutput } from './hooks/useVoice';

export default function App() {
  const [apiOnline, setApiOnline] = useState(false);
  const voiceOutput = useVoiceOutput();

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <GridBackground />

      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          borderBottom: '1px solid var(--border-blue)',
          background: 'rgba(10,10,20,0.9)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 2,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: '0.2em',
            color: 'var(--accent-blue)',
            textShadow: '0 0 20px rgba(0,180,255,0.5)',
          }}>
            ATLAS
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.15em' }}>
            SECOND BRAIN DASHBOARD
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <LiveClock />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: apiOnline ? 'var(--green-accent)' : 'var(--red-accent)', boxShadow: apiOnline ? '0 0 8px var(--green-accent)' : '0 0 8px var(--red-accent)' }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
              {apiOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <LeftPanel apiOnline={apiOnline} voiceActive={false} sessionLive={true} voiceOutput={voiceOutput} />
        <Dashboard />
      </div>
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
      {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}
