import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BentoDashboard from './components/BentoDashboard';
import AtlasChat from './components/AtlasChat';

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

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', overflow: 'hidden',
      background: 'var(--bg)',
      position: 'relative',
    }}>
      {/* Ambient background glows */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 60% 50% at 15% 50%, rgba(40,70,180,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 40% 40% at 85% 20%, rgba(60,40,160,0.15) 0%, transparent 55%),
          radial-gradient(ellipse 50% 60% at 70% 85%, rgba(20,60,160,0.12) 0%, transparent 60%)
        `,
      }} />

      {/* Left sidebar */}
      <Sidebar />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Header greeting={greeting} onRefresh={fetchData} loading={loading} data={data} />
        {/* Dashboard grid */}
        <BentoDashboard data={data} loading={loading} />
      </div>

      <AtlasChat dashboardData={data} />
    </div>
  );
}

function Sidebar() {
  const [active, setActive] = useState(0);
  const icons = [
    { icon: '◈', label: 'Dashboard' },
    { icon: '◷', label: 'Calendar' },
    { icon: '✉', label: 'Inbox' },
    { icon: '◻', label: 'Tasks' },
    { icon: '◎', label: 'Projects' },
  ];
  return (
    <motion.div
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        width: 60, flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '20px 0',
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-sidebar)',
        backdropFilter: 'blur(20px)',
        position: 'relative', zIndex: 2,
        gap: 6,
      }}
    >
      {/* Logo mark */}
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'linear-gradient(135deg, #4d7ef7, #7b5df7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16, flexShrink: 0,
        boxShadow: '0 0 20px rgba(77,126,247,0.4)',
      }}>
        <span style={{ fontSize: 14, color: 'white' }}>◈</span>
      </div>

      {icons.map((item, i) => (
        <button key={i} onClick={() => setActive(i)} title={item.label} style={{
          width: 40, height: 40, borderRadius: 10,
          background: active === i ? 'rgba(77,126,247,0.2)' : 'transparent',
          border: active === i ? '1px solid rgba(77,126,247,0.4)' : '1px solid transparent',
          color: active === i ? 'var(--blue-bright)' : 'var(--text-dim)',
          fontSize: 16, cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onMouseEnter={e => { if (active !== i) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { if (active !== i) e.currentTarget.style.background = 'transparent'; }}
        >
          {item.icon}
        </button>
      ))}

      <div style={{ flex: 1 }} />

      {/* User avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        background: 'linear-gradient(135deg, #4d7ef7 0%, #7b5df7 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'white',
        border: '2px solid rgba(77,126,247,0.4)',
        boxShadow: '0 0 12px rgba(77,126,247,0.3)',
      }}>
        M
      </div>
    </motion.div>
  );
}

function Header({ greeting, onRefresh, loading, data }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const stats = data?.stats || {};
  const threads = data?.threads || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{
        padding: '18px 24px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(8,12,26,0.8)',
        backdropFilter: 'blur(30px)',
        flexShrink: 0,
        position: 'relative', zIndex: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>
            {greeting},
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Mario Andreas
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Quick stats chips */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { v: stats.meetingCount ?? (data?.events?.length ?? 0), label: 'meetings', color: 'var(--blue)' },
              { v: stats.unreadCount ?? threads.length, label: 'unread', color: 'var(--cyan)' },
              { v: stats.taskCount ?? (data?.tasks?.length ?? 0), label: 'tasks', color: '#c05050' },
            ].map(({ v, label, color }) => (
              <div key={label} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 8, padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: 6,
                backdropFilter: 'blur(10px)',
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color }}>{loading ? '—' : v}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>{label.toUpperCase()}</span>
              </div>
            ))}
          </div>

          {/* Clock */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
              {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>
              {now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
            </div>
          </div>

          {/* Refresh */}
          <button onClick={onRefresh} style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text-dim)', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
          >
            {loading ? '…' : '↻'}
          </button>

          {/* Avatar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '5px 10px 5px 5px',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4d7ef7, #7b5df7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'white',
            }}>M</div>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>Mario</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>Blinc Studio</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
