import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BentoDashboard from './components/BentoDashboard';

const DUMMY = (() => {
  const now = new Date();
  const t = (h, m = 0) => { const d = new Date(now); d.setHours(h, m, 0, 0); return d.toISOString(); };
  return {
    mock: true,
    events: [
      { id: '1', title: 'Agency Weekly Standup', start: t(9, 0),  end: t(9, 30),  location: 'Google Meet', attendees: 4 },
      { id: '2', title: 'Signs & Symbols — Brand Review', start: t(11, 0), end: t(12, 0), location: 'Studio', attendees: 2 },
      { id: '3', title: 'Lunch with Pascal', start: t(13, 0), end: t(14, 0), location: 'Shoreditch', attendees: 2 },
      { id: '4', title: 'Mythos — Investor Prep Call', start: t(15, 30), end: t(16, 30), location: 'Zoom', attendees: 3 },
    ],
    upcoming: [
      { id: '5', title: 'Meeting with DHOM Bistro', start: new Date(now.getTime() + 4 * 86400000).toISOString() },
      { id: '6', title: 'Signs & Symbols Photoshoot', start: new Date(now.getTime() + 6 * 86400000).toISOString() },
    ],
    tasks: [
      { id: '1', content: 'Kiese amends',                          due_date: new Date(now.getTime() - 18 * 86400000).toISOString(), priority: 2 },
      { id: '2', content: 'Kickass Clothing proposal',             due_date: new Date(now.getTime() - 15 * 86400000).toISOString(), priority: 2 },
      { id: '3', content: 'Sort out pension',                      due_date: new Date(now.getTime() - 15 * 86400000).toISOString(), priority: 3 },
      { id: '4', content: 'Call Joey',                             due_date: new Date(now.getTime() -  3 * 86400000).toISOString(), priority: 1 },
      { id: '5', content: 'Message Pascal re: AL Tech round',      due_date: new Date(now.getTime() -  3 * 86400000).toISOString(), priority: 1 },
      { id: '6', content: 'Check message from Lee P',              due_date: new Date(now.getTime() -  3 * 86400000).toISOString(), priority: 1 },
      { id: '7', content: "Tom's book — review chapter draft",     due_date: now.toISOString(), priority: 2 },
      { id: '8', content: 'Follow up with Mythos supplier',        due_date: now.toISOString(), priority: 1 },
    ],
    threads: [
      { id: 't1', messages: [{ id: 'm1', date: new Date(now.getTime() - 2 * 3600000).toISOString(), sender: 'Arif Rampuri', subject: 'Re: Showtime retro — section layout', snippet: "Gentle reminder mate. I think maybe the height of the bar, the weight of the font — let's discuss?", labelIds: ['UNREAD','INBOX'] }] },
      { id: 't2', messages: [{ id: 'm2', date: new Date(now.getTime() - 5 * 3600000).toISOString(), sender: 'Pascal Levy', subject: 'AL Tech — funding round update', snippet: "Hey Mario, wanted to loop you in on where we're at. Can we get 30 mins this week?", labelIds: ['UNREAD','INBOX'] }] },
      { id: 't3', messages: [{ id: 'm3', date: new Date(now.getTime() - 24 * 3600000).toISOString(), sender: 'Shopify', subject: 'Signs & Symbols — 3 new orders', snippet: 'You have 3 new orders waiting to be fulfilled.', labelIds: ['UNREAD','INBOX'] }] },
      { id: 't4', messages: [{ id: 'm4', date: new Date(now.getTime() - 26 * 3600000).toISOString(), sender: 'Lee Pearson', subject: 'Quick one', snippet: 'Mario, drop me a message when you get a sec. Got something to run by you.', labelIds: ['UNREAD','INBOX'] }] },
      { id: 't5', messages: [{ id: 'm5', date: new Date(now.getTime() - 2 * 86400000).toISOString(), sender: 'HMRC', subject: 'Action required — Self Assessment 2024/25', snippet: 'Your Self Assessment tax return is due. Please file by 31 January 2026.', labelIds: ['UNREAD','INBOX'] }] },
    ],
    stats: { meetingCount: 4, totalHours: 3.5, unreadCount: 5, taskCount: 8 },
  };
})();

export default function App() {
  const [data, setData] = useState(DUMMY);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
    } catch {
      setData(DUMMY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 5 * 60 * 1000); return () => clearInterval(t); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)', position: 'fixed', inset: 0 }}>
      <TopBar onRefresh={fetchData} loading={loading} greeting={greeting} />
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
        <BentoDashboard data={data} loading={loading} />
      </div>
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
