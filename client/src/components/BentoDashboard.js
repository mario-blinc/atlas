import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WeatherCard from './WeatherCard';

// ─── Glass card ───────────────────────────────────────────────────────────────
function Card({ children, style = {}, glow = false, accent = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      style={{
        background: accent
          ? 'linear-gradient(135deg, rgba(77,126,247,0.25) 0%, rgba(123,93,247,0.2) 100%)'
          : 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${glow ? 'rgba(77,126,247,0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: glow
          ? '0 0 30px rgba(77,126,247,0.12), inset 0 1px 0 rgba(255,255,255,0.06)'
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        ...style,
      }}
    >
      {/* Top shimmer line */}
      <div style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
        background: accent
          ? 'linear-gradient(90deg, transparent, rgba(77,126,247,0.6), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
      }} />
      {children}
    </motion.div>
  );
}

function Label({ children, color }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em',
      color: color || 'var(--text-dim)', textTransform: 'uppercase',
      marginBottom: 8, flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

function BigNum({ value, sub, size = 40, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, lineHeight: 1 }}>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: size, fontWeight: 700,
        letterSpacing: '-0.02em', lineHeight: 1,
        color: color || 'var(--text-primary)',
        textShadow: color ? `0 0 20px ${color}60` : 'none',
      }}>{value}</span>
      {sub && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginBottom: 5 }}>{sub}</span>}
    </div>
  );
}

