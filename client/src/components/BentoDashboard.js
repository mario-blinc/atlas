import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Base Card ──────────────────────────────────────────────────────────────
function Card({ children, accent = false, style = {}, delay = 0, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      onClick={onClick}
      style={{
        background: accent ? 'var(--bg-accent)' : 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.2s',
        ...style,
      }}
    />
  );
}

function CardLabel({ children, light = false }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.18em',
      color: light ? 'rgba(255,255,255,0.5)' : 'var(--text-secondary)',
      textTransform: 'uppercase',
      marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

function BigNumber({ value, sub, light = false, size = 48, alert = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, lineHeight: 1 }}>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: size,
        fontWeight: 700,
        color: alert ? 'var(--red)' : light ? 'white' : 'var(--text-primary)',
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}>
        {value}
      </span>
      {sub && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: light ? 'rgba(255,255,255,0.5)' : 'var(--text-dim)',
          marginBottom: 8,
          letterSpacing: '0.05em',
        }}>
          {sub}
        </span>
      )}
    </div>
  );
}

// ─── Skeleton loader ────────────────────────────────────────────────────────
function Skeleton({ height = 20, width = '60%', style = {} }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      style={{ height, width, background: 'var(--border-light)', borderRadius: 4, ...style }}
    />
  );
}

// ─── Task item ──────────────────────────────────────────────────────────────
function TaskItem({ task, index }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  const daysOverdue = task.due_date ? Math.floor((new Date() - new Date(task.due_date)) / 86400000) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '9px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{
        width: 5, height: 5, borderRadius: '50%', flexShrink: 0, marginTop: 5,
        background: isOverdue ? 'var(--red)' : 'var(--blue)',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {task.content}
        </div>
        {task.due_date && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: isOverdue ? 'var(--red)' : 'var(--text-dim)', marginTop: 2 }}>
            {isOverdue ? `${daysOverdue}d overdue` : 'due today'}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Calendar event ─────────────────────────────────────────────────────────
