import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { getMockDashboardData } from './mockData.js';

dotenv.config({ path: '../.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({ origin: isProd ? '*' : 'http://localhost:3000' }));
app.use(express.json());
if (isProd) app.use(express.static(path.join(__dirname, '../client/build')));

// ─── Anthropic client (optional) ──────────────────────────────────────────
let anthropic = null;
if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_api_key_here') {
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const ATLAS_SYSTEM_PROMPT = `You are ATLAS — Mario Andreas's personal second brain and AI assistant built into his command centre dashboard. Mario is a British-Greek designer, entrepreneur, husband and father based in London. He runs Blinc Studio (creative agency), is building Signs & Symbols (fashion jewellery brand) and Mythos (modern Greek coffee shop concept). His core values: family, freedom, meaning, simplicity, legacy.

You have access to his live dashboard data including today's calendar, tasks, and emails. When answering questions about his schedule, tasks, or inbox, use the context provided. For weather and general knowledge, use your training data and be direct about what you know.

Be direct, human, conversational. Short paragraphs. No em dashes. No corporate jargon. No preamble. Ready-to-use answers.`;

// ─── Health ────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', chat: !!anthropic });
});

// ─── Weather (via wttr.in — no API key needed) ─────────────────────────────
app.get('/api/weather', async (req, res) => {
  const city = req.query.city || 'London';
  try {
    const r = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    const data = await r.json();
    const current = data.current_condition?.[0];
    const weather3day = data.weather?.slice(0, 3) || [];

    res.json({
      city,
      temp_c: current?.temp_C,
      feels_like_c: current?.FeelsLikeC,
      description: current?.weatherDesc?.[0]?.value,
      humidity: current?.humidity,
      wind_kmph: current?.windspeedKmph,
      forecast: weather3day.map(d => ({
        date: d.date,
        max_c: d.maxtempC,
        min_c: d.mintempC,
        description: d.hourly?.[4]?.weatherDesc?.[0]?.value,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Weather unavailable' });
  }
});

// ─── Google auth helper ─────────────────────────────────────────────────────
async function getGoogleAccessToken() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) return null;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, refresh_token: GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' }),
  });
  const data = await res.json();
  return data.access_token || null;
}

async function fetchCalendarEvents(token) {
  const now = new Date();
  const start = new Date(now); start.setHours(0,0,0,0);
  const end = new Date(now); end.setHours(23,59,59,999);
  const params = new URLSearchParams({ timeMin: start.toISOString(), timeMax: end.toISOString(), singleEvents: 'true', orderBy: 'startTime' });
  const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await r.json();
  const events = (data.items || []).filter(e => e.start?.dateTime).map(e => ({
    id: e.id, title: e.summary || '(no title)',
    start: e.start.dateTime, end: e.end.dateTime,
    location: e.location || null, attendees: (e.attendees || []).length,
  }));
  const totalHours = parseFloat((events.reduce((a, e) => a + (new Date(e.end) - new Date(e.start)) / 60000, 0) / 60).toFixed(1));
  const endOfWeek = new Date(now); endOfWeek.setDate(endOfWeek.getDate() + 7);
  const upParams = new URLSearchParams({ timeMin: end.toISOString(), timeMax: endOfWeek.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '5' });
  const ur = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${upParams}`, { headers: { Authorization: `Bearer ${token}` } });
  const ud = await ur.json();
  const upcoming = (ud.items || []).map(e => ({ id: e.id, title: e.summary, start: e.start?.dateTime || e.start?.date }));
  return { events, upcoming, totalHours };
}

async function fetchGmailThreads(token) {
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/threads?q=is:unread+in:inbox&maxResults=10', { headers: { Authorization: `Bearer ${token}` } });
  const data = await r.json();
  const threads = await Promise.all((data.threads || []).slice(0, 8).map(async t => {
    const d = await (await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, { headers: { Authorization: `Bearer ${token}` } })).json();
    const messages = (d.messages || []).map(m => {
      const h = {}; (m.payload?.headers || []).forEach(x => { h[x.name.toLowerCase()] = x.value; });
      return { id: m.id, date: h.date, sender: h.from, subject: h.subject, snippet: m.snippet, labelIds: m.labelIds || [] };
    });
    return { id: t.id, messages };
  }));
  return { threads, unreadCount: data.resultSizeEstimate || threads.length };
}

async function fetchTodoistTasks() {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) return { tasks: [] };
  const r = await fetch('https://api.todoist.com/api/v1/tasks?filter=today%20%7C%20overdue', { headers: { Authorization: `Bearer ${token}` } });
  const data = await r.json();
  return { tasks: (data.results || data || []).map(t => ({ id: t.id, content: t.content, due_date: t.due?.date || null, priority: t.priority })) };
}

// ─── Dashboard endpoint ─────────────────────────────────────────────────────
app.get('/api/dashboard', async (req, res) => {
  const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN);
  const hasTodoist = !!process.env.TODOIST_API_TOKEN;

  // If no real APIs configured, return mock data
  if (!hasGoogle && !hasTodoist) {
    return res.json({ ...getMockDashboardData(), mock: true });
  }

  try {
    const token = hasGoogle ? await getGoogleAccessToken() : null;
    const [cal, gmail, todoist] = await Promise.allSettled([
      token ? fetchCalendarEvents(token) : Promise.resolve({ events: [], upcoming: [], totalHours: 0 }),
      token ? fetchGmailThreads(token) : Promise.resolve({ threads: [], unreadCount: 0 }),
      hasTodoist ? fetchTodoistTasks() : Promise.resolve({ tasks: [] }),
    ]);
    const c = cal.value || { events: [], upcoming: [], totalHours: 0 };
    const g = gmail.value || { threads: [], unreadCount: 0 };
    const td = todoist.value || { tasks: [] };
    res.json({
      events: c.events, upcoming: c.upcoming,
      threads: g.threads, tasks: td.tasks,
      stats: { meetingCount: c.events.length, totalHours: c.totalHours, unreadCount: g.unreadCount, taskCount: td.tasks.length },
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    res.json({ ...getMockDashboardData(), mock: true });
  }
});

// ─── Chat endpoint (streaming) ──────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages, context } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!anthropic) {
    res.write(`data: ${JSON.stringify({ text: "ATLAS chat requires an Anthropic API key. Add ANTHROPIC_API_KEY to your environment variables to enable this feature." })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    return res.end();
  }

  // Build system prompt with live dashboard context
  const systemWithContext = `${ATLAS_SYSTEM_PROMPT}

CURRENT DASHBOARD CONTEXT:
Today: ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
Time: ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}

${context?.events?.length > 0 ? `TODAY'S MEETINGS (${context.events.length}):
${context.events.map(e => `- ${e.title} at ${new Date(e.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} (${Math.round((new Date(e.end) - new Date(e.start)) / 60000)}min)`).join('\n')}` : 'No meetings today.'}

${context?.tasks?.length > 0 ? `TASKS DUE/OVERDUE (${context.tasks.length}):
${context.tasks.map(t => `- ${t.content}${t.due_date ? ` (due ${new Date(t.due_date).toLocaleDateString('en-GB')})` : ''}`).join('\n')}` : 'No tasks due today.'}

${context?.threads?.length > 0 ? `UNREAD EMAILS (${context.threads.length}):
${context.threads.map(t => `- From: ${t.messages?.[t.messages.length-1]?.sender?.replace(/<.*>/, '').trim()} | Subject: ${t.messages?.[t.messages.length-1]?.subject}`).join('\n')}` : 'No unread emails.'}`;

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemWithContext,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

if (isProd) {
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')));
}

app.listen(PORT, () => console.log(`ATLAS server online — port ${PORT}`));