function GlowBar({ value, max = 10, color = 'var(--blue)' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 'auto', paddingTop: 10, flexShrink: 0 }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
        style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${color}aa, ${color})`, boxShadow: `0 0 8px ${color}80` }}
      />
    </div>
  );
}

function Skel({ w = '60%', h = 36 }) {
  return (
    <motion.div animate={{ opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 1.6, repeat: Infinity }}
      style={{ height: h, width: w, background: 'rgba(255,255,255,0.07)', borderRadius: 6, marginBottom: 6 }} />
  );
}

// ─── Row items ────────────────────────────────────────────────────────────────

function TaskRow({ task }) {
  const overdue = task.due_date && new Date(task.due_date) < new Date();
  const days = task.due_date ? Math.floor((Date.now() - new Date(task.due_date)) / 86400000) : 0;
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '8px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'flex-start',
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5,
        background: overdue ? 'var(--red)' : 'var(--blue)',
        boxShadow: overdue ? '0 0 6px rgba(224,85,85,0.7)' : '0 0 6px rgba(77,126,247,0.7)',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.content}
        </div>
        {task.due_date && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: overdue ? 'var(--red)' : 'var(--text-dim)', marginTop: 2 }}>
            {overdue ? `${days}d overdue` : 'due today'}
          </div>
        )}
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
    <div style={{
      display: 'flex', gap: 10, padding: '8px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: past ? 0.3 : 1,
      position: 'relative',
    }}>
      {live && <div style={{ position: 'absolute', left: -18, top: '50%', transform: 'translateY(-50%)', width: 3, height: '70%', background: 'var(--blue)', borderRadius: 2, boxShadow: '0 0 6px var(--blue)' }} />}
      <div style={{ minWidth: 38, flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: live ? 'var(--blue-bright)' : 'var(--text-secondary)', fontWeight: 700 }}>
          {s.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>{dur}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: live ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.title}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: live ? 'var(--blue)' : 'var(--text-dim)', marginTop: 1 }}>
          {live ? '● LIVE NOW' : event.location || ''}
        </div>
      </div>
    </div>
  );
}

function EmailRow({ thread }) {
  const [open, setOpen] = useState(false);
  const msg = thread.messages?.[thread.messages.length - 1];
  const sender = (msg?.sender || '').replace(/<[^>]+>/, '').trim() || 'Unknown';
  const h = msg?.date ? Math.floor((Date.now() - new Date(msg.date)) / 3600000) : 0;
  const ago = h < 1 ? 'now' : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  return (
    <div onClick={() => setOpen(o => !o)} style={{
      padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 3 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{sender}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', flexShrink: 0 }}>{ago}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: open ? 'clip' : 'ellipsis', whiteSpace: open ? 'normal' : 'nowrap', lineHeight: 1.5 }}>
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

  const now = new Date();
  const nextEvent = events.find(e => new Date(e.start) > now);
  const nextMins = nextEvent ? Math.floor((new Date(nextEvent.start) - now) / 60000) : null;

  return (
    <div style={{
      flex: 1, minHeight: 0,
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1.4fr',
      gridTemplateRows: '110px 80px minmax(0, 1fr) 36px',
      gap: 10, padding: '12px 16px 10px',
      overflow: 'hidden',
    }}>

      {/* ── TODAY'S FOCUS ── */}
      <Card accent glow delay={0} style={{ gridColumn: '1', gridRow: '1' }}>
        <Label color="rgba(180,200,255,0.5)">Today's Focus</Label>
        {loading ? <Skel w="45%" h={48} /> : (
          <BigNum value={events.length} sub="meetings today" size={48} color="white" />
        )}
        {!loading && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
            {stats.totalHours > 0 ? `${stats.totalHours}h in calls` : 'schedule clear'}
          </div>
        )}
      </Card>

      {/* ── OVERDUE ── */}
      <Card delay={0.04} style={{ gridColumn: '2', gridRow: '1' }}>
        <Label>Overdue</Label>
        {loading ? <Skel w="35%" h={42} /> : <BigNum value={overdue.length} size={42} color={overdue.length > 0 ? 'var(--red)' : 'var(--text-primary)'} />}
        {!loading && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: overdue.length ? 'var(--red)' : 'var(--text-dim)', marginTop: 4 }}>
          {overdue.length ? 'NEEDS ATTENTION' : 'ALL CLEAR'}
        </div>}
        <GlowBar value={overdue.length} max={10} color="var(--red)" />
      </Card>

      {/* ── UNREAD ── */}
      <Card delay={0.06} style={{ gridColumn: '3', gridRow: '1' }}>
        <Label>Unread Email</Label>
        {loading ? <Skel w="35%" h={42} /> : <BigNum value={stats.unreadCount ?? threads.length} size={42} color="var(--cyan)" />}
        {!loading && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>IN INBOX</div>}
        <GlowBar value={threads.length} max={20} color="var(--cyan)" />
      </Card>

      {/* ── DUE TODAY ── */}
      <Card delay={0.08} style={{ gridColumn: '4', gridRow: '1' }}>
        <Label>Due Today</Label>
        {loading ? <Skel w="35%" h={42} /> : <BigNum value={dueToday.length} size={42} color="var(--blue-bright)" />}
        {!loading && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>TASKS</div>}
        <GlowBar value={dueToday.length} max={10} color="var(--blue)" />
      </Card>

      {/* ── WEATHER ── */}
      <div style={{ gridColumn: '5', gridRow: '1' }}>
        <WeatherCard delay={0.1} />
      </div>

      {/* ── NEXT MEETING ── */}
      <Card delay={0.1} style={{ gridColumn: '1', gridRow: '2' }}>
        <Label>Next Meeting</Label>
        {loading ? <Skel w="50%" h={26} /> : nextEvent ? (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--blue-bright)', lineHeight: 1, textShadow: '0 0 20px rgba(77,126,247,0.5)' }}>
              {nextMins < 60 ? `${nextMins}m` : `${Math.floor(nextMins / 60)}h ${nextMins % 60}m`}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nextEvent.title}
            </div>
          </>
        ) : <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>None today</div>}
      </Card>

      {/* ── MEETINGS COUNT ── */}
      <Card delay={0.11} style={{ gridColumn: '2', gridRow: '2', background: 'rgba(77,126,247,0.12)', borderColor: 'rgba(77,126,247,0.25)' }}>
        <Label color="rgba(107,155,255,0.5)">Meetings</Label>
        {loading ? <Skel w="35%" h={26} /> : <BigNum value={events.length} sub={`/ ${stats.totalHours || 0}h`} size={26} color="var(--blue-bright)" />}
      </Card>

      {/* ── TOTAL TASKS ── */}
      <Card delay={0.12} style={{ gridColumn: '3', gridRow: '2' }}>
        <Label>Total Tasks</Label>
        {loading ? <Skel w="35%" h={26} /> : <BigNum value={tasks.length} sub="/ backlog" size={26} />}
        <GlowBar value={tasks.length} max={20} />
      </Card>

      {/* ── PROJECTS card ── */}
      <Card delay={0.13} style={{
        gridColumn: '4 / 6', gridRow: '2',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px',
        background: 'linear-gradient(135deg, rgba(20,30,60,0.8) 0%, rgba(15,20,45,0.9) 100%)',
        borderColor: 'rgba(77,126,247,0.15)',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', color: 'var(--text-dim)', marginBottom: 6 }}>ACTIVE PROJECTS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '0.05em', marginBottom: 2 }}>SIGNS & SYMBOLS</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['MYTHOS', 'BLINC', 'ATLAS'].map(p => (
              <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>{p}</span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--blue-bright)', textShadow: '0 0 20px rgba(77,126,247,0.5)' }}>3</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>/ 5 ACTIVE</div>
        </div>
      </Card>

      {/* ── CALENDAR ── */}
      <Card delay={0.15} style={{ gridColumn: '1', gridRow: '3', display: 'flex', flexDirection: 'column' }}>
        <Label>Schedule</Label>
        <div style={{ flex: 1, overflowY: 'auto', paddingLeft: 2 }}>
          {loading ? [0,1,2,3].map(i => <Skel key={i} w="90%" h={36} />) :
            events.length === 0 ? (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 14 }}>NO MEETINGS TODAY</div>
                {upcoming.length > 0 && <>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: 8 }}>COMING UP</div>
                  {upcoming.map((e, i) => (
                    <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
          {loading ? [0,1,2,3,4].map(i => <Skel key={i} w="85%" h={30} />) :
            allTasks.length === 0 ?
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>ALL TASKS CLEAR</div>
            : <>
                {overdue.length > 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--red)', letterSpacing: '0.15em', marginBottom: 6 }}>OVERDUE — {overdue.length}</div>}
                {overdue.map((t, i) => <TaskRow key={t.id || i} task={t} />)}
                {dueToday.length > 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--blue)', letterSpacing: '0.15em', margin: '10px 0 6px' }}>DUE TODAY — {dueToday.length}</div>}
                {dueToday.map((t, i) => <TaskRow key={t.id || i} task={t} />)}
              </>
          }
        </div>
      </Card>

      {/* ── INBOX ── */}
      <Card delay={0.19} style={{ gridColumn: '4 / 6', gridRow: '3', display: 'flex', flexDirection: 'column' }}>
        <Label>Inbox</Label>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? [0,1,2,3].map(i => <Skel key={i} w="90%" h={38} />) :
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 900, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.1)' }}>ATLAS</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.08)', letterSpacing: '0.12em' }}>SECOND BRAIN v2.0</span>
          {data?.mock && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }}>DEMO DATA</span>}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.08)', letterSpacing: '0.12em' }}>MARIO ANDREAS · BLINC STUDIO · LONDON</span>
      </div>

    </div>
  );
}
