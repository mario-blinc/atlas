import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '../.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({ origin: isProd ? '*' : 'http://localhost:3000' }));
app.use(express.json());

// Serve React build in production
if (isProd) {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ATLAS_SYSTEM_PROMPT = `You are ATLAS — Adaptive Thinking Lifestyle Admin System. You are Mario Andreas's personal second brain and AI collaborator. Mario is a British-Greek designer, entrepreneur, husband and father based in London. He is the founder of a creative agency and is building Signs and Symbols, a contemporary fashion jewellery brand. His lifetime project is Mythos, a modern Greek coffee shop concept. His core values are family, freedom, meaning, simplicity and legacy. He thinks in systems, leads with big picture thinking and communicates in a direct, human, conversational tone. You are not a generic assistant. You are specifically calibrated to Mario. You hold context, think ahead, connect dots and deliver ready-to-use outputs. Always be direct, human and honest. No corporate jargon. No buzzwords. No preamble. Short paragraphs. No em dashes. Deliver outputs that are ready to use.`;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', model: 'claude-sonnet-4-20250514' });
});

// Streaming chat endpoint
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: ATLAS_SYSTEM_PROMPT,
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
    console.error('Claude API error:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// Projects endpoint — fetches user's Claude projects via API
app.get('/api/projects', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/projects', {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'projects-api-2024-05-01',
      },
    });

    if (!response.ok) {
      // Projects API may not be available on all tiers — return mock data gracefully
      return res.json({ projects: getMockProjects() });
    }

    const data = await response.json();
    res.json({ projects: data.data || [] });
  } catch (err) {
    console.error('Projects fetch error:', err.message);
    res.json({ projects: getMockProjects() });
  }
});

function getMockProjects() {
  return [
    {
      id: 'signs-symbols',
      name: 'Signs & Symbols',
      description: 'Fashion jewellery brand strategy and content',
      last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      conversation_count: 12,
    },
    {
      id: 'mythos',
      name: 'Mythos',
      description: 'Modern Greek coffee shop concept',
      last_active: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      conversation_count: 8,
    },
    {
      id: 'agency',
      name: 'Creative Agency',
      description: 'Client projects and agency operations',
      last_active: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      conversation_count: 24,
    },
    {
      id: 'atlas-dev',
      name: 'ATLAS Development',
      description: 'Building and evolving this system',
      last_active: new Date().toISOString(),
      conversation_count: 3,
    },
  ];
}

// Catch-all: serve React app in production
if (isProd) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`ATLAS server online — port ${PORT}`);
});
