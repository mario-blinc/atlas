import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function StatCard({ label, value, sub, color = 'var(--accent-blue)', delay = 0, alert = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{
        flex: 1,
        background: alert ? 'rgba(255,60,60,0.06)' : 'var(--bg-card)',
        border: `1px solid ${alert ? 'rgba(255,80,80,0.3)' : 'var(--border-blue)'}`,
        borderRadius: 10,
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: alert ? 'rgba(255,80,80,0.6)' : color,
        boxShadow: `0 0 8px ${alert ? 'rgba(255,80,80,0.4)' : color}`,
      }} />
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28,
        fontWeight: 700,
        color: alert ? '#ff6060' : color,
        textShadow: `0 0 20px ${alert ? 'rgba(255,80,80,0.4)' : color}40`,
        lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center' }}>
        {label}
      </div>
      {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: alert ? 'rgba(255,80,80,0.6)' : 'var(--text-dim)', marginTop: 2 }}>{sub}</div>}
    </motion.div>
  );
}

function CalendarSection({ events, loading }) {
  const now = new Date();

  const formatTime = (dt) => {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const getDuration = (start, end) => {
    if (!start || !end) return '';
    const mins = (new Date(end) - new Date(start)) / 60000;
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  const isPast = (end) => end && new Date(end) < now;
  const isCurrent = (start, end) => start && end && new Date(start) <= now && new Date(end) >= now;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {loading ? (
        [0,1,2].map(i => (
          <motion.div key={i}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            style={{ height: 56, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border-blue)' }}
          />
        ))
      ) : events.length === 0 ? (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          border: '1px dashed var(--border-blue)',
          borderRadius: 8,
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.1em',
        }}>
          NO MEETINGS TODAY
        </div>
      ) : (
        events.map((event, i) => {
          const current = isCurrent(event.start, event.end);
          const past = isPast(event.end);
          return (
            <motion.div
              key={event.id || i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: current ? 'rgba(0,180,255,0.1)' : past ? 'rgba(255,255,255,0.02)' : 'var(--bg-card)',
                border: `1px solid ${current ? 'var(--border-blue-strong)' : 'var(--border-blue)'}`,
                borderRadius: 8,
                opacity: past ? 0.5 : 1,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {current && (
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'var(--accent-blue)', boxShadow: '0 0 6px var(--accent-blue)' }}
                />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: current ? 'var(--accent-blue)' : 'var(--text-secondary)', fontWeight: 700 }}>
                  {formatTime(event.start)}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>
                  {getDuration(event.start, event.end)}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {event.title}
                </div>
                {event.location && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
                    {event.location}
                  </div>
                )}
              </div>
              {current && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--accent-blue)', letterSpacing: '0.1em', border: '1px solid var(--border-blue)', borderRadius: 3, padding: '2px 5px', flexShrink: 0 }}>
                  LIVE
                </span>
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
}

function TaskRow({ task, index }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  const daysOverdue = task.due_date ? Math.floor((new Date() - new Date(task.due_date)) / 86400000) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 14px',
        background: 'var(--bg-card)',
        border: `1px solid ${isOverdue ? 'rgba(255,80,80,0.2)' : 'var(--border-blue)'}`,
        borderRadius: 8,
        marginBottom: 6,
      }}
    >
      <div style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5,
        background: isOverdue ? '#ff6060' : 'var(--accent-blue)',
        boxShadow: `0 0 6px ${isOverdue ? 'rgba(255,80,80,0.5)' : 'rgba(0,180,255,0.4)'}`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {task.content}
        </div>
        {task.due_date && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: isOverdue ? '#ff6060' : 'var(--text-dim)', marginTop: 3, letterSpacing: '0.05em' }}>
            {isOverdue ? `${daysOverdue}d overdue` : `Due ${new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function InboxRow({ thread, index }) {
  const [expanded, setExpanded] = useState(false);
  const latest = thread.messages?.[thread.messages.length - 1];
  const isUnread = latest?.labelIds?.includes('UNREAD') || !latest?.labelIds?.includes('SENT');

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return 'just now';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={() => setExpanded(!expanded)}
      style={{
        padding: '10px 14px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-blue)',
        borderRadius: 8,
        marginBottom: 6,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      whileHover={{ borderColor: 'var(--border-blue-strong)', background: 'rgba(0,180,255,0.04)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isUnread && (
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-cyan)', flexShrink: 0, boxShadow: '0 0 6px var(--accent-cyan)' }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: isUnread ? 600 : 400, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {latest?.sender?.split('@')[0]?.split('<')[0]?.trim() || 'Unknown'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', flexShrink: 0 }}>
              {timeAgo(latest?.date)}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {latest?.subject || '(no subject)'}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: 10, fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, borderTop: '1px solid var(--border-blue)', paddingTop: 10 }}
          >
            {latest?.snippet}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState({ events: [], tasks: [], threads: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch {
      // silently fail — show empty states
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // refresh every 5 mins
    return () => clearInterval(interval);
  }, [fetchData]);

  const { events = [], tasks = [], threads = [], stats = {} } = data;
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const dueToday = tasks.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-blue)',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.25em', color: 'var(--accent-blue)' }}>
            COMMAND CENTRE
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <button
          onClick={fetchData}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-blue)',
            borderRadius: 6,
            padding: '5px 12px',
            color: 'var(--text-dim)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--accent-blue)'; e.target.style.color = 'var(--accent-blue)'; }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--border-blue)'; e.target.style.color = 'var(--text-dim)'; }}
        >
          {loading ? 'SYNCING...' : 'REFRESH'}
        </button>
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'flex',
        gap: 10,
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-blue)',
        background: 'rgba(10,10,20,0.5)',
      }}>
        <StatCard label="Meetings Today" value={events.length} sub={stats.totalHours ? `${stats.totalHours}h total` : 'clear day'} delay={0} />
        <StatCard label="Hours of Calls" value={stats.totalHours || '0'} sub="today" delay={0.05} />
        <StatCard label="Unread Emails" value={stats.unreadCount ?? threads.length} delay={0.1} alert={threads.length > 10} />
        <StatCard label="Overdue Tasks" value={overdue.length} delay={0.15} alert={overdue.length > 0} color="var(--accent-cyan)" />
        <StatCard label="Due Today" value={dueToday.length} delay={0.2} />
      </div>

      {/* Main content: three columns */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Calendar */}
        <div style={{
          flex: 1.2,
          padding: '20px',
          borderRight: '1px solid var(--border-blue)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.25em', color: 'var(--accent-blue)' }}>
            TODAY'S SCHEDULE
          </div>
          <CalendarSection events={events} loading={loading} />

          {/* Next 7 days preview */}
          {events.length === 0 && !loading && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.25em', color: 'var(--text-dim)', marginBottom: 12 }}>
                COMING UP
              </div>
              {(data.upcoming || []).map((event, i) => (
                <div key={i} style={{
                  padding: '8px 12px',
                  marginBottom: 6,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-blue)',
                  borderRadius: 6,
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginBottom: 3 }}>
                    {new Date(event.start).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)' }}>{event.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div style={{
          flex: 1,
          padding: '20px',
          borderRight: '1px solid var(--border-blue)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.25em', color: 'var(--accent-blue)' }}>
            TASKS
          </div>

          {overdue.length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#ff6060', letterSpacing: '0.15em', marginBottom: 8 }}>
                OVERDUE — {overdue.length}
              </div>
              {overdue.map((task, i) => <TaskRow key={task.id || i} task={task} index={i} />)}
            </div>
          )}

          {dueToday.length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent-cyan)', letterSpacing: '0.15em', marginBottom: 8 }}>
                DUE TODAY — {dueToday.length}
              </div>
              {dueToday.map((task, i) => <TaskRow key={task.id || i} task={task} index={i} />)}
            </div>
          )}

          {tasks.length === 0 && !loading && (
            <div style={{
              padding: '24px', textAlign: 'center',
              border: '1px dashed var(--border-blue)',
              borderRadius: 8, color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em',
            }}>
              ALL CLEAR
            </div>
          )}
        </div>

        {/* Inbox */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.25em', color: 'var(--accent-blue)' }}>
            INBOX
          </div>
          {threads.length === 0 && !loading ? (
            <div style={{
              padding: '24px', textAlign: 'center',
              border: '1px dashed var(--border-blue)',
              borderRadius: 8, color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em',
            }}>
              INBOX ZERO
            </div>
          ) : (
            threads.map((thread, i) => <InboxRow key={thread.id || i} thread={thread} index={i} />)
          )}
        </div>
      </div>
    </motion.div>
  );
}
