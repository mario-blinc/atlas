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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === 'your_api_key_here') {
    res.write(`data: ${JSON.stringify({ text: "Add ANTHROPIC_API_KEY to Vercel environment variables to enable ATLAS chat." })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    return res.end();
  }

  const { messages = [], mode = 'personal', agent = null } = req.body;
  const client = new Anthropic({ apiKey: key });

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystem(mode, agent),
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
