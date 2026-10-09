const Anthropic = require('@anthropic-ai/sdk');
const AGENT_BRIEFS = require('./_agents');

const BASE_SYSTEM = `You are ATLAS — Mario Andreas's personal second brain and AI assistant, built on the Jarvis principle: intelligent, contextually aware, cinematic in feel, reduces cognitive load rather than adding to it. Mario is a British-Greek designer and entrepreneur based in London who runs Blinc Studio, a creative agency. Be direct, human, conversational. Short paragraphs. No em dashes. No preamble.`;

const PERSONAL_CONTEXT = `You are currently in PERSONAL mode — this is a data viewer with no agent attached, just you and Mario. Current live personal projects: "Long Story Short" (a legacy book project) and "Project Ridgeway" (a home renovation). Use this context where relevant, but don't force it in.`;

function buildSystem(mode, agentId) {
  if (mode === 'business') {
    const agent = AGENT_BRIEFS[agentId];
    if (agent) {
      return `${BASE_SYSTEM}

You are currently in BUSINESS mode, scoped to Blinc Studio, and for this conversation you are channeling the ${agent.name} agent. Respond in line with this brief — its role, personality, responsibilities, and boundaries all apply to how you answer:

${agent.brief}`;
    }
    return `${BASE_SYSTEM}\n\nYou are currently in BUSINESS mode, scoped to Blinc Studio. No specific agent is selected — answer as ATLAS coordinating the Blinc AI team.`;
  }
  return `${BASE_SYSTEM}\n\n${PERSONAL_CONTEXT}`;
}

// Today's calendar, tasks and inbox as sent by the dashboard, so ATLAS knows Mario's day
function buildContext(context) {
  const now = new Date();
  const time = d => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
  const events = context?.events || [];
  const tasks = context?.tasks || [];
  const threads = context?.threads || [];
  const lines = [
    `Today: ${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' })}, ${time(now)} London time.`,
    context?.mock ? 'Note: calendar, tasks and inbox are not connected yet; the items below are sample data, so say so if Mario asks about them.' : '',
    events.length ? `Meetings today (${events.length}):\n${events.map(e => `- ${e.title} at ${time(e.start)}${e.location ? ` (${e.location})` : ''}`).join('\n')}` : 'No meetings today.',
    tasks.length ? `Tasks due or overdue (${tasks.length}):\n${tasks.map(t => `- ${t.content}${t.due_date ? ` (due ${new Date(t.due_date).toLocaleDateString('en-GB')})` : ''}`).join('\n')}` : 'No tasks due.',
    threads.length ? `Unread emails (${threads.length}):\n${threads.map(t => { const m = t.messages?.[t.messages.length - 1] || {}; return `- From ${(m.sender || '').replace(/<.*>/, '').trim()}: ${m.subject || ''}`; }).join('\n')}` : 'No unread emails.',
  ];
  return `\n\nCURRENT DASHBOARD CONTEXT:\n${lines.filter(Boolean).join('\n\n')}`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // The key is stored as `anthropic` in the atlas-dashboard Vercel project; accept either name
  const key = process.env.ANTHROPIC_API_KEY || process.env.anthropic;
  if (!key || key === 'your_api_key_here') {
    res.write(`data: ${JSON.stringify({ text: "Add ANTHROPIC_API_KEY to Vercel environment variables to enable ATLAS chat." })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    return res.end();
  }

  const { messages = [], mode = 'personal', agent = null, context = null } = req.body;
  const client = new Anthropic({ apiKey: key });

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystem(mode, agent) + buildContext(context),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};
