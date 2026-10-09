import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup, MotionConfig } from 'framer-motion';
import {
  House, CheckSquare, Tray, CalendarBlank, Sparkle, ArrowUpRight, Microphone, ArrowUp, X, List,
  SlidersHorizontal, Sun, Cloud, CloudRain, Snowflake, CloudSun, EnvelopeSimple, CurrencyGbp,
  FolderSimple, Kanban, PaintBrush, TrendUp, Play,
} from '@phosphor-icons/react';
import Marshmallow from './Marshmallow';
import './MainView.css';

// ─── Motion language: soft springs, things settle rather than stop ──────────
const spring = { type: 'spring', stiffness: 380, damping: 34, mass: 0.8 };
const glide  = { type: 'spring', stiffness: 120, damping: 20 };
// Blur resolves on a tween: a spring would overshoot below zero, which is an invalid filter
const unblur = { filter: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };
const rise = {
  hidden: { opacity: 0, y: 18, filter: 'blur(10px)' },
  show:   { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { ...glide, ...unblur } },
};
const fade = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6 } } };
const settle = {
  initial: { opacity: 0, y: 14, scale: 0.98, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)', transition: { ...glide, ...unblur } },
  exit:    { opacity: 0, y: -6, scale: 0.99, filter: 'blur(6px)', transition: { duration: 0.2 } },
};

