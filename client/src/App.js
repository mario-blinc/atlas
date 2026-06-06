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
      const json = await res.json();
      setData(json);
    } catch {
      setData({ events: [], tasks: [], threads: [], stats: {}, upcoming: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar onRefresh={fetchData} loading={loading} />
      <BentoDashboard data={data} loading={loading} />
    </div>
  );
}

function TopBar({ onRefresh, loading }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        height: 48,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        flexShrink: 0,
        gap: 32,
        zIndex: 10,
        position: 'relative',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 24, height: 24,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3,
        }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ background: i === 0 ? 'var(--bg-accent)' : '#333', borderRadius: 2 }} />
          ))}
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.2em', color: 'var(--text-primary)', fontWeight: 700 }}>
          ATLAS
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

      {/* Date */}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
        {now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
      </span>

      {/* Clock */}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
        {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>

      <div style={{ flex: 1 }} />

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onRefresh}
          style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 6, padding: '4px 10px',
            color: loading ? 'var(--text-dim)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.target.style.borderColor = 'var(--border-light)'}
          onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
        >
          {loading ? 'SYNCING' : 'REFRESH'}
        </button>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--bg-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'white', fontWeight: 700,
        }}>
          M
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>MARIO</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>BLINC</div>
        </div>
      </div>
    </motion.div>
  );
}
