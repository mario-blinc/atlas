const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM = `You are ATLAS — Mario Andreas's personal second brain and AI assistant. Mario is a British-Greek designer, entrepreneur, husband and father based in London. He runs Blinc Studio (creative agency), is building Signs & Symbols (fashion jewellery brand) and Mythos (modern Greek coffee shop concept). Be direct, human, conversational. Short paragraphs. No em dashes. No preamble.`;

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

  const { messages = [], context = {} } = req.body;
  const client = new Anthropic({ apiKey: key });

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM,
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
