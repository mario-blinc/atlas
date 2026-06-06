# ATLAS — Adaptive Thinking Lifestyle Admin System

Mario's personal AI command centre. Dark, cinematic, voice-enabled.

## Setup

### 1. API Key

Copy the env template and add your Anthropic API key:

```bash
cp .env.example .env
```

Open `.env` and set:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Install dependencies

```bash
npm run install:all
```

This installs root, server, and client packages in one command.

### 3. Run

```bash
npm start
```

This starts both the Express server (port 3001) and React client (port 3000) concurrently.

Open **http://localhost:3000** in Chrome for best voice support.

---

## Usage

### Daddy's Home Protocol

Type or say **"Daddy's home"** to trigger the full session boot sequence. ATLAS animates to life and speaks the welcome message.

### Voice Input

Switch the input mode to **VOICE** and hold the button while speaking. Release to send. Make sure you're using Chrome or Edge for Web Speech API support.

### Voice Output

ATLAS speaks all responses by default. Toggle with the **VOICE ON / VOICE OFF** button in the top bar.

### Projects

The right panel lists your active Claude projects. Use **CONTINUE** to load context for an existing project, or **NEW CHAT** to start fresh within a project scope.

---

## Tech Stack

- React 18 + Framer Motion
- Node.js / Express (API proxy)
- Anthropic Claude API (claude-sonnet-4-20250514)
- Web Speech API (voice I/O)
- Canvas-based animated background

## Project Structure

```
/atlas-dashboard
  /client       React frontend
  /server       Express backend
  .env          API key (never commit)
  README.md     This file
```
