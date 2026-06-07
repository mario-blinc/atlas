import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WeatherCard from './WeatherCard';

function Card({ children, accent = false, style = {}, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      style={{
        background: accent ? 'var(--bg-accent)' : 'var(--bg-card)',
        borderRadius: 12,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        ...style,
      }}
    />
  );
}

function Label({ children, light }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em',
      color: light ? 'rgba(255,255,255,0.45)' : 'var(--text-secondary)',
      textTransform: 'uppercase', marginBottom: 6, flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

function BigNum({ value, sub, light, alert, size = 42 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, lineHeight: 1 }}>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: size, fontWeight: 700, lineHeight: 1,
        letterSpacing: '-0.02em',
        color: alert ? '#c05050' : light ? 'white' : 'var(--text-primary)',
      }}>
        {value}
      </span>
      {sub && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: light ? 'rgba(255,255,255,0.4)' : 'var(--text-dim)', marginBottom: 7 }}>{sub}</span>}
    </div>
  );
}

function Bar({ value, max, color = 'var(--blue)' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 'auto', paddingTop: 10, flexShrink: 0 }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, delay: 0.4 }}
        style={{ height: '100%', background: color, borderRadius: 2 }}
      />
    </div>
  );
}

function TaskItem({ task, i }) {
  const overdue = task.due_date && new Date(task.due_date) < new Date();
  const days = task.due_date ? Math.floor((Date.now() - new Date(task.due_date)) / 86400000) : 0;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: overdue ? '#c05050' : 'var(--blue)' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>{task.content}</div>
        {task.due_date && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: overdue ? '#c05050' : 'var(--text-dim)', marginTop: 2 }}>{overdue ? `${days}d overdue` : 'today'}</div>}
      </div>
    </div>
  );
}

