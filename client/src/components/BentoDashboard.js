import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WeatherCard from './WeatherCard';

function Card({ children, style = {}, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
    />
  );
}

function SectionLabel({ children, color, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: color || 'var(--text-secondary)', letterSpacing: '0.02em' }}>
        {children}
      </span>
      {action && <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--teal)', cursor: 'pointer' }}>{action}</span>}
    </div>
  );
}

function StatBlock({ label, value, sub, color = 'var(--teal)', size = 32 }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: size, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</span>
        {sub && <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)' }}>{sub}</span>}
      </div>
    </div>
  );
}

function ProgressRow({ label, value, max = 100, color = 'var(--teal)' }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 3 }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay: 0.4 }}
          style={{ height: '100%', background: color, borderRadius: 3, boxShadow: `0 0 8px ${color}80` }}
        />
      </div>
    </div>
  );
}

function Skel({ w = '60%', h = 20 }) {
  return (
    <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 1.5, repeat: Infinity }}
      style={{ height: h, width: w, background: 'var(--border-bright)', borderRadius: 4, marginBottom: 8 }} />
  );
}

function TaskRow({ task }) {
  const overdue = task.due_date && new Date(task.due_date) < new Date();
  const days = task.due_date ? Math.floor((Date.now() - new Date(task.due_date)) / 86400000) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{
        width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${overdue ? 'var(--red)' : 'var(--border-bright)'}`,
        flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: overdue ? 'var(--red-dim)' : 'transparent',
      }}>
        {overdue && <span style={{ fontSize: 9, color: 'var(--red)' }}>!</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.content}</div>
        {task.due_date && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text-secondary)', marginTop: 2 }}>{overdue ? `${days} day${days !== 1 ? 's' : ''} overdue` : 'Due today'}</div>}
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
    <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', opacity: past ? 0.4 : 1, alignItems: 'center' }}>
      <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 42 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: live ? 'var(--teal)' : 'var(--text-primary)' }}>
          {s.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-secondary)' }}>{dur}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: live ? 600 : 400 }}>{event.title}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: live ? 'var(--teal)' : 'var(--text-secondary)', marginTop: 1 }}>{live ? '● Live now' : event.location || ''}</div>
      </div>
      {live && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', flexShrink: 0, boxShadow: '0 0 8px var(--teal)' }} />}
    </div>
  );
}

function EmailRow({ thread }) {
  const [open, setOpen] = useState(false);
  const msg = thread.messages?.[thread.messages.length - 1];
  const sender = (msg?.sender || '').replace(/<[^>]+>/, '').trim() || 'Unknown';
  const h = msg?.date ? Math.floor((Date.now() - new Date(msg.date)) / 3600000) : 0;
  const ago = h < 1 ? 'just now' : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  const initial = sender.charAt(0).toUpperCase();
  const colors = ['#00c9ff', '#4d7ef7', '#ff4757', '#2ed573', '#ffa502'];
  const color = colors[sender.charCodeAt(0) % colors.length];

  return (
    <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', alignItems: 'flex-start' }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: `${color}22`, border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color,
      }}>{initial}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{sender}</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>{ago}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: open ? 'clip' : 'ellipsis', whiteSpace: open ? 'normal' : 'nowrap' }}>
          {open ? msg?.snippet : msg?.subject}
        </div>
      </div>
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

  const now = new Date();
  const nextEvent = events.find(e => new Date(e.start) > now);
  const nextMins = nextEvent ? Math.floor((new Date(nextEvent.start) - now) / 60000) : null;

  return (
    <div style={{
      flex: 1, minHeight: 0,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gridTemplateRows: '100px 80px minmax(0, 1fr)',
      gap: 10, padding: '12px',
      overflow: 'hidden',
    }}>

      {/* ── ROW 1: STAT CARDS ── */}

      {/* TODAY'S FOCUS */}
      <Card delay={0} style={{
        gridColumn: '1', gridRow: '1',
        background: 'linear-gradient(135deg, rgba(0,201,255,0.12) 0%, rgba(77,126,247,0.08) 100%)',
        borderColor: 'rgba(0,201,255,0.25)',
      }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(0,201,255,0.7)', marginBottom: 6 }}>Today's Focus</div>
        {loading ? <Skel w="50%" h={40} /> : (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'white', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {events.length}
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginLeft: 6, fontWeight: 400 }}>
              / {stats.totalHours || 0}h
            </span>
          </div>
        )}
        {!loading && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>meetings today</div>}
      </Card>

      {/* OVERDUE */}
      <Card delay={0.04} style={{ gridColumn: '2', gridRow: '1' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Overdue Tasks</div>
        {loading ? <Skel w="40%" h={40} /> : (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: overdue.length ? 'var(--red)' : 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {overdue.length}
          </div>
        )}
        {!loading && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: overdue.length ? 'var(--red)' : 'var(--text-secondary)', marginTop: 4 }}>
          {overdue.length ? `${overdue.length} need attention` : 'All clear'}
        </div>}
      </Card>

      {/* UNREAD */}
      <Card delay={0.06} style={{ gridColumn: '3', gridRow: '1' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Unread Email</div>
        {loading ? <Skel w="40%" h={40} /> : (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--orange)', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {stats.unreadCount ?? threads.length}
          </div>
        )}
        {!loading && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>in inbox</div>}
      </Card>

      {/* WEATHER */}
      <div style={{ gridColumn: '4', gridRow: '1' }}>
        <WeatherCard delay={0.08} />
      </div>

      {/* ── ROW 2: SECONDARY STATS ── */}

      {/* NEXT MEETING */}
      <Card delay={0.1} style={{ gridColumn: '1', gridRow: '2', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,201,255,0.1)', border: '1px solid rgba(0,201,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>◷</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Next Meeting</div>
          {loading ? <Skel w="70%" h={18} /> : nextEvent ? (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--teal)', lineHeight: 1 }}>
                {nextMins < 60 ? `in ${nextMins}m` : `in ${Math.floor(nextMins / 60)}h ${nextMins % 60}m`}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextEvent.title}</div>
            </>
          ) : <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>None scheduled</div>}
        </div>
      </Card>

      {/* MEETINGS + HOURS */}
      <Card delay={0.11} style={{ gridColumn: '2', gridRow: '2', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
        {loading ? <Skel w="80%" h={30} /> : (
          <>
            <StatBlock label="Meetings" value={events.length} color="var(--teal)" size={24} />
            <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
            <StatBlock label="Hours" value={`${stats.totalHours || 0}h`} color="var(--text-primary)" size={24} />
            <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
            <StatBlock label="Due Today" value={dueToday.length} color="var(--blue)" size={24} />
          </>
        )}
      </Card>

      {/* ACTIVE PROJECTS */}
      <Card delay={0.12} style={{ gridColumn: '3 / 5', gridRow: '2', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)' }}>Active Projects</div>
          {['Signs & Symbols', 'Mythos', 'Blinc Studio'].map((p, i) => (
            <div key={p} style={{
              padding: '4px 10px', borderRadius: 20,
              background: i === 0 ? 'rgba(0,201,255,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${i === 0 ? 'rgba(0,201,255,0.3)' : 'var(--border)'}`,
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
              color: i === 0 ? 'var(--teal)' : 'var(--text-secondary)',
            }}>{p}</div>
          ))}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
          3 <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>/ 5</span>
        </div>
      </Card>

      {/* ── ROW 3: MAIN CONTENT ── */}

      {/* CALENDAR */}
      <Card delay={0.15} style={{ gridColumn: '1', gridRow: '3', display: 'flex', flexDirection: 'column' }}>
        <SectionLabel>Today's Schedule</SectionLabel>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? [0,1,2,3].map(i => <Skel key={i} w="100%" h={44} />) :
            events.length === 0 ? (
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>No meetings today</div>
                {upcoming.length > 0 && <>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Coming up</div>
                  {upcoming.map((e, i) => (
                    <div key={i} style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                        {new Date(e.start).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)' }}>{e.title}</div>
                    </div>
                  ))}
                </>}
              </div>
            ) : events.map((e, i) => <EventRow key={e.id || i} event={e} />)
          }
        </div>
      </Card>

      {/* TASKS */}
      <Card delay={0.17} style={{ gridColumn: '2 / 3', gridRow: '3', display: 'flex', flexDirection: 'column' }}>
        <SectionLabel>Tasks</SectionLabel>
        {loading ? (
          <div>
            <ProgressRow label="Loading..." value={0} />
            <ProgressRow label="Loading..." value={0} />
            <ProgressRow label="Loading..." value={0} />
          </div>
        ) : (
          <div>
            <ProgressRow label="Overdue" value={overdue.length} max={10} color="var(--red)" />
            <ProgressRow label="Due Today" value={dueToday.length} max={10} color="var(--teal)" />
            <ProgressRow label="Total" value={tasks.length} max={20} color="var(--blue)" />
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', marginTop: 8 }}>
          {!loading && (overdue.length > 0 || dueToday.length > 0) && (
            <>
              {overdue.length > 0 && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--red)', marginBottom: 6 }}>
                  Overdue — {overdue.length}
                </div>
              )}
              {overdue.map((t, i) => <TaskRow key={t.id || i} task={t} />)}
              {dueToday.length > 0 && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--teal)', margin: '10px 0 6px' }}>
                  Due Today — {dueToday.length}
                </div>
              )}
              {dueToday.map((t, i) => <TaskRow key={t.id || i} task={t} />)}
            </>
          )}
          {!loading && overdue.length === 0 && dueToday.length === 0 && (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>All tasks clear</div>
          )}
        </div>
      </Card>

      {/* INBOX */}
      <Card delay={0.19} style={{ gridColumn: '3 / 5', gridRow: '3', display: 'flex', flexDirection: 'column' }}>
        <SectionLabel action="View all">Inbox</SectionLabel>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? [0,1,2,3,4].map(i => <Skel key={i} w="100%" h={44} />) :
            threads.length === 0 ?
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>Inbox zero — nice work.</div>
            : threads.map((t, i) => <EmailRow key={t.id || i} thread={t} />)
          }
        </div>
        {data?.mock && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-dim)' }}>
            Demo data — connect Gmail, Calendar & Todoist to see live data
          </div>
        )}
      </Card>

    </div>
  );
}
