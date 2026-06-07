import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Orb ─────────────────────────────────────────────────────────────────────
function Orb({ state }) {
  const colors = {
    idle:      '#1a4a8a',
    speaking:  '#00c9ff',
    listening: '#a050ff',
    thinking:  '#4d7ef7',
  };
  const glow = {
    idle:      'rgba(0,100,200,0.3)',
    speaking:  'rgba(0,201,255,0.5)',
    listening: 'rgba(160,80,255,0.5)',
    thinking:  'rgba(77,126,247,0.5)',
  };
  return (
    <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Pulse rings */}
      {[0,1,2].map(i => (
        <motion.div key={i}
          animate={{ scale: [0.8, 1.6], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.65, ease: 'easeOut' }}
          style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', border: `1px solid ${colors[state]}` }}
        />
      ))}
      {/* Rotating ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: state === 'idle' ? 10 : 4, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', width: 118, height: 118, borderRadius: '50%', border: `1px solid ${colors[state]}40`, borderTopColor: colors[state], borderRightColor: 'transparent' }}
      />
      {/* Core */}
      <motion.div
        animate={{ scale: state === 'idle' ? [1, 1.05, 1] : [1, 1.1, 1] }}
        transition={{ duration: state === 'idle' ? 3 : 0.8, repeat: Infinity }}
        style={{
          width: 88, height: 88, borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, ${colors[state]}88, #080c1a 75%)`,
          boxShadow: `0 0 40px ${glow[state]}, 0 0 80px ${glow[state]}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <motion.span
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: state === 'idle' ? 'rgba(0,201,255,0.6)' : 'white' }}
        >
          {state === 'idle' ? 'ATLAS' : state === 'listening' ? '●' : state === 'thinking' ? '···' : '◈'}
        </motion.span>
      </motion.div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function BentoDashboard({ data }) {
  const events = data?.events || [];
  const tasks  = data?.tasks  || [];
  const threads = data?.threads || [];

  const overdue  = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const dueToday = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString());

  // Chat state
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Systems live. What do you need, Mario?" }]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const recRef    = useRef(null);
  const streamRef = useRef(false);

  const orbState = listening ? 'listening' : thinking ? 'thinking' : speaking ? 'speaking' : 'idle';

  // Speech recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.continuous = false; r.interimResults = true; r.lang = 'en-GB';
    r.onresult = e => {
      let fin = '', int = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript;
        else int += e.results[i][0].transcript;
      }
      setTranscript(int || fin);
      if (fin) { setInput(fin.trim()); setTranscript(''); setListening(false); }
    };
    r.onend = () => setListening(false);
    recRef.current = r;
  }, []);

  // Spacebar
  useEffect(() => {
    const fn = e => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (listening) { recRef.current?.stop(); setListening(false); }
        else { setTranscript(''); recRef.current?.start(); setListening(true); }
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [listening]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);

  const speak = useCallback(text => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = parseFloat(localStorage.getItem('atlas_rate') || '0.92');
    u.pitch = parseFloat(localStorage.getItem('atlas_pitch') || '0.85');
    const vname = localStorage.getItem('atlas_voice');
    const voices = window.speechSynthesis.getVoices();
    const v = vname ? voices.find(x => x.name === vname) : voices.find(x => x.name === 'Daniel' || x.lang === 'en-GB');
    if (v) u.voice = v;
    u.onstart = () => setSpeaking(true);
    u.onend   = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  const send = useCallback(async text => {
    const msg = (text || input).trim();
    if (!msg || streamRef.current) return;
    setInput('');
    const hist = [...messages, { role: 'user', content: msg }];
    setMessages(hist);
    setThinking(true);
    streamRef.current = true;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: hist.slice(-12).map(m => ({ role: m.role, content: m.content })),
          context: { events, tasks, threads },
        }),
      });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '', full = '', first = true;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const p = JSON.parse(line.slice(6));
            if (p.done) break;
            if (p.text) {
              if (first) { setThinking(false); setMessages(prev => [...prev, { role: 'assistant', content: p.text, streaming: true }]); first = false; }
              else setMessages(prev => { const n = [...prev]; n[n.length-1] = { ...n[n.length-1], content: n[n.length-1].content + p.text }; return n; });
              full += p.text;
            }
          } catch {}
        }
      }
      setMessages(prev => { const n = [...prev]; if (n[n.length-1]) n[n.length-1] = { ...n[n.length-1], streaming: false }; return n; });
      if (full) speak(full.slice(0, 400));
    } catch {
      setThinking(false);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not connect. Is the server running?' }]);
    } finally { streamRef.current = false; setThinking(false); }
  }, [messages, input, events, tasks, threads, speak]);

  const S = '#13161f'; // card bg
  const B = '#1e2235'; // border
  const T = '#ffffff'; // text primary
  const T2 = '#9aa0b8'; // text secondary

  const card = (extra = {}) => ({
    background: S, border: `1px solid ${B}`, borderRadius: 14,
    padding: '16px 18px', overflow: 'hidden', display: 'flex', flexDirection: 'column', ...extra
  });

  const label = { fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 600, color: T2, marginBottom: 10 };
  const big   = (color = T) => ({ fontFamily: "'Orbitron',monospace", fontSize: 46, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.02em' });
  const sub   = { fontFamily: "'Inter',sans-serif", fontSize: 12, color: T2, marginTop: 4 };
  const row   = { borderBottom: `1px solid ${B}`, padding: '8px 0', display: 'flex', gap: 10, alignItems: 'flex-start' };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'grid',
      gridTemplateColumns: '210px 1fr 210px',
      gridTemplateRows: '1fr 1fr',
      gap: 10,
      padding: '10px 12px 12px',
    }}>

      {/* ── LEFT: SCHEDULE (full height) ── */}
      <div style={{ ...card(), gridColumn: 1, gridRow: '1 / 3' }}>
        <div style={label}>Today's Schedule</div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {events.length === 0 ? (
            <div style={{ color: T2, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>No meetings today</div>
          ) : events.map((e, i) => {
            const s = new Date(e.start), end = new Date(e.end);
            const now = new Date();
            const live = s <= now && end >= now;
            const past = end < now;
            const mins = Math.round((end - s) / 60000);
            const dur = mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h${mins%60?` ${mins%60}m`:''}`;
            return (
              <div key={i} style={{ ...row, opacity: past ? 0.35 : 1 }}>
                <div style={{ minWidth: 42, flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 700, color: live ? '#00c9ff' : T }}>
                    {s.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: T2 }}>{dur}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: T, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: live ? '#00c9ff' : T2 }}>{live ? '● Live now' : e.location || ''}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CENTRE: ORB + CHAT (full height, 2 rows) ── */}
      <div style={{
        ...card({ background: '#0f1520', borderColor: 'rgba(0,201,255,0.2)', boxShadow: '0 0 40px rgba(0,201,255,0.05)' }),
        gridColumn: 2, gridRow: '1 / 3', alignItems: 'center', padding: '16px 20px',
      }}>
        {/* Header */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: '0.2em', color: 'rgba(0,201,255,0.5)' }}>ATLAS AGENT</span>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowVoice(v => !v)} style={{
              padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent', color: T2, fontFamily: "'Inter',sans-serif", fontSize: 11, cursor: 'pointer',
            }}>🎤 Voice</button>
            {showVoice && <VoicePanel onClose={() => setShowVoice(false)} />}
          </div>
        </div>

        {/* Orb */}
        <div style={{ flexShrink: 0, margin: '8px 0 6px' }}>
          <Orb state={orbState} />
        </div>

        {/* Status */}
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: '0.15em', color: orbState === 'idle' ? 'rgba(255,255,255,0.2)' : orbState === 'listening' ? '#a050ff' : orbState === 'thinking' ? '#4d7ef7' : '#00c9ff', marginBottom: 10, flexShrink: 0 }}>
          {orbState === 'idle' ? '○ READY' : orbState === 'listening' ? '● LISTENING' : orbState === 'thinking' ? '⬡ PROCESSING' : '◈ SPEAKING'}
        </div>

        {/* Transcript */}
        {listening && transcript && (
          <div style={{ width: '100%', padding: '6px 10px', marginBottom: 8, background: 'rgba(160,80,255,0.1)', border: '1px solid rgba(160,80,255,0.3)', borderRadius: 8, color: '#c080ff', fontSize: 12, fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>
            {transcript}
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, width: '100%', overflowY: 'auto', marginBottom: 10, minHeight: 0 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              <div style={{
                maxWidth: '88%', padding: '8px 12px',
                background: m.role === 'user' ? 'rgba(0,201,255,0.12)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${m.role === 'user' ? 'rgba(0,201,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '3px 12px 12px 12px',
                fontFamily: "'Inter',sans-serif", fontSize: 13, color: T, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {m.content}
                {m.streaming && <span style={{ display: 'inline-block', width: 2, height: '1em', background: '#00c9ff', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s infinite' }} />}
              </div>
            </div>
          ))}
          {thinking && (
            <div style={{ display: 'flex', marginBottom: 8 }}>
              <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px 12px 12px 12px', display: 'flex', gap: 5 }}>
                {[0,1,2].map(i => (
                  <motion.div key={i} animate={{ y: [0,-5,0], opacity:[0.4,1,0.4] }} transition={{ duration:0.7, repeat:Infinity, delay:i*0.15 }}
                    style={{ width:5, height:5, borderRadius:'50%', background:'#00c9ff' }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ width: '100%', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask ATLAS anything..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10, padding: '10px 14px', color: T,
                fontFamily: "'Inter',sans-serif", fontSize: 13, outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#00c9ff'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
            <motion.button onClick={() => { if (listening) { recRef.current?.stop(); setListening(false); } else { setTranscript(''); recRef.current?.start(); setListening(true); } }}
              animate={listening ? { scale:[1,1.08,1] } : {}} transition={{ duration:0.8, repeat:Infinity }}
              style={{ width:42, height:42, borderRadius:10, background: listening ? 'rgba(160,80,255,0.2)' : 'rgba(255,255,255,0.05)', border:`1px solid ${listening?'rgba(160,80,255,0.5)':'rgba(255,255,255,0.15)'}`, color: listening?'#c080ff':T2, fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              🎤
            </motion.button>
            <button onClick={() => send()} disabled={!input.trim() || thinking}
              style={{ width:42, height:42, borderRadius:10, background: input.trim()&&!thinking?'#00c9ff':'rgba(255,255,255,0.05)', border:'none', color: input.trim()&&!thinking?'#0d0f14':T2, fontSize:18, cursor: input.trim()&&!thinking?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
              ↑
            </button>
          </div>
          <div style={{ textAlign: 'center', fontFamily: "'Space Mono',monospace", fontSize: 9, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.12em' }}>
            PRESS SPACE TO SPEAK
          </div>
        </div>
      </div>

      {/* ── RIGHT TOP: TASKS ── */}
      <div style={{ ...card(), gridColumn: 3, gridRow: 1, alignItems: 'center', justifyContent: 'center' }}>
        <div style={label}>Tasks Due</div>
        <div style={big(overdue.length > 0 ? '#ff4757' : '#00c9ff')}>{overdue.length + dueToday.length}</div>
        <div style={sub}>{overdue.length > 0 ? `${overdue.length} overdue` : 'all up to date'}</div>
        <div style={{ width: '100%', marginTop: 14, borderTop: `1px solid ${B}`, paddingTop: 12 }}>
          {(overdue.length > 0 ? overdue : dueToday).slice(0, 4).map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: overdue.includes(t) ? '#ff4757' : '#00c9ff' }} />
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: T, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.content}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT BOTTOM: INBOX + WEATHER ── */}
      <div style={{ ...card(), gridColumn: 3, gridRow: 2 }}>
        {/* Inbox count */}
        <div style={{ borderBottom: `1px solid ${B}`, paddingBottom: 14, marginBottom: 14, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={label}>Inbox</div>
          <div style={big('#ffa502')}>{threads.length}</div>
          <div style={sub}>unread emails</div>
          <div style={{ width: '100%', marginTop: 10 }}>
            {threads.slice(0, 3).map((t, i) => {
              const msg = t.messages?.[t.messages.length - 1];
              const sender = (msg?.sender || '').replace(/<[^>]+>/,'').trim().split(' ')[0];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: '#ffa502' }} />
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: T2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sender}</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Weather */}
        <WeatherWidget />
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}

// ─── Weather ──────────────────────────────────────────────────────────────────
function WeatherWidget() {
  const [w, setW] = useState(null);
  useEffect(() => { fetch('/api/weather?city=London').then(r=>r.json()).then(setW).catch(()=>{}); }, []);
  const icon = d => {
    if (!d) return '🌤️';
    const s = d.toLowerCase();
    if (s.includes('sunny')||s.includes('clear')) return '☀️';
    if (s.includes('cloud')) return '☁️';
    if (s.includes('rain')||s.includes('shower')) return '🌧️';
    return '🌤️';
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 600, color: '#9aa0b8', marginBottom: 8 }}>Weather · London</div>
      {w ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>{icon(w.description)}</span>
            <div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{w.temp_c}°</div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9aa0b8' }}>{w.description}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9aa0b8' }}>💧{w.humidity}%</span>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9aa0b8' }}>💨{w.wind_kmph}km/h</span>
          </div>
        </>
      ) : (
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#4a5068' }}>Loading...</div>
      )}
    </div>
  );
}

// ─── Voice panel ──────────────────────────────────────────────────────────────
function VoicePanel({ onClose }) {
  const [voices, setVoices] = useState([]);
  const [sel, setSel] = useState(localStorage.getItem('atlas_voice')||'');
  const [rate, setRate] = useState(parseFloat(localStorage.getItem('atlas_rate')||'0.92'));
  const [pitch, setPitch] = useState(parseFloat(localStorage.getItem('atlas_pitch')||'0.85'));
  useEffect(() => {
    const load = () => setVoices((window.speechSynthesis?.getVoices()||[]).filter(v=>v.lang.startsWith('en')));
    load(); window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, []);
  const save = () => { localStorage.setItem('atlas_voice',sel); localStorage.setItem('atlas_rate',rate); localStorage.setItem('atlas_pitch',pitch); onClose(); };
  return (
    <div style={{ position:'absolute', bottom:'100%', right:0, marginBottom:8, width:260, background:'#1a1d28', border:'1px solid #2a2f45', borderRadius:12, padding:16, zIndex:100, boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600, color:'#fff', marginBottom:12 }}>Voice Settings</div>
      <select value={sel} onChange={e=>setSel(e.target.value)} style={{ width:'100%', background:'#0d0f14', border:'1px solid #2a2f45', borderRadius:6, color:'#fff', fontFamily:"'Inter',sans-serif", fontSize:12, padding:'6px 8px', marginBottom:8, outline:'none' }}>
        <option value="">Auto (Daniel / UK Male)</option>
        {voices.map(v=><option key={v.name} value={v.name}>{v.name}</option>)}
      </select>
      <button onClick={()=>{ const u=new SpeechSynthesisUtterance("Systems live. Good to have you back, Mario."); u.rate=rate; u.pitch=pitch; const v=window.speechSynthesis.getVoices().find(x=>x.name===sel); if(v) u.voice=v; window.speechSynthesis.speak(u); }} style={{ width:'100%', padding:'5px', borderRadius:6, background:'transparent', border:'1px solid #2a2f45', color:'#00c9ff', fontFamily:"'Inter',sans-serif", fontSize:11, cursor:'pointer', marginBottom:12 }}>▶ Preview</button>
      {[['Speed',rate,setRate],['Pitch',pitch,setPitch]].map(([l,v,s])=>(
        <div key={l} style={{marginBottom:10}}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:'#9aa0b8' }}>{l}</span>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'#00c9ff' }}>{v.toFixed(2)}</span>
          </div>
          <input type="range" min="0.5" max="1.5" step="0.05" value={v} onChange={e=>s(parseFloat(e.target.value))} style={{ width:'100%', accentColor:'#00c9ff' }} />
        </div>
      ))}
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:'7px', borderRadius:6, background:'transparent', border:'1px solid #2a2f45', color:'#9aa0b8', fontFamily:"'Inter',sans-serif", fontSize:12, cursor:'pointer' }}>Cancel</button>
        <button onClick={save} style={{ flex:1, padding:'7px', borderRadius:6, background:'#00c9ff', border:'none', color:'#0d0f14', fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, cursor:'pointer' }}>Save</button>
      </div>
    </div>
  );
}