function EventItem({ event }) {
  const now = new Date();
  const s = new Date(event.start), e = new Date(event.end);
  const live = s <= now && e >= now;
  const past = e < now;
  const mins = (e - s) / 60000;
  const dur = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}`;
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', opacity: past ? 0.4 : 1, alignItems: 'flex-start' }}>
      <div style={{ minWidth: 38, flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: live ? 'var(--blue-light)' : 'var(--text-secondary)', fontWeight: 700 }}>
          {s.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>{dur}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</div>
        {live && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--blue-light)', marginTop: 1 }}>LIVE NOW</div>}
        {event.location && !live && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.location}</div>}
      </div>
    </div>
  );
}

function EmailItem({ thread }) {
  const [open, setOpen] = useState(false);
  const msg = thread.messages?.[thread.messages.length - 1];
  const sender = msg?.sender?.replace(/<.*>/, '').trim() || 'Unknown';
  const ago = (iso) => {
    if (!iso) return '';
    const h = Math.floor((Date.now() - new Date(iso)) / 3600000);
    return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
  };
  return (
    <div onClick={() => setOpen(!open)} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{sender}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{msg?.subject}</div>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', flexShrink: 0 }}>{ago(msg?.date)}</span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, paddingTop: 8 }}>
            {msg?.snippet}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BentoDashboard({ data, loading }) {
  const events = data?.events || [];
  const tasks = data?.tasks || [];
  const threads = data?.threads || [];
  const stats = data?.stats || {};
  const upcoming = data?.upcoming || [];

  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const dueToday = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString());
  const allTasks = [...overdue, ...dueToday];

  const Skel = ({ w = '60%', h = 28 }) => (
    <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 1.4, repeat: Infinity }}
      style={{ height: h, width: w, background: 'var(--border)', borderRadius: 4, marginBottom: 6 }} />
  );

  return (
    <div style={{
      flex: 1, padding: '12px', display: 'grid', overflow: 'hidden',
      gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1.4fr',
      gridTemplateRows: 'auto auto minmax(0,1fr) auto',
      gap: 10, minHeight: 0,
    }}>

      {/* ── TODAY'S FOCUS — tall accent, spans 2 rows ── */}
      <Card accent delay={0} style={{ gridColumn: '1', gridRow: '1 / 4', padding: '20px 22px' }}>
        <Label light>Today's Focus</Label>
        {loading ? <Skel w="50%" h={50} /> : (
          <BigNum value={events.length || 0} sub="/ meetings" size={52} light />
        )}
        <div style={{ flex: 1 }} />
        {!loading && stats.totalHours > 0 && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', marginBottom: 4 }}>HOURS IN CALLS</div>
            <BigNum value={stats.totalHours} sub="h today" size={32} light />
            <Bar value={stats.totalHours} max={8} color="rgba(255,255,255,0.3)" />
          </div>
        )}
        {!loading && stats.totalHours === 0 && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>SCHEDULE CLEAR</div>
        )}
      </Card>

      {/* ── OVERDUE ── */}
      <Card delay={0.04} style={{ gridColumn: '2', gridRow: '1' }}>
        <Label>Overdue</Label>
        {loading ? <Skel w="40%" h={38} /> : <BigNum value={overdue.length} alert={overdue.length > 0} />}
        <Bar value={overdue.length} max={10} color="#c05050" />
      </Card>

      {/* ── UNREAD ── */}
      <Card delay={0.06} style={{ gridColumn: '3', gridRow: '1' }}>
        <Label>Unread Email</Label>
        {loading ? <Skel w="40%" h={38} /> : <BigNum value={stats.unreadCount ?? threads.length} />}
        <Bar value={threads.length} max={20} />
      </Card>

      {/* ── DUE TODAY ── */}
      <Card delay={0.08} style={{ gridColumn: '4', gridRow: '1' }}>
        <Label>Due Today</Label>
        {loading ? <Skel w="40%" h={38} /> : <BigNum value={dueToday.length} />}
        <Bar value={dueToday.length} max={10} color="var(--blue)" />
      </Card>

      {/* ── WEATHER ── */}
      <div style={{ gridColumn: '5', gridRow: '1' }}>
        <WeatherCard delay={0.1} />
      </div>

      {/* ── NEXT MEETING ── */}
      <Card delay={0.1} style={{ gridColumn: '2', gridRow: '2' }}>
        <Label>Next Meeting</Label>
        {loading ? <Skel w="55%" h={28} /> : (() => {
          const now = new Date();
          const next = events.find(e => new Date(e.start) > now);
          if (!next) return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>None today</div>;
          const mins = Math.floor((new Date(next.start) - now) / 60000);
          return (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>
                {mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{next.title}</div>
            </>
          );
        })()}
      </Card>

      {/* ── MEETINGS STAT ── */}
      <Card accent delay={0.12} style={{ gridColumn: '3', gridRow: '2', background: 'var(--bg-accent-dark)' }}>
        <Label light>Meetings Today</Label>
        {loading ? <Skel w="35%" h={28} /> : <BigNum value={events.length} sub={`/ ${stats.totalHours || 0}h`} size={28} light />}
      </Card>

      {/* ── TOTAL TASKS ── */}
      <Card delay={0.13} style={{ gridColumn: '4', gridRow: '2' }}>
        <Label>Total Tasks</Label>
        {loading ? <Skel w="35%" h={28} /> : <BigNum value={tasks.length} sub="/ backlog" size={28} />}
        <Bar value={tasks.length} max={20} />
      </Card>

      {/* ── SIGNS & SYMBOLS promo card ── */}
      <Card delay={0.14} style={{ gridColumn: '5', gridRow: '2', background: '#1a1f2e', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Active Projects</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '0.08em', marginBottom: 2 }}>SIGNS &</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '0.08em' }}>SYMBOLS</div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>3 / 5 PROJECTS</div>
      </Card>

      {/* ── CALENDAR — main content row ── */}
      <Card delay={0.15} style={{ gridColumn: '1', gridRow: '3', padding: '16px 18px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Label>Today's Schedule</Label>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? [0,1,2].map(i => <Skel key={i} w="90%" h={40} />) :
            events.length === 0 ? (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 16 }}>NO MEETINGS TODAY</div>
                {upcoming.length > 0 && <>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: 8 }}>COMING UP</div>
                  {upcoming.map((e, i) => (
                    <div key={i} style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginBottom: 2 }}>
                        {new Date(e.start).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)' }}>{e.title}</div>
                    </div>
                  ))}
                </>}
              </div>
            ) : events.map((e, i) => <EventItem key={e.id || i} event={e} />)
          }
        </div>
      </Card>

      {/* ── TASKS ── */}
      <Card delay={0.17} style={{ gridColumn: '2 / 4', gridRow: '3', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Label>Tasks</Label>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? [0,1,2,3].map(i => <Skel key={i} w="85%" h={30} />) :
            allTasks.length === 0 ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>ALL CLEAR</div>
            ) : (
              <>
                {overdue.length > 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c05050', letterSpacing: '0.15em', marginBottom: 4 }}>OVERDUE</div>}
                {overdue.map((t, i) => <TaskItem key={t.id || i} task={t} i={i} />)}
                {dueToday.length > 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--blue)', letterSpacing: '0.15em', margin: '10px 0 4px' }}>DUE TODAY</div>}
                {dueToday.map((t, i) => <TaskItem key={t.id || i} task={t} i={i} />)}
              </>
            )
          }
        </div>
      </Card>

      {/* ── INBOX ── */}
      <Card delay={0.19} style={{ gridColumn: '4 / 6', gridRow: '3', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Label>Inbox</Label>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? [0,1,2,3].map(i => <Skel key={i} w="90%" h={40} />) :
            threads.length === 0 ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>INBOX ZERO</div>
            ) : threads.map((t, i) => <EmailItem key={t.id || i} thread={t} />)
          }
        </div>
      </Card>

      {/* ── FOOTER BAR ── */}
      <div style={{
        gridColumn: '1 / 6', gridRow: '4',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 900, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.2)' }}>ATLAS</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.15em' }}>SECOND BRAIN v2.0</span>
          {data?.mock && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.1em', background: 'var(--bg-card)', padding: '2px 7px', borderRadius: 4 }}>DEMO DATA</span>}
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['MARIO ANDREAS', 'BLINC STUDIO', 'LONDON'].map(t => (
            <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.12em' }}>{t}</span>
          ))}
        </div>
      </div>

    </div>
  );
}