// ─── Voice Settings ──────────────────────────────────────────────────────────
function VoiceSettings({ onClose }) {
  const [voices, setVoices]   = useState([]);
  const [sel, setSel]         = useState(localStorage.getItem('atlas_voice') || '');
  const [rate, setRate]       = useState(parseFloat(localStorage.getItem('atlas_rate')  || '0.92'));
  const [pitch, setPitch]     = useState(parseFloat(localStorage.getItem('atlas_pitch') || '0.85'));
  const [previewing, setPreview] = useState(false);

  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis?.getVoices() || [];
      const en = all.filter(v => v.lang.startsWith('en'));
      const rest = all.filter(v => !v.lang.startsWith('en'));
      setVoices([...en, ...rest]);
    };
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, []);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const preview = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setPreview(true);
    const u = new SpeechSynthesisUtterance("Systems live. Good to have you back, Mario. What shall we work on today?");
    u.rate = rate; u.pitch = pitch;
    const v = window.speechSynthesis.getVoices().find(x => x.name === sel);
    if (v) u.voice = v;
    u.onend = () => setPreview(false);
    u.onerror = () => setPreview(false);
    window.speechSynthesis.speak(u);
  };

  const save = () => {
    localStorage.setItem('atlas_voice', sel);
    localStorage.setItem('atlas_rate',  rate);
    localStorage.setItem('atlas_pitch', pitch);
    window.speechSynthesis?.cancel();
    onClose();
  };

  const enVoices = voices.filter(v => v.lang.startsWith('en'));
  const otherVoices = voices.filter(v => !v.lang.startsWith('en'));

  return (
    <motion.div className="dialog-backdrop" onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <motion.div className="dialog shell" role="dialog" aria-modal="true" aria-labelledby="voice-title"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={spring}>
        <div className="shell-core">
          <div className="dialog-head">
            <div>
              <h2 id="voice-title">Voice settings</h2>
              <p>Choose how ATLAS sounds</p>
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
          </div>

          <div className="field">
            <label htmlFor="voice-select">Voice</label>
            <select id="voice-select" value={sel} onChange={e => setSel(e.target.value)}>
              <option value="">Auto (Daniel, UK male)</option>
              {enVoices.length > 0 && <optgroup label="English">
                {enVoices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
              </optgroup>}
              {otherVoices.length > 0 && <optgroup label="Other languages">
                {otherVoices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
              </optgroup>}
            </select>
          </div>

          <div className="field">
            <div className="field-row">
              <label htmlFor="voice-rate">Speed</label>
              <span className="field-value">{rate.toFixed(2)}×</span>
            </div>
            <input id="voice-rate" type="range" min="0.5" max="1.5" step="0.05" value={rate} onChange={e => setRate(parseFloat(e.target.value))} />
            <div className="field-scale"><span>Slower</span><span>Faster</span></div>
          </div>

          <div className="field">
            <div className="field-row">
              <label htmlFor="voice-pitch">Pitch</label>
              <span className="field-value">{pitch.toFixed(2)}</span>
            </div>
            <input id="voice-pitch" type="range" min="0.5" max="1.5" step="0.05" value={pitch} onChange={e => setPitch(parseFloat(e.target.value))} />
            <div className="field-scale"><span>Lower</span><span>Higher</span></div>
          </div>

          <div className="dialog-actions">
            <button className="btn" onClick={preview} disabled={previewing}>
              <Play size={14} weight="fill" />{previewing ? 'Playing…' : 'Preview'}
            </button>
            <button className="btn primary" onClick={save}>Save voice</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Quick prompts ───────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  {
    Icon: House,
    label: "Daddy's Home",
    text: "Daddy's home",
    response: "Welcome back, Mario. Systems are live, context is loaded. What shall we work on today?",
    canned: true,
  },
  { Icon: CheckSquare,   label: 'My to-do list',    text: 'Show me everything on my to-do list, overdue items first. Be concise.' },
  { Icon: Tray,          label: 'My emails',        text: 'What does my inbox look like? Summarise the most important emails and flag anything urgent.' },
  { Icon: CalendarBlank, label: "Today's schedule", text: "Walk me through today's schedule. What do I have on and when?" },
];

// ─── Modes, agents, prompt chips ─────────────────────────────────────────────
const AGENTS = [
  { id: 'studio-manager',  name: 'Studio Manager',  sub: 'LIA',        Icon: Kanban },
  { id: 'junior-designer', name: 'Junior Designer', sub: 'Higgsfield', Icon: PaintBrush },
  { id: 'growth',          name: 'Growth',          sub: null,         Icon: TrendUp },
];

const BUSINESS_PROMPT_CHIPS = [
  { label: 'Draft outreach email', agent: 'growth',          text: 'Draft an outreach email for a potential new client.' },
  { label: 'Shot list for client', agent: 'junior-designer', text: 'Put together a shot list for an upcoming client shoot.' },
];
const PERSONAL_PROMPT_CHIPS = [
  { label: 'Write a LinkedIn post', text: 'Write me a LinkedIn post.' },
];

// ─── Connections — placeholder until real APIs are wired ─────────────────────
const NOT_CONNECTED = 'Not connected';
const GMAIL = 'https://mail.google.com';
const TODOIST = 'https://todoist.com/app';
const GCAL = 'https://calendar.google.com';
const FORECAST = 'https://weather.com/en-GB/weather/today/l/London+England+GB';

function getConnections(mode) {
  if (mode === 'business') {
    return [
      { id: 'blinc-email',    Icon: EnvelopeSimple, label: 'Blinc inbox',      detail: NOT_CONNECTED,          link: GMAIL,    linkLabel: 'Open Gmail',    prompt: 'What does my Blinc inbox look like?' },
      { id: 'blinc-tasks',    Icon: CheckSquare,    label: 'Blinc tasks',      detail: NOT_CONNECTED,          link: TODOIST,  linkLabel: 'Open Todoist',  prompt: 'What Blinc tasks are overdue?' },
      { id: 'blinc-calendar', Icon: CalendarBlank,  label: 'Meetings today',   detail: NOT_CONNECTED,          link: GCAL,     linkLabel: 'Open Calendar', prompt: "Walk me through today's Blinc schedule." },
      { id: 'weather',        weather: true,        label: 'London',                                           link: FORECAST, linkLabel: 'Full forecast', prompt: "What's the weather like in London today?" },
      { id: 'blinc-invoices', Icon: CurrencyGbp,    label: 'Overdue invoices', detail: `${NOT_CONNECTED} · Xero`, link: null,  linkLabel: null,            prompt: 'Are there any overdue invoices I should chase?' },
      { id: 'blinc-projects', Icon: FolderSimple,   label: 'Client projects',  detail: NOT_CONNECTED,          link: null,     linkLabel: null,            prompt: 'What client projects are currently live?' },
    ];
  }
  return [
    { id: 'personal-email',    Icon: EnvelopeSimple, label: 'Inbox',             detail: NOT_CONNECTED, link: GMAIL,    linkLabel: 'Open Gmail',    prompt: 'What does my personal inbox look like?' },
    { id: 'personal-tasks',    Icon: CheckSquare,    label: 'Tasks',             detail: NOT_CONNECTED, link: TODOIST,  linkLabel: 'Open Todoist',  prompt: "What's on my personal to-do list?" },
    { id: 'personal-calendar', Icon: CalendarBlank,  label: 'Meetings today',    detail: NOT_CONNECTED, link: GCAL,     linkLabel: 'Open Calendar', prompt: "What's on my personal calendar today?" },
    { id: 'weather',           weather: true,        label: 'London',                                   link: FORECAST, linkLabel: 'Full forecast', prompt: "What's the weather like in London today?" },
    { id: 'personal-projects', Icon: FolderSimple,   label: 'Personal projects', detail: 'Long Story Short · Project Ridgeway', link: null, linkLabel: null, prompt: "What's the latest on Long Story Short and Project Ridgeway?" },
  ];
}

function weatherIcon(desc) {
  const s = (desc || '').toLowerCase();
  if (s.includes('sun') || s.includes('clear')) return Sun;
  if (s.includes('rain') || s.includes('shower') || s.includes('drizzle')) return CloudRain;
  if (s.includes('snow')) return Snowflake;
  if (s.includes('cloud') || s.includes('overcast')) return Cloud;
  return CloudSun;
}

const fmtTime = d => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

// ─── Connection row ──────────────────────────────────────────────────────────
function ConnectionRow({ row, onAsk, weather }) {
  let Icon = row.Icon, detail = row.detail, value = null, on = false;
  if (row.weather) {
    Icon = weatherIcon(weather?.description);
    if (weather === undefined) detail = 'Loading…';
    else if (!weather)         detail = 'Weather unavailable';
    else { on = true; value = `${weather.temp_c}°`; detail = `${weather.description} · feels ${weather.feels_like_c}°`; }
  }
  return (
    <motion.li className="sys-row" variants={rise}>
      <span className="sys-icon" aria-hidden="true">
        <Icon size={18} weight="light" />
        <span className={`sys-dot${on ? ' on' : ''}`} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div className="sys-label">{row.label}{value && <span className="sys-value">{value}</span>}</div>
        <div className="sys-detail">{detail}</div>
      </div>
      <div className="sys-actions">
        <button className="icon-btn sm" onClick={() => onAsk(row.prompt)} title="Ask ATLAS" aria-label={`Ask ATLAS about ${row.label}`}>
          <Sparkle size={16} weight="light" />
        </button>
        {row.link && (
          <a className="icon-btn sm" href={row.link} target="_blank" rel="noopener noreferrer" title={row.linkLabel} aria-label={row.linkLabel}>
            <ArrowUpRight size={16} weight="light" />
          </a>
        )}
      </div>
    </motion.li>
  );
}

// ─── Today panel ─────────────────────────────────────────────────────────────
function TodayPanel({ data, now, mode, onAsk, weather }) {
  const events = data?.events || [];
  return (
    <motion.aside className="today shell" aria-label="Today" variants={rise}>
      <motion.div className="shell-core" variants={stagger}>
        <div className="today-grid">
          <section className="panel-section">
            <div className="panel-head">
              <h2>Today</h2>
              <span className="panel-meta">{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            {data?.mock && <p className="sample-note">Sample schedule. Calendar not connected yet.</p>}
            {events.length === 0 ? (
              <p className="empty">Nothing in the diary today.</p>
            ) : (
              <ul className="timeline">
                {events.map(e => {
                  const s = new Date(e.start), en = new Date(e.end);
                  const live = s <= now && en >= now;
                  const past = en < now;
                  return (
                    <motion.li key={e.id} variants={rise} className={`tl-item${live ? ' live' : ''}${past ? ' past' : ''}`}>
                      <span className="tl-dot" />
                      <span className="tl-time">{fmtTime(s)}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="tl-title">{e.title}{live && <span className="now-tag">Now</span>}</div>
                        {e.location && <div className="tl-where">{e.location}</div>}
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="panel-section">
            <div className="panel-head">
              <h2>Connections</h2>
              <span className="panel-meta">{mode === 'business' ? 'Blinc' : 'Personal'}</span>
            </div>
            <ul className="systems">
              {getConnections(mode).map(r => <ConnectionRow key={r.id} row={r} onAsk={onAsk} weather={r.weather ? weather : null} />)}
            </ul>
          </section>
        </div>
      </motion.div>
    </motion.aside>
  );
}

// ─── Mode switch with a gliding indicator ────────────────────────────────────
function ModeSwitch({ id, mode, setMode }) {
  return (
    <div className="segmented" role="group" aria-label="Mode">
      {[['personal', 'Personal'], ['business', 'Blinc']].map(([value, label]) => (
        <button key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>
          {mode === value && <motion.span layoutId={`seg-${id}`} className="seg-indicator" transition={spring} />}
          <span className="seg-label">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Rail ────────────────────────────────────────────────────────────────────
function Rail({ open, onClose, onPrompt, mode, setMode, activeAgent, setActiveAgent }) {
  const [hover, setHover] = useState(null);
  return (
    <motion.nav className={`rail shell${open ? ' open' : ''}`} aria-label="ATLAS" variants={fade}>
      <div className="shell-core">
        <div className="rail-head">
          <span className="brand-name">ATLAS</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close menu"><X size={18} weight="light" /></button>
        </div>

        <LayoutGroup id="rail">
          <motion.div className="rail-body" variants={stagger} onMouseLeave={() => setHover(null)}>
            <div className="rail-group segmented-wrap">
              <div className="shell pill-shell"><div className="shell-core"><ModeSwitch id="rail" mode={mode} setMode={setMode} /></div></div>
            </div>

            <div className="rail-group">
              <span className="group-title">Protocols</span>
              <div className="cmd-list">
                {QUICK_PROMPTS.map(p => (
                  <motion.button key={p.label} className="cmd" variants={rise}
                    onClick={() => onPrompt(p)} onMouseEnter={() => setHover(p.label)} onFocus={() => setHover(p.label)}>
                    {hover === p.label && <motion.span layoutId="rail-hover" className="hover-pill" transition={spring} />}
                    <p.Icon size={19} weight="light" /><span className="cmd-text">{p.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {mode === 'business' && (
                <motion.div className="rail-group" key="agents"
                  initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 6, filter: 'blur(6px)' }} transition={{ ...glide, ...unblur }}>
                  <span className="group-title">Agents</span>
                  <div className="cmd-list">
                    {AGENTS.map(a => (
                      <button key={a.id} className="cmd" aria-pressed={activeAgent === a.id}
                        onClick={() => setActiveAgent(a.id)} onMouseEnter={() => setHover(a.id)} onFocus={() => setHover(a.id)}>
                        {activeAgent === a.id && <motion.span layoutId="agent-active" className="active-pill" transition={spring} />}
                        {hover === a.id && activeAgent !== a.id && <motion.span layoutId="rail-hover" className="hover-pill" transition={spring} />}
                        <a.Icon size={19} weight="light" /><span className="cmd-text">{a.name}</span>
                        {a.sub && <span className="cmd-sub">{a.sub}</span>}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>
    </motion.nav>
  );
}

const STATUS = { idle: 'Ready when you are', listening: 'Listening', thinking: 'Thinking', speaking: 'Speaking' };

// ─── Main ────────────────────────────────────────────────────────────────────
export default function MainView({ data }) {
  const [orbState, setOrbState]   = useState('idle');
  const [response, setResponse]   = useState('');
  const [responseError, setResponseError] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('personal'); // 'personal' | 'business' — business is Blinc-only for now
  const [activeAgent, setActiveAgent] = useState('studio-manager');
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState(undefined); // undefined = loading, null = failed
  const [bootKey, setBootKey] = useState(0);
  const [replyKey, setReplyKey] = useState(0);
  const [pokeKey, setPokeKey] = useState(0);
  const recRef    = useRef(null);
  const streamRef = useRef(false);
  const inputRef  = useRef(null);

  const events  = data?.events  || [];
  const tasks   = data?.tasks   || [];
  const threads = data?.threads || [];

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  useEffect(() => {
    fetch('/api/weather?city=London')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(w => setWeather(w?.temp_c ? w : null))
      .catch(() => setWeather(null));
  }, []);

  const hour = now.getHours();
  const greeting = `${hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'}, Mario`;
  const promptChips = mode === 'business' ? BUSINESS_PROMPT_CHIPS : PERSONAL_PROMPT_CHIPS;
  const agentName = AGENTS.find(a => a.id === activeAgent)?.name;

  // Voice output (ElevenLabs), routed through an analyser so the core can read the real voice
  const audioRef      = useRef(null);
  const audioUnlocked = useRef(false);
  const audioCtxRef   = useRef(null);
  const analyserRef   = useRef(null);

  // Unlock browser audio on first interaction
  const unlockAudio = useCallback(() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC && !audioCtxRef.current) {
      try {
        const ctx = new AC();
        const an = ctx.createAnalyser();
        an.fftSize = 128;
        an.smoothingTimeConstant = 0.72;
        an.connect(ctx.destination);
        audioCtxRef.current = ctx;
        analyserRef.current = an;
      } catch { /* analyser is optional */ }
    }
    audioCtxRef.current?.resume?.().catch(() => {});
    if (audioUnlocked.current) return;
    const a = new Audio();
    a.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    a.play().catch(() => {});
    audioUnlocked.current = true;
  }, []);

  const speak = useCallback(async text => {
    unlockAudio();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setOrbState('speaking');

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error(`ElevenLabs error ${res.status}`);

      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url  = URL.createObjectURL(blob);

      const audio = new Audio();
      audioRef.current = audio;
      audio.src = url;

      // Only route through Web Audio when the context is running; otherwise the
      // element would play into a suspended graph and be silent.
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === 'running' && analyserRef.current) {
        try { ctx.createMediaElementSource(audio).connect(analyserRef.current); } catch { /* plays directly */ }
      }

      audio.onended = () => { setOrbState('idle'); URL.revokeObjectURL(url); audioRef.current = null; };
      audio.onerror = (e) => { console.error('Audio error:', e); setOrbState('idle'); URL.revokeObjectURL(url); };

      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(err => {
          console.warn('Autoplay blocked:', err);
          // Store audio to play on next user interaction
          audioRef.current = audio;
        });
      }
    } catch (err) {
      console.error('ElevenLabs failed:', err);
      setOrbState('idle');
    }
  }, [unlockAudio]);

  // Send to ATLAS API
  const sendToAtlas = useCallback(async (text, agentOverride=null) => {
    if (streamRef.current) return;
    setReplyKey(k => k + 1);
    setResponse('');
    setResponseError(false);
    setOrbState('thinking');
    setStreaming(true);
    streamRef.current = true;
    try {
      const res = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          messages:[{role:'user',content:text}],
          context:{events,tasks,threads},
          mode,
          agent: mode === 'business' ? (agentOverride || activeAgent) : null,
        }),
      });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf='', full='', first=true;
      while (true) {
        const {done,value} = await reader.read();
        if (done) break;
        buf += dec.decode(value,{stream:true});
        const lines = buf.split('\n'); buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const p = JSON.parse(line.slice(6));
            if (p.done) break;
            if (p.text) {
              if (first) { setOrbState('speaking'); first=false; }
              setResponse(prev=>prev+p.text);
              full += p.text;
            }
          } catch {}
        }
      }
      setStreaming(false);
      if (full) speak(full.slice(0,500));
      else setOrbState('idle');
    } catch {
      setResponseError(true);
      setResponse("Couldn't reach ATLAS. Check the server is running, then try again.");
      setStreaming(false); setOrbState('idle');
    } finally { streamRef.current=false; }
  }, [events,tasks,threads,speak,mode,activeAgent]);

  const handleQuickPrompt = useCallback(promptObj => {
    unlockAudio();
    setSidebarOpen(false);
    if (promptObj.canned) {
      setBootKey(k => k + 1);
      setReplyKey(k => k + 1);
      setResponseError(false);
      setResponse(promptObj.response);
      speak(promptObj.response);
    } else {
      sendToAtlas(promptObj.text);
    }
  }, [sendToAtlas, speak, unlockAudio]);

  // Voice input
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.continuous=false; r.interimResults=true; r.lang='en-GB';
    r.onresult = e => {
      let fin='', int='';
      for (let i=e.resultIndex;i<e.results.length;i++) {
        if (e.results[i].isFinal) fin+=e.results[i][0].transcript;
        else int+=e.results[i][0].transcript;
      }
      setTranscript(int||fin);
      if (fin) { setTranscript(''); setListening(false); sendToAtlas(fin.trim()); }
    };
    r.onend = () => setListening(false);
    recRef.current = r;
  }, [sendToAtlas]);

  const toggleListen = useCallback(() => {
    if (!recRef.current) return;
    unlockAudio();
    if (listening) { recRef.current.stop(); setListening(false); setOrbState('idle'); }
    else { setTranscript(''); recRef.current.start(); setListening(true); setOrbState('listening'); }
  }, [listening, unlockAudio]);

  const reset = () => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setOrbState('idle'); setResponse(''); setResponseError(false); setStreaming(false); streamRef.current=false;
  };

  const handleSubmit = e => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    unlockAudio();
    setInputText('');
    sendToAtlas(text);
  };

  // Keyboard: ⌘K or / focuses the composer, Esc closes the drawer or stops listening
  useEffect(() => {
    const onKey = e => {
      const typing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && !showVoice) {
        if (sidebarOpen) setSidebarOpen(false);
        else if (listening) toggleListen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen, listening, showVoice, toggleListen]);

  const core = listening ? 'listening' : orbState;
  const nextEvent = events.map(e => ({ ...e, s: new Date(e.start) })).find(e => e.s > now);
  const daySummary = data?.mock
    ? 'Ask anything, or run a protocol.'
    : events.length === 0
      ? 'Nothing in the diary today.'
      : `${events.length} meeting${events.length === 1 ? '' : 's'} today. ${nextEvent ? `Next: ${nextEvent.title} at ${fmtTime(nextEvent.s)}.` : 'Nothing else coming up.'}`;
  const showReply = streaming || !!response;
  const replyFrom = mode === 'business' ? agentName : 'ATLAS';

  return (
    <MotionConfig reducedMotion="user">
      <motion.div className="atlas" initial="hidden" animate="show" variants={stagger}>
        <motion.header className="islands" variants={rise}>
          <div className="brand">
            <button className="icon-btn hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><List size={20} weight="light" /></button>
            <Marshmallow size={28} mark />
            <span className="brand-name">ATLAS</span>
          </div>
          <div className="island-mode shell pill-shell">
            <div className="shell-core"><ModeSwitch id="top" mode={mode} setMode={setMode} /></div>
          </div>
          <div className="island-right shell pill-shell">
            <div className="shell-core">
              <span className="clock">{fmtTime(now)}</span>
              <span className="clock-date">{now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              <button className="icon-btn" onClick={() => setShowVoice(true)} title="Voice settings" aria-label="Voice settings">
                <SlidersHorizontal size={18} weight="light" />
              </button>
              <span className="avatar" aria-label="Mario">M</span>
            </div>
          </div>
        </motion.header>

        <motion.div className="body" key={bootKey} initial="hidden" animate="show" variants={stagger}>
          <Rail open={sidebarOpen} onClose={() => setSidebarOpen(false)} onPrompt={handleQuickPrompt}
            mode={mode} setMode={setMode} activeAgent={activeAgent} setActiveAgent={setActiveAgent} />
          {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)} />}

          <div className="workspace">
            <main className="stage">
              <motion.div className="stage-inner" variants={stagger}>
                <div className="hero">
                  <motion.div className="nest-tray" variants={{
                    hidden: { opacity: 0, scale: 0.9, y: 12, filter: 'blur(14px)' },
                    show:   { opacity: 1, scale: 1,   y: 0,  filter: 'blur(0px)', transition: { type: 'spring', stiffness: 90, damping: 15, ...unblur } },
                  }}>
                    <button type="button" className="nest" data-state={core} onClick={() => setPokeKey(k => k + 1)} aria-label="Say hi to ATLAS">
                      <Marshmallow state={core} size={250} analyserRef={analyserRef} waveKey={bootKey} pokeKey={pokeKey} error={responseError} />
                    </button>
                  </motion.div>
                  <motion.h1 className="greeting" variants={rise}>{greeting}</motion.h1>
                  <motion.div variants={rise}>
                    <div className={`status${core !== 'idle' ? ' live' : ''}`} aria-live="polite">
                      <span className="status-dot" />{STATUS[core]}
                    </div>
                  </motion.div>
                  <motion.p className="summary" variants={rise}>{daySummary}</motion.p>
                </div>

                <AnimatePresence mode="popLayout">
                  {showReply && (
                    <motion.section key={replyKey} className="console shell" aria-label={`Reply from ${replyFrom}`} {...settle}>
                      <div className="shell-core">
                        <div className="console-head">
                          <Marshmallow size={22} mark />
                          <span className="console-from">{replyFrom}</span>
                          <button className="icon-btn sm" onClick={reset} aria-label="Dismiss reply"><X size={15} weight="light" /></button>
                        </div>
                        {streaming && !response ? (
                          <div className="shimmer" aria-label="ATLAS is thinking"><span /><span /><span /></div>
                        ) : (
                          <div className={`console-body${responseError ? ' error' : ''}`}>
                            {response}
                            {streaming && <span className="caret" />}
                          </div>
                        )}
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                <motion.div layout="position" transition={glide} variants={rise}>
                  <form className={`composer shell pill-shell${listening ? ' listening' : ''}`} onSubmit={handleSubmit}>
                    <div className="shell-core">
                      <input
                        ref={inputRef}
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder={listening ? (transcript || 'Listening…') : 'Ask ATLAS anything…'}
                        aria-label="Ask ATLAS"
                      />
                      {!inputText && !listening && <span className="kbd" aria-hidden="true">⌘K</span>}
                      <button type="button" className="mic-btn" onClick={toggleListen} aria-pressed={listening}
                        title={listening ? 'Stop listening' : 'Speak to ATLAS'} aria-label={listening ? 'Stop listening' : 'Speak to ATLAS'}>
                        <Microphone size={19} weight={listening ? 'fill' : 'light'} />
                      </button>
                      <button type="submit" className="send-btn" disabled={!inputText.trim()} aria-label="Send">
                        <ArrowUp size={18} weight="bold" />
                      </button>
                    </div>
                  </form>
                  <p className={`composer-hint${listening ? ' live' : ''}`}>
                    {listening
                      ? (transcript ? `“${transcript}”` : 'Listening. Tap the mic or press Esc to stop.')
                      : mode === 'business' ? `Replies come from ${agentName}.` : null}
                  </p>

                  <div className="chips">
                    {promptChips.map(chip => (
                      <button key={chip.label} className="chip"
                        onClick={() => { if (chip.agent) setActiveAgent(chip.agent); sendToAtlas(chip.text, chip.agent); }}>
                        {chip.label}
                        {chip.agent && <span className="chip-agent">· {AGENTS.find(a => a.id === chip.agent)?.name}</span>}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </main>

            <TodayPanel data={data} now={now} mode={mode} weather={weather} onAsk={text => sendToAtlas(text)} />
          </div>
        </motion.div>

        <AnimatePresence>
          {showVoice && <VoiceSettings key="voice" onClose={() => setShowVoice(false)} />}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
}
