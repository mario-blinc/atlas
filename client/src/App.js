import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BentoDashboard from './components/BentoDashboard';
import AtlasChat from './components/AtlasChat';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('Dashboard');

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
      {/* Top nav bar */}
      <TopBar activeNav={activeNav} setActiveNav={setActiveNav} onRefresh={fetchData} loading={loading} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left sidebar */}
        <Sidebar />

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {/* Greeting */}
          <GreetingBar greeting={greeting} data={data} loading={loading} />
          {/* Dashboard */}
          <BentoDashboard data={data} loading={loading} />
        </div>
      </div>

      <AtlasChat dashboardData={data} />
    </div>
  );
}

function TopBar({ activeNav, setActiveNav, onRefresh, loading }) {
  const navItems = ['Dashboard', 'Calendar', 'Tasks', 'Inbox', 'Settings'];
  return (
    <div style={{
      height: 52, flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 0,
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-sidebar)',
      paddingLeft: 0,
    }}>
      {/* Logo area */}
      <div style={{
        width: 200, flexShrink: 0, height: '100%',
        display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 16,
        borderRight: '1px solid var(--border)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #00c9ff 0%, #4d7ef7 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 0 16px rgba(0,201,255,0.35)',
        }}>
          <span style={{ fontSize: 13, color: 'white', fontWeight: 700 }}>◈</span>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: 'white' }}>ATLAS</span>
      </div>

      {/* Nav tabs */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 2 }}>
        {navItems.map(item => (
          <button key={item} onClick={() => setActiveNav(item)} style={{
            padding: '6px 14px', background: 'transparent', border: 'none',
            color: activeNav === item ? 'var(--teal)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: activeNav === item ? 600 : 400,
            cursor: 'pointer', borderRadius: 6, transition: 'all 0.15s',
            borderBottom: activeNav === item ? '2px solid var(--teal)' : '2px solid transparent',
          }}
            onMouseEnter={e => { if (activeNav !== item) e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { if (activeNav !== item) e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 16 }}>
        <button onClick={onRefresh} style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >{loading ? '…' : '↻'}</button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '4px 10px 4px 6px',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00c9ff, #4d7ef7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>M</div>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'white', lineHeight: 1.2 }}>Mario A.</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-secondary)' }}>mario@blincstudio.co.uk</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  const [active, setActive] = useState(0);
  const items = [
    { icon: '⊞', label: 'Overview' },
    { icon: '◷', label: 'Calendar' },
    { icon: '◻', label: 'Tasks' },
    { icon: '✉', label: 'Inbox' },
    { icon: '◎', label: 'Projects' },
    { icon: '⚙', label: 'Settings' },
  ];
  return (
    <motion.div
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        width: 200, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-sidebar)',
        padding: '16px 10px',
        gap: 2,
        overflowY: 'auto',
      }}
    >
      {items.map((item, i) => (
        <button key={i} onClick={() => setActive(i)} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 8, border: 'none',
          background: active === i ? 'rgba(0,201,255,0.08)' : 'transparent',
          color: active === i ? 'var(--teal)' : 'var(--text-secondary)',
          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: active === i ? 500 : 400,
          cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
          borderLeft: active === i ? '2px solid var(--teal)' : '2px solid transparent',
        }}
          onMouseEnter={e => { if (active !== i) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
          onMouseLeave={e => { if (active !== i) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
        >
          <span style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}

      <div style={{ flex: 1 }} />
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.15em' }}>ATLAS v2.0</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', marginTop: 2 }}>BLINC STUDIO</div>
      </div>
    </motion.div>
  );
}

function GreetingBar({ greeting, data, loading }) {
  const stats = data?.stats || {};
  const threads = data?.threads || [];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      style={{
        padding: '14px 20px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>{greeting},</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 22, fontWeight: 700, color: 'white', letterSpacing: '-0.01em', lineHeight: 1 }}>
          Mario Andreas
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {[
          { val: loading ? '—' : (data?.events?.length ?? 0), label: 'Meetings', color: 'var(--teal)' },
          { val: loading ? '—' : (stats.unreadCount ?? threads.length), label: 'Unread', color: 'var(--orange)' },
          { val: loading ? '—' : (data?.tasks?.length ?? 0), label: 'Tasks', color: 'var(--red)' },
        ].map(({ val, label, color }) => (
          <div key={label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '7px 14px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
