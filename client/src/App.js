import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BentoDashboard from './components/BentoDashboard';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      setData(await res.json());
    } catch {
      setData({ events: [], tasks: [], threads: [], stats: {}, upcoming: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 5 * 60 * 1000); return () => clearInterval(t); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      <TopBar onRefresh={fetchData} loading={loading} greeting={greeting} />
      <BentoDashboard data={data} loading={loading} />
    </div>
  );
}

function TopBar({ onRefresh, loading, greeting }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 16,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, #00c9ff 0%, #4d7ef7 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: 'white', fontWeight: 700,
          boxShadow: '0 0 14px rgba(0,201,255,0.4)',
        }}>◈</div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: 'white' }}>ATLAS</span>
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
        {greeting}, <strong style={{ color: 'white' }}>Mario</strong>
      </span>

      <div style={{ flex: 1 }} />

      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
        {now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} &nbsp;
        <span style={{ color: 'white' }}>{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
      </span>

      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

      <button onClick={onRefresh} style={{
        width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)',
        background: 'transparent', color: 'var(--text-secondary)',
        fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >{loading ? '…' : '↻'}</button>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--border)', borderRadius: 8, padding: '4px 10px 4px 6px',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00c9ff, #4d7ef7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: 'white',
        }}>M</div>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'white', lineHeight: 1.2 }}>Mario A.</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-secondary)' }}>Blinc Studio</div>
        </div>
      </div>
    </motion.div>
  );
}
