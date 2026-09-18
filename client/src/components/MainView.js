import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TalkingOrb from './TalkingOrb';

// ─── Voice Settings Panel ────────────────────────────────────────────────────
function VoiceSettings({ onClose }) {
  const [voices, setVoices]   = useState([]);
  const [sel, setSel]         = useState(localStorage.getItem('atlas_voice') || '');
  const [rate, setRate]       = useState(parseFloat(localStorage.getItem('atlas_rate')  || '0.92'));
  const [pitch, setPitch]     = useState(parseFloat(localStorage.getItem('atlas_pitch') || '0.85'));
  const [previewing, setPreview] = useState(false);

  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis?.getVoices() || [];
      // Group: preferred English voices first
      const en = all.filter(v => v.lang.startsWith('en'));
      const rest = all.filter(v => !v.lang.startsWith('en'));
      setVoices([...en, ...rest]);
    };
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, []);

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
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)' }}
    >
      <motion.div
        initial={{ scale:0.94, y:10 }} animate={{ scale:1, y:0 }} exit={{ scale:0.94 }}
        onClick={e => e.stopPropagation()}
        style={{ width:380, background:'#12151f', border:'1px solid rgba(255,255,255,0.12)', borderRadius:18, padding:24, boxShadow:'0 24px 60px rgba(0,0,0,0.6)' }}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'white' }}>Voice Settings</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Choose how ATLAS sounds</div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', fontSize:20, cursor:'pointer' }}>✕</button>
        </div>

        {/* Voice selector */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', letterSpacing:'0.1em', marginBottom:8, fontFamily:"'Space Mono',monospace" }}>VOICE</div>
          <select value={sel} onChange={e => setSel(e.target.value)}
            style={{ width:'100%', background:'#1a1d2e', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'white', fontSize:13, padding:'10px 12px', outline:'none', cursor:'pointer' }}>
            <option value="">● Auto — Daniel / UK Male</option>
            {enVoices.length > 0 && <optgroup label="English Voices">
              {enVoices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
            </optgroup>}
            {otherVoices.length > 0 && <optgroup label="Other Languages">
              {otherVoices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
            </optgroup>}
          </select>
        </div>

        {/* Speed */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)', letterSpacing:'0.1em', fontFamily:"'Space Mono',monospace" }}>SPEED</span>
            <span style={{ fontSize:12, color:'#00c8ff', fontFamily:"'Orbitron',monospace" }}>{rate.toFixed(2)}x</span>
          </div>
          <input type="range" min="0.5" max="1.5" step="0.05" value={rate} onChange={e => setRate(parseFloat(e.target.value))}
            style={{ width:'100%', accentColor:'#00c8ff', cursor:'pointer' }} />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>Slow</span>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>Fast</span>
          </div>
        </div>

        {/* Pitch */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)', letterSpacing:'0.1em', fontFamily:"'Space Mono',monospace" }}>PITCH</span>
            <span style={{ fontSize:12, color:'#00c8ff', fontFamily:"'Orbitron',monospace" }}>{pitch.toFixed(2)}</span>
          </div>
          <input type="range" min="0.5" max="1.5" step="0.05" value={pitch} onChange={e => setPitch(parseFloat(e.target.value))}
            style={{ width:'100%', accentColor:'#00c8ff', cursor:'pointer' }} />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>Low</span>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>High</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={preview} disabled={previewing}
            style={{ flex:1, padding:'11px', borderRadius:10, background:'rgba(0,200,255,0.08)', border:'1px solid rgba(0,200,255,0.25)', color:'#00c8ff', fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(0,200,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(0,200,255,0.08)'}
          >
            {previewing ? '▶ Playing…' : '▶ Preview Voice'}
          </button>
          <button onClick={save}
            style={{ flex:1, padding:'11px', borderRadius:10, background:'#00c8ff', border:'none', color:'#0d0f16', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='#33d6ff'}
            onMouseLeave={e => e.currentTarget.style.background='#00c8ff'}
          >
            Save Voice
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Quick prompts in sidebar ─────────────────────────────────────────────────
const QUICK_PROMPTS = [
  {
    icon: '🏠',
    label: "Daddy's Home",
    text: "Daddy's home",
    response: "Welcome back, Mario. Systems are live, context is loaded. What shall we work on today?",
    canned: true,
  },
  {
    icon: '✅',
    label: "My To-Do List",
    text: "Show me everything on my to-do list, overdue items first. Be concise.",
  },
  {
    icon: '📬',
    label: "My Emails",
    text: "What does my inbox look like? Summarise the most important emails and flag anything urgent.",
  },
  {
    icon: '📅',
    label: "Today's Schedule",
    text: "Walk me through today's schedule. What do I have on and when?",
  },
];

// ─── Modes, agents, prompt chips ──────────────────────────────────────────────
const AGENTS = [
  { id: 'studio-manager',  name: 'Studio Manager',  sub: 'LIA',        icon: '🗂️' },
  { id: 'junior-designer', name: 'Junior Designer', sub: 'Higgsfield', icon: '🎨' },
  { id: 'growth',          name: 'Growth',          sub: null,         icon: '📈' },
];

const BUSINESS_PROMPT_CHIPS = [
  { label: 'Draft outreach email',   agent: 'growth',          text: 'Draft an outreach email for a potential new client.' },
  { label: 'Shot list for client',   agent: 'junior-designer', text: 'Put together a shot list for an upcoming client shoot.' },
];
const PERSONAL_PROMPT_CHIPS = [
  { label: 'Write a LinkedIn post', text: 'Write me a LinkedIn post.' },
];

// ─── Stat cards config — placeholder until real APIs are wired ───────────────
function getStatCards(mode) {
  const NOT_CONNECTED = 'Not connected yet';

  if (mode === 'business') {
    return [
      { id:'blinc-email',    icon:'📬', stat:'—', statLabel:'unread emails (Blinc)',   detail:NOT_CONNECTED,             link:'https://mail.google.com',     linkLabel:'Open Gmail',    color:'#ffa502', prompt:"What does my Blinc inbox look like?" },
      { id:'blinc-tasks',    icon:'✅', stat:'—', statLabel:'tasks (Blinc)',           detail:NOT_CONNECTED,             link:'https://todoist.com/app',     linkLabel:'Open Todoist',  color:'#ff4757', prompt:"What Blinc tasks are overdue?" },
      { id:'blinc-calendar', icon:'📅', stat:'—', statLabel:'meetings today',          detail:NOT_CONNECTED,             link:'https://calendar.google.com', linkLabel:'Open Calendar', color:'#00c8ff', prompt:"Walk me through today's Blinc schedule." },
      { id:'weather',        icon:'🌤️', stat:null, statLabel:'London',                detail:'Tap to load',             link:'https://weather.com/en-GB/weather/today/l/London+England+GB', linkLabel:'Full forecast', color:'#2ed573', weather:true, prompt:"What's the weather like in London today?" },
      { id:'blinc-invoices', icon:'💷', stat:'—', statLabel:'overdue invoices',        detail:`${NOT_CONNECTED} — Xero`, link:null,                          linkLabel:null,            color:'#ff6b81', prompt:"Are there any overdue invoices I should chase?" },
      { id:'blinc-projects', icon:'📁', stat:'—', statLabel:'live client projects',    detail:NOT_CONNECTED,             link:null,                          linkLabel:null,            color:'#a29bfe', prompt:"What client projects are currently live?" },
    ];
  }

  return [
    { id:'personal-email',    icon:'📬', stat:'—', statLabel:'unread emails (personal)', detail:NOT_CONNECTED, link:'https://mail.google.com',     linkLabel:'Open Gmail',    color:'#ffa502', prompt:"What does my personal inbox look like?" },
    { id:'personal-tasks',    icon:'✅', stat:'—', statLabel:'tasks (personal)',         detail:NOT_CONNECTED, link:'https://todoist.com/app',     linkLabel:'Open Todoist',  color:'#ff4757', prompt:"What's on my personal to-do list?" },
    { id:'personal-calendar', icon:'📅', stat:'—', statLabel:'meetings today',           detail:NOT_CONNECTED, link:'https://calendar.google.com', linkLabel:'Open Calendar', color:'#00c8ff', prompt:"What's on my personal calendar today?" },
    { id:'weather',           icon:'🌤️', stat:null, statLabel:'London',                 detail:'Tap to load', link:'https://weather.com/en-GB/weather/today/l/London+England+GB', linkLabel:'Full forecast', color:'#2ed573', weather:true, prompt:"What's the weather like in London today?" },
    { id:'personal-projects', icon:'📁', stat:'—', statLabel:'live personal projects',   detail:'Long Story Short · Project Ridgeway', link:null, linkLabel:null, color:'#a29bfe', prompt:"What's the latest on Long Story Short and Project Ridgeway?" },
  ];
}

// ─── Weather stat card inner ──────────────────────────────────────────────────
function WeatherStat() {
  const [w, setW] = useState(null);
  useEffect(() => { fetch('/api/weather?city=London').then(r=>r.json()).then(setW).catch(()=>{}); }, []);
  const icon = d => { const s=(d||'').toLowerCase(); return s.includes('sun')||s.includes('clear')?'☀️':s.includes('rain')||s.includes('shower')?'🌧️':s.includes('snow')?'❄️':s.includes('cloud')||s.includes('overcast')?'☁️':'🌤️'; };
  if (!w) return { stat:'...', detail:'Loading…', icon_char:'🌤️' };
  return { stat:`${w.temp_c}°`, detail:`${w.description} · Feels ${w.feels_like_c}°`, icon_char: icon(w.description) };
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ card, onAsk, weatherData }) {
  const isWeather = card.weather;
  const stat   = isWeather ? weatherData?.stat   : card.stat;
  const detail = isWeather ? weatherData?.detail : card.detail;

  return (
    <motion.div
      whileHover={{ scale:1.02, borderColor:'rgba(255,255,255,0.16)', background:'rgba(255,255,255,0.055)' }}
      whileTap={{ scale:0.98 }}
      style={{ background:'rgba(255,255,255,0.035)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:'18px 20px', display:'flex', flexDirection:'column', gap:2, position:'relative', overflow:'hidden', cursor:'default', transition:'background 0.2s, border-color 0.2s' }}
    >
      {/* Top row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <span style={{ width:34, height:34, borderRadius:10, background:`${card.color}18`, border:`1px solid ${card.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{isWeather && weatherData?.icon_char ? weatherData.icon_char : card.icon}</span>
        <div style={{ display:'flex', gap:6 }}>
          {/* Ask ATLAS button */}
          <button onClick={() => onAsk(card.prompt)}
            title="Ask ATLAS"
            style={{ width:26, height:26, borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.35)', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(0,200,255,0.15)'; e.currentTarget.style.color='#00c8ff'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.35)'; }}
          >◈</button>
          {/* External link button */}
          {card.link && (
            <a href={card.link} target="_blank" rel="noopener noreferrer"
              title={card.linkLabel}
              style={{ width:26, height:26, borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.35)', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='white'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.35)'; }}
            >↗</a>
          )}
        </div>
      </div>

      {/* Stat */}
      <div style={{ fontFamily:"'Orbitron',monospace", fontSize: typeof stat === 'string' && stat.includes('°') ? 32 : 36, fontWeight:700, color:card.color, lineHeight:1, letterSpacing:'-0.02em' }}>
        {stat ?? '—'}
      </div>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:500, marginTop:2 }}>{card.statLabel}</div>

      {/* Detail */}
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:6, lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {detail}
      </div>

      {/* Colour accent bar */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${card.color}60, transparent)` }} />
    </motion.div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ data, onPrompt, open, onClose }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(()=>setNow(new Date()),60000); return ()=>clearInterval(t); }, []);

  return (
    <div className={`atlas-sidebar${open ? ' open' : ''}`} style={{ width:220, flexShrink:0, height:'100%', background:'#0a0c14', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column' }}>
      {/* Logo */}
      <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#00c8ff,#4d7ef7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0, boxShadow:'0 0 14px rgba(0,200,255,0.3)' }}>◈</div>
          <div>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:13, fontWeight:700, letterSpacing:'0.18em', color:'white' }}>ATLAS</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em' }}>SECOND BRAIN</div>
          </div>
        </div>
        <button onClick={onClose} className="atlas-sidebar-close" style={{ display:'none', background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', fontSize:18, cursor:'pointer', flexShrink:0 }}>✕</button>
      </div>

      {/* Quick Prompts */}
      <div style={{ padding:'16px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.15em', marginBottom:10, fontFamily:"'Space Mono',monospace" }}>QUICK PROMPTS</div>
        {QUICK_PROMPTS.map((p, i) => (
          <motion.button key={i} onClick={() => onPrompt(p)}
            whileHover={{ scale:1.01, x:2 }}
            whileTap={{ scale:0.98 }}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', marginBottom:6, borderRadius:10, border:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.03)', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(0,200,255,0.08)'; e.currentTarget.style.borderColor='rgba(0,200,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}
          >
            <span style={{ fontSize:16, flexShrink:0 }}>{p.icon}</span>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:500 }}>{p.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Schedule preview */}
      <div style={{ padding:'14px 14px', flex:1, overflowY:'auto' }}>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.15em', marginBottom:10, fontFamily:"'Space Mono',monospace" }}>TODAY</div>
        {(data?.events||[]).length === 0 ? (
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.25)' }}>No meetings scheduled</div>
        ) : (data?.events||[]).map((e,i) => {
          const s = new Date(e.start), n = new Date(), en = new Date(e.end);
          const live = s<=n&&en>=n;
          return (
            <div key={i} style={{ marginBottom:8, padding:'8px 10px', background:live?'rgba(0,200,255,0.07)':'rgba(255,255,255,0.03)', borderRadius:8, border:`1px solid ${live?'rgba(0,200,255,0.18)':'rgba(255,255,255,0.05)'}` }}>
              <div style={{ fontSize:11, color:live?'#00c8ff':'rgba(255,255,255,0.75)', fontWeight:live?600:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.title}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{s.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} · {e.location}</div>
            </div>
          );
        })}
      </div>

      {/* Clock */}
      <div style={{ padding:'14px 16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:20, fontWeight:700, color:'white' }}>
          {now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>
          {now.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MainView({ data }) {
  const [orbState, setOrbState]   = useState('idle');
  const [response, setResponse]   = useState('');
  const [streaming, setStreaming] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [activeCard, setActiveCard] = useState(null);
  const [showVoice, setShowVoice] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('personal'); // 'personal' | 'business' — business is Blinc-only for now
  const [activeAgent, setActiveAgent] = useState('studio-manager');
  const recRef    = useRef(null);
  const streamRef = useRef(false);

  const events  = data?.events  || [];
  const tasks   = data?.tasks   || [];
  const threads = data?.threads || [];

  const hour = new Date().getHours();
  const greeting = hour<12 ? 'Good Morning' : hour<17 ? 'Good Afternoon' : 'Good Evening';

  const statCards = getStatCards(mode);
  const promptChips = mode === 'business' ? BUSINESS_PROMPT_CHIPS : PERSONAL_PROMPT_CHIPS;

  // Weather data for weather card
  const [weatherData, setWeatherData] = useState(null);
  useEffect(() => {
    fetch('/api/weather?city=London').then(r=>r.json()).then(w => {
      const icon = d => { const s=(d||'').toLowerCase(); return s.includes('sun')||s.includes('clear')?'☀️':s.includes('rain')||s.includes('shower')?'🌧️':s.includes('snow')?'❄️':s.includes('cloud')?'☁️':'🌤️'; };
      setWeatherData({ stat:`${w.temp_c}°`, detail:`${w.description} · Feels ${w.feels_like_c}°`, icon_char:icon(w.description) });
    }).catch(()=>{});
  }, []);

  // ElevenLabs voice output
  const audioRef      = useRef(null);
  const audioUnlocked = useRef(false);

  // Unlock browser audio on first interaction
  const unlockAudio = useCallback(() => {
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
  const sendToAtlas = useCallback(async (text, cardId=null, agentOverride=null) => {
    if (streamRef.current) return;
    setActiveCard(cardId);
    setResponse('');
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
      else { setOrbState('idle'); setActiveCard(null); }
    } catch {
      setResponse('Could not reach ATLAS. Check server connection.');
      setStreaming(false); setOrbState('idle');
    } finally { streamRef.current=false; }
  }, [events,tasks,threads,speak,mode,activeAgent]);

  // Handle quick prompt (sidebar)
  const handleQuickPrompt = useCallback(promptObj => {
    unlockAudio();
    setSidebarOpen(false);
    if (promptObj.canned) {
      setResponse(promptObj.response);
      speak(promptObj.response);
    } else {
      sendToAtlas(promptObj.text, null);
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
      if (fin) { setTranscript(''); setListening(false); sendToAtlas(fin.trim(), null); }
    };
    r.onend = () => setListening(false);
    recRef.current = r;
  }, [sendToAtlas]);

  const toggleListen = () => {
    if (!recRef.current) return;
    if (listening) { recRef.current.stop(); setListening(false); setOrbState('idle'); }
    else { setTranscript(''); recRef.current.start(); setListening(true); setOrbState('listening'); }
  };

  const reset = () => { window.speechSynthesis?.cancel(); setOrbState('idle'); setResponse(''); setActiveCard(null); setStreaming(false); streamRef.current=false; };

  const handleSubmit = () => {
    const text = inputText.trim();
    if (!text) return;
    unlockAudio();
    setInputText('');
    sendToAtlas(text, null);
  };

  return (
    <div style={{ width:'100vw', height:'100vh', display:'flex', overflow:'hidden', background:'#0d0f16' }}>
      <Sidebar data={data} onPrompt={handleQuickPrompt} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile backdrop, closes sidebar on tap outside */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="atlas-backdrop"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setSidebarOpen(false)}
            style={{ display:'none', position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:140 }}
          />
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', position:'relative', overflow:'hidden', minWidth:0 }}>

        {/* Ambient glow */}
        <div style={{ position:'absolute', top:'-5%', left:'40%', transform:'translateX(-50%)', width:600, height:400, background:'radial-gradient(ellipse,rgba(0,180,255,0.07) 0%,rgba(0,80,200,0.03) 40%,transparent 70%)', pointerEvents:'none', filter:'blur(30px)' }} />

        {/* Voice settings modal */}
        <AnimatePresence>
          {showVoice && <VoiceSettings onClose={() => setShowVoice(false)} />}
        </AnimatePresence>

        {/* Top bar */}
        <div style={{ flexShrink:0, height:52, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px 0 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setSidebarOpen(true)} className="atlas-hamburger" title="Open menu"
            style={{ display:'none', width:36, height:36, borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.7)', fontSize:16, cursor:'pointer', alignItems:'center', justifyContent:'center', flexShrink:0 }}>☰</button>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#00c8ff,#4d7ef7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700 }}>M</div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="atlas-main-content" style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 40px 24px' }}>

          {/* Orb + greeting */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:24 }}>
            <TalkingOrb state={listening?'listening':orbState} />
            <div style={{ marginTop:16, textAlign:'center' }}>
              <div style={{ fontSize:11, fontWeight:500, letterSpacing:'0.28em', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', marginBottom:6 }}>
                {greeting.toUpperCase()}
              </div>
              <div style={{ fontSize:26, fontWeight:700, color:'white', letterSpacing:'-0.01em', lineHeight:1.2 }}>
                What do you need today, Mario?
              </div>
            </div>
          </motion.div>

          {/* Mode toggle: Personal / Business */}
          <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:4, marginBottom:mode==='business'?14:24, gap:4 }}>
            {['personal','business'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ padding:'8px 20px', borderRadius:9, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, letterSpacing:'0.04em', textTransform:'capitalize',
                  background: mode===m ? '#00c8ff' : 'transparent', color: mode===m ? '#0d0f16' : 'rgba(255,255,255,0.5)', transition:'background 0.2s, color 0.2s' }}>
                {m === 'business' ? 'Business — Blinc' : 'Personal'}
              </button>
            ))}
          </div>

          {/* Agent selector — Business mode only */}
          {mode === 'business' && (
            <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
              style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap', justifyContent:'center' }}>
              {AGENTS.map(a => (
                <button key={a.id} onClick={() => setActiveAgent(a.id)}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:20, cursor:'pointer',
                    background: activeAgent===a.id ? 'rgba(0,200,255,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${activeAgent===a.id ? 'rgba(0,200,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: activeAgent===a.id ? '#00c8ff' : 'rgba(255,255,255,0.55)', fontSize:12, fontWeight:600, transition:'all 0.15s' }}>
                  <span style={{ fontSize:13 }}>{a.icon}</span>
                  {a.name}{a.sub ? <span style={{ opacity:0.55, fontWeight:400 }}>· {a.sub}</span> : null}
                </button>
              ))}
            </motion.div>
          )}

          {/* Response */}
          <AnimatePresence>
            {response && (
              <motion.div initial={{ opacity:0, y:8, scale:0.98 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0 }}
                style={{ width:'100%', maxWidth:620, marginBottom:20, padding:'14px 18px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, fontSize:14, color:'rgba(255,255,255,0.88)', lineHeight:1.7, position:'relative' }}>
                {mode === 'business' && (
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:'#00c8ff', marginBottom:6, textTransform:'uppercase' }}>
                    {AGENTS.find(a => a.id === activeAgent)?.name || 'ATLAS'}
                  </div>
                )}
                {response}
                {streaming && <span style={{ display:'inline-block', width:2, height:'1em', background:'#00c8ff', marginLeft:2, verticalAlign:'text-bottom', animation:'blink 1s infinite' }} />}
                <button onClick={reset} style={{ position:'absolute', top:10, right:12, background:'transparent', border:'none', color:'rgba(255,255,255,0.25)', cursor:'pointer', fontSize:15 }}>✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice transcript */}
          <AnimatePresence>
            {listening && (
              <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={{ width:'100%', maxWidth:620, marginBottom:16, padding:'10px 16px', background:'rgba(160,80,255,0.1)', border:'1px solid rgba(160,80,255,0.3)', borderRadius:12, fontSize:13, color:'#c080ff', textAlign:'center' }}>
                {transcript || <span style={{ opacity:0.5 }}>Listening…</span>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input pill */}
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
            style={{ width:'100%', maxWidth:620, marginBottom:28, display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.045)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'8px 8px 8px 18px' }}>
            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="Ask ATLAS anything…"
              style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'white', fontSize:14, padding:'8px 0' }}
            />
            <motion.button onClick={toggleListen}
              title={listening ? 'Stop listening' : 'Voice input'}
              animate={listening ? { boxShadow:['0 0 0px rgba(160,80,255,0)','0 0 16px rgba(160,80,255,0.55)','0 0 0px rgba(160,80,255,0)'] } : {}}
              transition={{ duration:0.9, repeat:Infinity }}
              style={{ width:38, height:38, borderRadius:11, flexShrink:0, background:listening?'rgba(160,80,255,0.2)':'rgba(255,255,255,0.05)', border:`1px solid ${listening?'rgba(160,80,255,0.55)':'rgba(255,255,255,0.1)'}`, color:listening?'#c080ff':'rgba(255,255,255,0.5)', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.2s, border-color 0.2s' }}>
              🎤
            </motion.button>
            <button onClick={handleSubmit} title="Send" disabled={!inputText.trim()}
              style={{ width:38, height:38, borderRadius:11, flexShrink:0, background: inputText.trim() ? '#00c8ff' : 'rgba(255,255,255,0.05)', border:'none', color: inputText.trim() ? '#0d0f16' : 'rgba(255,255,255,0.25)', fontSize:15, fontWeight:700, cursor: inputText.trim() ? 'pointer' : 'default', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.2s, color 0.2s' }}>
              ↑
            </button>
          </motion.div>
          {listening && (
            <div style={{ marginTop:-20, marginBottom:20, fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.14em', fontFamily:"'Space Mono',monospace" }}>
              LISTENING — TAP MIC TO STOP
            </div>
          )}

          {/* Routed prompt chips — mode-specific quick actions */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginBottom:24, maxWidth:620 }}>
            {promptChips.map((chip, i) => (
              <button key={i} onClick={() => { if (chip.agent) setActiveAgent(chip.agent); sendToAtlas(chip.text, null, chip.agent); }}
                style={{ padding:'8px 14px', borderRadius:20, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:500, cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(0,200,255,0.08)'; e.currentTarget.style.borderColor='rgba(0,200,255,0.25)'; e.currentTarget.style.color='#00c8ff'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.6)'; }}
              >
                {chip.label}{chip.agent ? ` → ${AGENTS.find(a=>a.id===chip.agent)?.name}` : ''}
              </button>
            ))}
          </div>

          {/* Stat cards */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
            className="atlas-stats-grid"
            style={{ width:'100%', maxWidth:720, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:24 }}>
            {statCards.map(card => (
              <StatCard key={card.id} card={card} onAsk={text => sendToAtlas(text, card.id)} weatherData={card.weather ? weatherData : null} />
            ))}
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

        @media (max-width: 860px) {
          .atlas-sidebar {
            position: fixed;
            top: 0; left: 0;
            z-index: 150;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 0 0 40px rgba(0,0,0,0.5);
          }
          .atlas-sidebar.open { transform: translateX(0); }
          .atlas-sidebar-close { display: flex !important; }
          .atlas-backdrop { display: block !important; }
          .atlas-hamburger { display: flex !important; }
          .atlas-main-content { padding: 20px 16px !important; }
          .atlas-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (max-width: 480px) {
          .atlas-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
