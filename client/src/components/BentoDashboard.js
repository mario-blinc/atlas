import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WeatherCard from './WeatherCard';

// ─── Primitives ──────────────────────────────────────────────────────────────

function Card({ children, style = {}, accent = false, dark = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{
        background: accent ? 'var(--bg-accent)' : dark ? '#1a1f2e' : 'var(--bg-card)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
    />
  );
}

function Label({ children, light }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em',
      color: light ? 'rgba(255,255,255,0.4)' : 'var(--text-secondary)',
      textTransform: 'uppercase', marginBottom: 6, flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

function Num({ value, sub, light, alert, size = 40 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5 }}>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: size, fontWeight: 700,
        lineHeight: 1, letterSpacing: '-0.02em',
        color: alert ? '#c05050' : light ? '#fff' : 'var(--text-primary)',
      }}>{value}</span>
      {sub && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: light ? 'rgba(255,255,255,0.35)' : 'var(--text-dim)', marginBottom: 5 }}>{sub}</span>}
    </div>
  );
}

function Bar({ v, max = 10, color = 'var(--blue)' }) {
  const pct = max > 0 ? Math.min((v / max) * 100, 100) : 0;
  return (
    <div style={{ height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginTop: 'auto', paddingTop: 8, flexShrink: 0 }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, delay: 0.5 }}
        style={{ height: '100%', background: color, borderRadius: 2 }} />
    </div>
  );
}

function Skel({ w = '60%', h = 36 }) {
  return (
    <motion.div animate={{ opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 1.4, repeat: Infinity }}
      style={{ height: h, width: w, background: '#2a2a2a', borderRadius: 4, marginBottom: 4 }} />
  );
}

// ─── Row items ────────────────────────────────────────────────────────────────

function TaskRow({ task }) {
  const overdue = task.due_date && new Date(task.due_date) < new Date();
  const days = task.due_date ? Math.floor((Date.now() - new Date(task.due_date)) / 86400000) : 0;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: overdue ? '#c05050' : 'var(--blue)' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.content}</div>
        {task.due_date && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: overdue ? '#c05050' : 'var(--text-dim)', marginTop: 1 }}>{overdue ? `${days}d overdue` : 'today'}</div>}
      </div>
    </div>
  );
}