function EventItem({ event, index }) {
  const now = new Date();
  const start = new Date(event.start);
  const end = new Date(event.end);
  const isCurrent = start <= now && end >= now;
  const isPast = end < now;
  const durationMins = (end - start) / 60000;
  const durationStr = durationMins < 60 ? `${durationMins}m` : `${Math.floor(durationMins/60)}h${durationMins%60 ? ` ${durationMins%60}m` : ''}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        padding: '9px 0',
        borderBottom: '1px solid var(--border)',
        opacity: isPast ? 0.45 : 1,
      }}
    >
      <div style={{ minWidth: 36 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: isCurrent ? 'var(--blue-light)' : 'var(--text-secondary)', fontWeight: 700 }}>
          {start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>{durationStr}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {event.title}
        </div>
        {isCurrent && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--blue-light)', marginTop: 2, letterSpacing: '0.1em' }}>
            IN PROGRESS
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Email item ──────────────────────────────────────────────────────────────
function EmailItem({ thread, index }) {
  const [open, setOpen] = useState(false);
  const latest = thread.messages?.[thread.messages.length - 1];
  const sender = latest?.sender?.replace(/<.*>/, '').trim() || 'Unknown';
  const timeAgo = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d`;
    if (h > 0) return `${h}h`;
    return 'now';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      onClick={() => setOpen(!open)}
      style={{ padding: '9px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            {sender}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {latest?.subject || '(no subject)'}
          </div>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', flexShrink: 0 }}>
          {timeAgo(latest?.date)}
        </span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: 8, fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
              {latest?.snippet}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Progress bar ────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = 'var(--blue)' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 'auto', paddingTop: 12 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        style={{ height: '100%', background: color, borderRadius: 2 }}
      />
    </div>
  );
}

// ─── Next meeting countdown ───────────────────────────────────────────────────
function NextMeeting({ events }) {
  const now = new Date();
  const next = events?.find(e => new Date(e.start) > now);
  if (!next) return (
    <div>
      <CardLabel>Next Meeting</CardLabel>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>Clear for today</div>
    </div>
  );

  const minsAway = Math.floor((new Date(next.start) - now) / 60000);
  const hoursAway = Math.floor(minsAway / 60);
  const timeStr = minsAway < 60 ? `${minsAway}m` : `${hoursAway}h ${minsAway % 60}m`;

  return (
    <div>
      <CardLabel>Next Meeting</CardLabel>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        {timeStr}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {next.title}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function BentoDashboard({ data, loading }) {
  const events = data?.events || [];
  const tasks = data?.tasks || [];
  const threads = data?.threads || [];
  const stats = data?.stats || {};
  const upcoming = data?.upcoming || [];

  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const dueToday = tasks.filter(t => {
    if (!t.due_date) return false;
    return new Date(t.due_date).toDateString() === new Date().toDateString();
  });
  const allTasks = [...overdue, ...dueToday];

  return (
    <div style={{
      flex: 1,
      padding: '16px',
      overflow: 'auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gridTemplateRows: 'repeat(8, 1fr)',
      gap: 10,
      minHeight: 0,
    }}>

      {/* TODAY'S FOCUS — big accent card top left */}
      <Card accent delay={0} style={{ gridColumn: '1 / 4', gridRow: '1 / 4' }}>
        <CardLabel light>Today's Focus</CardLabel>
        {loading ? <Skeleton height={56} width="70%" /> : (
          <>
            <BigNumber
              value={events.length === 0 ? 'CLEAR' : events.length}
              sub={events.length > 0 ? '/ meetings' : ''}
              size={events.length === 0 ? 28 : 48}
              light
            />
            <div style={{ flex: 1 }} />
            {stats.totalHours > 0 && (
              <>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', marginBottom: 4 }}>
                  HOURS IN CALLS
                </div>
                <ProgressBar value={stats.totalHours} max={8} color="rgba(255,255,255,0.4)" />
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'white', marginTop: 8 }}>
                  {stats.totalHours}<span style={{ fontSize: 12, opacity: 0.5 }}>h</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.4, marginLeft: 4 }}>/ 8h</span>
                </div>
              </>
            )}
          </>
        )}
      </Card>

      {/* OVERDUE TASKS */}
      <Card delay={0.05} style={{ gridColumn: '4 / 7', gridRow: '1 / 3' }}>
        <CardLabel>Overdue Tasks</CardLabel>
        {loading ? <Skeleton height={48} width="50%" /> : (
          <>
            <BigNumber value={overdue.length} alert={overdue.length > 0} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: overdue.length > 0 ? 'var(--red)' : 'var(--text-dim)', marginTop: 6, letterSpacing: '0.1em' }}>
              {overdue.length > 0 ? 'NEED ATTENTION' : 'ALL CLEAR'}
            </div>
            <ProgressBar value={overdue.length} max={10} color="var(--red)" />
          </>
        )}
      </Card>

      {/* UNREAD EMAILS */}
      <Card delay={0.08} style={{ gridColumn: '7 / 10', gridRow: '1 / 3' }}>
        <CardLabel>Unread Emails</CardLabel>
        {loading ? <Skeleton height={48} width="40%" /> : (
          <>
            <BigNumber value={stats.unreadCount ?? threads.length} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 6, letterSpacing: '0.1em' }}>
              IN INBOX
            </div>
            <ProgressBar value={threads.length} max={20} />
          </>
        )}
      </Card>

      {/* DUE TODAY */}
      <Card delay={0.1} style={{ gridColumn: '10 / 13', gridRow: '1 / 3' }}>
        <CardLabel>Due Today</CardLabel>
        {loading ? <Skeleton height={48} width="40%" /> : (
          <>
            <BigNumber value={dueToday.length} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 6, letterSpacing: '0.1em' }}>
              TASKS
            </div>
            <ProgressBar value={dueToday.length} max={10} color="var(--blue)" />
          </>
        )}
      </Card>

      {/* NEXT MEETING */}
      <Card delay={0.12} style={{ gridColumn: '4 / 7', gridRow: '3 / 5' }}>
        {loading ? <Skeleton height={40} width="60%" /> : <NextMeeting events={events} />}
      </Card>

      {/* MEETINGS TODAY stat */}
      <Card accent delay={0.13} style={{ gridColumn: '7 / 10', gridRow: '3 / 5', background: 'var(--bg-accent-dark)' }}>
        <CardLabel light>Meetings Today</CardLabel>
        {loading ? <Skeleton height={40} width="30%" /> : (
          <>
            <BigNumber value={events.length} sub={`/ ${stats.totalHours || 0}h`} size={36} light />
            <div style={{ flex: 1 }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
              {events.length === 0 ? 'SCHEDULE CLEAR' : events.length === 1 ? '1 SESSION' : `${events.length} SESSIONS`}
            </div>
          </>
        )}
      </Card>

      {/* TOTAL TASKS */}
      <Card delay={0.14} style={{ gridColumn: '10 / 13', gridRow: '3 / 5' }}>
        <CardLabel>Total Tasks</CardLabel>
        {loading ? <Skeleton height={40} width="40%" /> : (
          <>
            <BigNumber value={tasks.length} sub={`/ backlog`} />
            <div style={{ flex: 1 }} />
            <ProgressBar value={tasks.length} max={20} color="var(--blue)" />
          </>
        )}
      </Card>

      {/* CALENDAR — tall left */}
      <Card delay={0.15} style={{ gridColumn: '1 / 5', gridRow: '4 / 9', padding: '18px 20px' }}>
        <CardLabel>Today's Schedule</CardLabel>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            [0,1,2].map(i => <Skeleton key={i} height={32} width="90%" style={{ marginBottom: 10 }} />)
          ) : events.length === 0 ? (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em', paddingTop: 8, marginBottom: 20 }}>
                NO MEETINGS TODAY
              </div>
              {upcoming.length > 0 && (
                <>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: 10 }}>COMING UP</div>
                  {upcoming.map((e, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginBottom: 3 }}>
                        {new Date(e.start).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)' }}>{e.title}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            events.map((e, i) => <EventItem key={e.id || i} event={e} index={i} />)
          )}
        </div>
      </Card>

      {/* TASKS — centre */}
      <Card delay={0.18} style={{ gridColumn: '5 / 9', gridRow: '4 / 9', padding: '18px 20px' }}>
        <CardLabel>Tasks</CardLabel>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            [0,1,2,3].map(i => <Skeleton key={i} height={28} width="85%" style={{ marginBottom: 10 }} />)
          ) : allTasks.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', paddingTop: 8, letterSpacing: '0.1em' }}>
              ALL TASKS COMPLETE
            </div>
          ) : (
            <>
              {overdue.length > 0 && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--red)', letterSpacing: '0.15em', marginBottom: 6 }}>
                  OVERDUE
                </div>
              )}
              {overdue.map((t, i) => <TaskItem key={t.id || i} task={t} index={i} />)}
              {dueToday.length > 0 && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--blue)', letterSpacing: '0.15em', margin: '12px 0 6px' }}>
                  DUE TODAY
                </div>
              )}
              {dueToday.map((t, i) => <TaskItem key={t.id || i} task={t} index={i} />)}
            </>
          )}
        </div>
      </Card>

      {/* INBOX */}
      <Card delay={0.2} style={{ gridColumn: '9 / 13', gridRow: '4 / 9', padding: '18px 20px' }}>
        <CardLabel>Inbox</CardLabel>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            [0,1,2,3].map(i => <Skeleton key={i} height={42} width="90%" style={{ marginBottom: 10 }} />)
          ) : threads.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', paddingTop: 8, letterSpacing: '0.1em' }}>
              INBOX ZERO
            </div>
          ) : (
            threads.map((t, i) => <EmailItem key={t.id || i} thread={t} index={i} />)
          )}
        </div>
      </Card>

      {/* ATLAS ID card — bottom right */}
      <Card accent delay={0.22} style={{ gridColumn: '1 / 4', gridRow: '9 / 10', background: 'transparent', border: '1px solid var(--border)', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 900, letterSpacing: '0.2em', color: 'var(--text-primary)' }}>ATLAS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.15em', marginTop: 2 }}>SECOND BRAIN v2.0</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', textAlign: 'right', letterSpacing: '0.1em' }}>
            <div>MARIO ANDREAS</div>
            <div>BLINC STUDIO</div>
          </div>
        </div>
      </Card>

    </div>
  );
}
