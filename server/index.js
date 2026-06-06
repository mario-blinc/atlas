import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '../.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({ origin: isProd ? '*' : 'http://localhost:3000' }));
app.use(express.json());

if (isProd) {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// ─── Health ────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'online' });
});

// ─── Google auth helper ────────────────────────────────────────────────────
async function getGoogleAccessToken() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) return null;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  return data.access_token || null;
}

// ─── Calendar ──────────────────────────────────────────────────────────────
async function fetchCalendarEvents(accessToken) {
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0);
  const endOfDay = new Date(now); endOfDay.setHours(23,59,59,999);

  const params = new URLSearchParams({
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  const events = (data.items || []).map(e => ({
    id: e.id,
    title: e.summary || '(no title)',
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    location: e.location || null,
    attendees: (e.attendees || []).length,
    allDay: !!e.start?.date && !e.start?.dateTime,
  })).filter(e => !e.allDay);

  // Calculate total meeting hours
  const totalMins = events.reduce((acc, e) => {
    if (e.start && e.end) acc += (new Date(e.end) - new Date(e.start)) / 60000;
    return acc;
  }, 0);
  const totalHours = (totalMins / 60).toFixed(1);

  // Upcoming (next 7 days, excluding today)
  const endOfWeek = new Date(now); endOfWeek.setDate(endOfWeek.getDate() + 7);
  const upcomingParams = new URLSearchParams({
    timeMin: endOfDay.toISOString(),
    timeMax: endOfWeek.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '5',
  });
  const upcomingRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${upcomingParams}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const upcomingData = await upcomingRes.json();
  const upcoming = (upcomingData.items || []).map(e => ({
    id: e.id,
    title: e.summary || '(no title)',
    start: e.start?.dateTime || e.start?.date,
  }));

  return { events, upcoming, totalHours: parseFloat(totalHours) };
}

// ─── Gmail ─────────────────────────────────────────────────────────────────
async function fetchGmailThreads(accessToken) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/threads?q=is:unread+in:inbox&maxResults=15', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  const threadList = data.threads || [];

  // Fetch details for each thread
  const threads = await Promise.all(
    threadList.slice(0, 10).map(async (t) => {
      const detail = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await detail.json();
      const messages = (d.messages || []).map(m => {
        const headers = {};
        (m.payload?.headers || []).forEach(h => { headers[h.name.toLowerCase()] = h.value; });
        return {
          id: m.id,
          date: headers.date,
          sender: headers.from,
          subject: headers.subject,
          snippet: m.snippet,
          labelIds: m.labelIds || [],
        };
      });
      return { id: t.id, messages };
    })
  );

  return { threads, unreadCount: data.resultSizeEstimate || threads.length };
}

// ─── Todoist ───────────────────────────────────────────────────────────────
async function fetchTodoistTasks() {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) return { tasks: [] };

  const res = await fetch('https://api.todoist.com/api/v1/tasks?filter=today%20%7C%20overdue', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const tasks = (data.results || data || []).map(t => ({
    id: t.id,
    content: t.content,
    due_date: t.due?.date || null,
    priority: t.priority,
    project_id: t.project_id,
  }));
  return { tasks };
}

// ─── Dashboard endpoint ────────────────────────────────────────────────────
app.get('/api/dashboard', async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    const [calendarData, gmailData, todoistData] = await Promise.allSettled([
      accessToken ? fetchCalendarEvents(accessToken) : Promise.resolve({ events: [], upcoming: [], totalHours: 0 }),
      accessToken ? fetchGmailThreads(accessToken) : Promise.resolve({ threads: [], unreadCount: 0 }),
      fetchTodoistTasks(),
    ]);

    const calendar = calendarData.status === 'fulfilled' ? calendarData.value : { events: [], upcoming: [], totalHours: 0 };
    const gmail = gmailData.status === 'fulfilled' ? gmailData.value : { threads: [], unreadCount: 0 };
    const todoist = todoistData.status === 'fulfilled' ? todoistData.value : { tasks: [] };

    res.json({
      events: calendar.events,
      upcoming: calendar.upcoming,
      threads: gmail.threads,
      tasks: todoist.tasks,
      stats: {
        meetingCount: calendar.events.length,
        totalHours: calendar.totalHours,
        unreadCount: gmail.unreadCount,
        taskCount: todoist.tasks.length,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ error: err.message, events: [], threads: [], tasks: [], stats: {} });
  }
});

// ─── Catch-all ─────────────────────────────────────────────────────────────
if (isProd) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`ATLAS server online — port ${PORT}`);
});