function EventRow({ event }) {
  const now = new Date();
  const s = new Date(event.start), e = new Date(event.end);
  const live = s <= now && e >= now;
  const past = e < now;
  const mins = Math.round((e - s) / 60000);
  const dur = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}`;
  return (
    <div style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)', opacity: past ? 0.35 : 1 }}>
      <div style={{ minWidth: 36, flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: live ? '#8aaad5' : 'var(--text-secondary)', fontWeight: 700 }}>
          {s.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>{dur}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
        {live && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#8aaad5', marginTop: 1 }}>LIVE NOW</div>}
        {!live && event.location && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.location}</div>}
      </div>
    </div>
  );
}

function EmailRow({ thread }) {
  const [open, setOpen] = useState(false);
  const msg = thread.messages?.[thread.messages.length - 1];
  const sender = (msg?.sender || '').replace(/<[^>]+>/, '').trim() || 'Unknown';
  const h = Math.floor((Date.now() - new Date(msg?.date)) / 3600000);
  const ago = h < 1 ? 'now' : h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
  return (
    <div onClick={() => setOpen(o => !o)} style={{ padding: '7px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{sender}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', flexShrink: 0 }}>{ago}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: open ? 'normal' : 'nowrap' }}>
        {open ? msg?.snippet : msg?.subject}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function BentoDashboard({ data, loading }) {
  const events = data?.events || [];
  const tasks = data?.tasks || [];
  const threads = data?.threads || [];
  const stats = data?.stats || {};
  const upcoming = data?.upcoming || [];

  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const dueToday = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString());
  const allTasks = [...overdue, ...dueToday];

  // Next meeting
  const now = new Date();
  const nextEvent = events.find(e => new Date(e.start) > now);
  const nextMins = nextEvent ? Math.floor((new Date(nextEvent.start) - now) / 60000) : null;

  return (
    <div style={{
      flex: 1,
      display: 'grid',
      gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr',
      gridTemplateRows: '120px 85px minmax(0, 1fr) 40px',
      gap: 10,
      padding: '10px 12px 12px',
      overflow: 'hidden',
      minHeight: 0,
    }}>

      {/* ── FOCUS — accent, row 1 ── */}
      <Card accent delay={0} style={{ gridColumn: '1', gridRow: '1' }}>
        <Label light>Today's Focus</Label>
        {loading ? <Skel w="45%" h={50} /> : (
          <Num value={events.length} sub="meetings" size={50} light />
        )}
        {!loading && stats.totalHours > 0 && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            {stats.totalHours}h in calls
          </div>
        )}
        {!loading && !stats.totalHours && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>schedule clear</div>
        )}
      </Card>

      {/* ── OVERDUE ── */}
      <Card delay={0.04} style={{ gridColumn: '2', gridRow: '1' }}>
        <Label>Overdue Tasks</Label>
        {loading ? <Skel w="35%" h={42} /> : <Num value={overdue.length} alert={overdue.length > 0} />}
        {!loading && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: overdue.length ? '#c05050' : 'var(--text-dim)', marginTop: 4 }}>
          {overdue.length ? 'NEEDS ATTENTION' : 'ALL CLEAR'}
        </div>}
        <Bar v={overdue.length} max={10} color="#c05050" />
      </Card>

      {/* ── UNREAD ── */}
      <Card delay={0.06} style={{ gridColumn: '3', gridRow: '1' }}>
        <Label>Unread Email</Label>
        {loading ? <Skel w="35%" h={42} /> : <Num value={stats.unreadCount ?? threads.length} />}
        {!loading && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>IN INBOX</div>}
        <Bar v={threads.length} max={20} />
      </Card>

      {/* ── DUE TODAY ── */}
      <Card delay={0.08} style={{ gridColumn: '4', gridRow: '1' }}>
        <Label>Due Today</Label>
        {loading ? <Skel w="35%" h={42} /> : <Num value={dueToday.length} />}
        {!loading && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>TASKS</div>}
        <Bar v={dueToday.length} max={10} color="var(--blue)" />
      </Card>

      {/* ── WEATHER ── */}
      <div style={{ gridColumn: '5', gridRow: '1' }}>
        <WeatherCard delay={0.1} />
      </div>

      {/* ── NEXT MEETING ── */}
      <Card delay={0.1} style={{ gridColumn: '1', gridRow: '2' }}>
        <Label>Next Meeting</Label>
        {loading ? <Skel w="55%" h={26} /> : nextEvent ? (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
              {nextMins < 60 ? `${nextMins}m` : `${Math.floor(nextMins / 60)}h ${nextMins % 60}m`}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nextEvent.title}
            </div>
          </>
        ) : <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>None today</div>}
      </Card>

      {/* ── MEETINGS COUNT ── */}
      <Card accent delay={0.11} style={{ gridColumn: '2', gridRow: '2', background: '#3a4d6a' }}>
        <Label light>Meetings</Label>
        {loading ? <Skel w="30%" h={26} /> : <Num value={events.length} sub={`/ ${stats.totalHours || 0}h`} size={26} light />}
      </Card>

      {/* ── TOTAL TASKS ── */}
      <Card delay={0.12} style={{ gridColumn: '3', gridRow: '2' }}>
        <Label>Total Tasks</Label>
        {loading ? <Skel w="30%" h={26} /> : <Num value={tasks.length} sub="/ backlog" size={26} />}
        <Bar v={tasks.length} max={20} />
      </Card>

      {/* ── PROJECTS CARD ── */}
      <Card dark delay={0.13} style={{ gridColumn: '4 / 6', gridRow: '2', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>ACTIVE PROJECTS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'white', letterSpacing: '0.06em' }}>SIGNS & SYMBOLS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'white', letterSpacing: '0.06em' }}>MYTHOS · BLINC</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'white' }}>3</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>/ 5 ACTIVE</div>
        </div>
      </Card>

      {/* ── CALENDAR ── */}
      <Card delay={0.15} style={{ gridColumn: '1', gridRow: '3', display: 'flex', flexDirection: 'column' }}>
        <Label>Schedule</Label>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? [0,1,2,3].map(i => <Skel key={i} w="90%" h={34} />) :
            events.length === 0 ? (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 14 }}>NO MEETINGS TODAY</div>
                {upcoming.length > 0 && <>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: 8 }}>COMING UP</div>
                  {upcoming.map((e, i) => (
                    <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginBottom: 2 }}>
                        {new Date(e.start).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)' }}>{e.title}</div>
                    </div>
                  ))}
                </>}
              </div>
            ) : events.map((e, i) => <EventRow key={e.id || i} event={e} />)
          }
        </div>
      </Card>

      {/* ── TASKS ── */}
      <Card delay={0.17} style={{ gridColumn: '2 / 4', gridRow: '3', display: 'flex', flexDirection: 'column' }}>
        <Label>Tasks</Label>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? [0,1,2,3,4].map(i => <Skel key={i} w="85%" h={28} />) :
            allTasks.length === 0 ?
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>ALL CLEAR</div>
            : <>
                {overdue.length > 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c05050', letterSpacing: '0.15em', marginBottom: 4 }}>OVERDUE — {overdue.length}</div>}
                {overdue.map((t, i) => <TaskRow key={t.id || i} task={t} />)}
                {dueToday.length > 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--blue)', letterSpacing: '0.15em', margin: '10px 0 4px' }}>DUE TODAY — {dueToday.length}</div>}
                {dueToday.map((t, i) => <TaskRow key={t.id || i} task={t} />)}
              </>
          }
        </div>
      </Card>

      {/* ── INBOX ── */}
      <Card delay={0.19} style={{ gridColumn: '4 / 6', gridRow: '3', display: 'flex', flexDirection: 'column' }}>
        <Label>Inbox</Label>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? [0,1,2,3].map(i => <Skel key={i} w="90%" h={36} />) :
            threads.length === 0 ?
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>INBOX ZERO</div>
            : threads.map((t, i) => <EmailRow key={t.id || i} thread={t} />)
          }
        </div>
      </Card>

      {/* ── FOOTER ── */}
      <div style={{
        gridColumn: '1 / 6', gridRow: '4',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 900, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.15)' }}>ATLAS</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#333', letterSpacing: '0.12em' }}>SECOND BRAIN v2.0</span>
          {data?.mock && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#444', background: '#222', padding: '2px 6px', borderRadius: 4 }}>DEMO DATA</span>}
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {['MARIO ANDREAS', 'BLINC STUDIO', 'LONDON'].map(t => (
            <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#333', letterSpacing: '0.12em' }}>{t}</span>
          ))}
        </div>
      </div>

    </div>
  );
}
