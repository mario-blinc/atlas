import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PROMPTS = [
  { label: "Today's schedule",     text: "What does my schedule look like today?" },
  { label: "Overdue tasks",        text: "What tasks are overdue and what should I tackle first?" },
  { label: "Inbox summary",        text: "Summarise what's in my inbox and what needs a reply." },
  { label: "Daily briefing",       text: "Give me a quick briefing on my day — meetings, tasks, anything urgent." },
  { label: "What to focus on",     text: "Given everything on my plate, what should I focus on right now?" },
  { label: "Weather",              text: "What's the weather like in London today?" },
];

// ─── Animated Orb ─────────────────────────────────────────────────────────────
function Orb({ state }) {
  const cfg = {
    idle:      { core: '#1a4080', glow: 'rgba(0,120,220,0.3)',  ring: 'rgba(0,180,255,0.25)' },
    speaking:  { core: '#006090', glow: 'rgba(0,201,255,0.5)',  ring: 'rgba(0,201,255,0.5)'  },
    listening: { core: '#5010a0', glow: 'rgba(140,60,255,0.5)', ring: 'rgba(160,80,255,0.5)' },
    thinking:  { core: '#103080', glow: 'rgba(60,100,240,0.4)', ring: 'rgba(80,130,250,0.4)' },
  }[state] || {};

  return (
    <div style={{ position:'relative', width:150, height:150, display:'flex', alignItems:'center', justifyContent:'center' }}>
      {/* Ambient glow */}
      <motion.div animate={{ scale:[1,1.2,1], opacity:[0.3,0.6,0.3] }} transition={{ duration: state==='idle'?3:1, repeat:Infinity }}
        style={{ position:'absolute', width:150, height:150, borderRadius:'50%', background:`radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`, filter:'blur(16px)' }} />
      {/* Outer spinning ring */}
      <motion.div animate={{ rotate:360 }} transition={{ duration:state==='idle'?12:3, repeat:Infinity, ease:'linear' }}
        style={{ position:'absolute', width:132, height:132, borderRadius:'50%', border:`1px solid ${cfg.ring}`, borderTopColor:'transparent', borderRightColor:'transparent' }} />
      {/* Inner ring */}
      <motion.div animate={{ rotate:-360 }} transition={{ duration:state==='idle'?8:2, repeat:Infinity, ease:'linear' }}
        style={{ position:'absolute', width:108, height:108, borderRadius:'50%', border:`1px solid ${cfg.ring}`, opacity:0.5, borderBottomColor:'transparent', borderLeftColor:'transparent' }} />
      {/* Pulse rings on active states */}
      {state !== 'idle' && [0,1,2].map(i => (
        <motion.div key={i} initial={{ scale:0.7, opacity:0.6 }} animate={{ scale:1.6, opacity:0 }}
          transition={{ duration:1.5, repeat:Infinity, delay:i*0.5 }}
          style={{ position:'absolute', width:88, height:88, borderRadius:'50%', border:`1px solid ${cfg.ring}` }} />
      ))}
      {/* Core sphere */}
      <motion.div
        animate={{ scale: state==='idle' ? [1,1.04,1] : [1,1.1,1] }}
        transition={{ duration: state==='idle'?3:0.7, repeat:Infinity }}
        style={{
          width:88, height:88, borderRadius:'50%',
          background:`radial-gradient(circle at 33% 30%, ${cfg.core}cc, #060810 75%)`,
          boxShadow:`0 0 30px ${cfg.glow}, 0 0 60px ${cfg.glow}44`,
          display:'flex', alignItems:'center', justifyContent:'center', position:'relative',
        }}
      >
        <div style={{ position:'absolute', top:'18%', left:'22%', width:'28%', height:'18%', borderRadius:'50%', background:'rgba(255,255,255,0.1)', filter:'blur(3px)' }} />
        <motion.span animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:2, repeat:Infinity }}
          style={{ fontFamily:"'Orbitron',monospace", fontSize:8, fontWeight:700, letterSpacing:'0.12em', color: state==='idle'?'rgba(0,200,255,0.6)':state==='listening'?'#c080ff':'rgba(0,220,255,0.9)' }}>
          {state==='idle'?'ATLAS':state==='listening'?'●':state==='thinking'?'···':'◈'}
        </motion.span>
      </motion.div>
    </div>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────────
export default function BentoDashboard({ data }) {
  const events  = data?.events  || [];
  const tasks   = data?.tasks   || [];
  const threads = data?.threads || [];

  const overdue  = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const dueToday = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString());

  // Orb / response state
  const [orbState, setOrbState]     = useState('idle');
  const [response, setResponse]     = useState('');
  const [streaming, setStreaming]   = useState(false);
  const [listening, setListening]   = useState(false);
  const [transcript, setTranscript] = useState('');
  const [activePrompt, setActivePrompt] = useState(null);
  const recRef   = useRef(null);
  const streamRef = useRef(false);

  // Voice output
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate  = parseFloat(localStorage.getItem('atlas_rate')  || '0.92');
    u.pitch = parseFloat(localStorage.getItem('atlas_pitch') || '0.85');
    const vname = localStorage.getItem('atlas_voice');
    const vs = window.speechSynthesis.getVoices();
    const v = vname ? vs.find(x=>x.name===vname) : vs.find(x=>x.name==='Daniel'||x.lang==='en-GB');
    if (v) u.voice = v;
    u.onstart = () => setOrbState('speaking');
    u.onend   = () => setOrbState('idle');
    u.onerror = () => setOrbState('idle');
    window.speechSynthesis.speak(u);
  }, []);

  // Send prompt to ATLAS
  const sendPrompt = useCallback(async (text, index) => {
    if (streamRef.current) return;
    setActivePrompt(index);
    setResponse('');
    setOrbState('thinking');
    setStreaming(true);
    streamRef.current = true;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
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
              if (first) { setOrbState('speaking'); first = false; }
              setResponse(prev => prev + p.text);
              full += p.text;
            }
          } catch {}
        }
      }
      setStreaming(false);
      if (full) speak(full.slice(0, 500));
      else { setOrbState('idle'); setActivePrompt(null); }
    } catch {
      setResponse('Connection error. Is the server running?');
      setStreaming(false);
      setOrbState('idle');
    } finally {
      streamRef.current = false;
    }
  }, [events, tasks, threads, speak]);

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
      if (fin) {
        setTranscript('');
        setListening(false);
        // Match spoken text to closest prompt or send as-is
        const spoken = fin.trim();
        const match = PROMPTS.findIndex(p => p.text.toLowerCase().includes(spoken.toLowerCase().split(' ')[0]));
        sendPrompt(spoken, match >= 0 ? match : null);
      }
    };
    r.onend = () => { setListening(false); if (orbState === 'listening') setOrbState('idle'); };
    recRef.current = r;
  }, [sendPrompt, orbState]);

  const toggleListen = () => {
    if (!recRef.current) return;
    if (listening) { recRef.current.stop(); setListening(false); setOrbState('idle'); }
    else { setTranscript(''); recRef.current.start(); setListening(true); setOrbState('listening'); }
  };

  const reset = () => {
    window.speechSynthesis?.cancel();
    setOrbState('idle'); setResponse(''); setActivePrompt(null); setStreaming(false); streamRef.current = false;
  };

  // Shared style tokens
  const BG   = '#13161f';
  const BDR  = '#1e2235';
  const T    = '#ffffff';
  const T2   = '#9aa0b8';
  const TEAL = '#00c9ff';

  const card = (extra={}) => ({ background:BG, border:`1px solid ${BDR}`, borderRadius:14, padding:'16px 18px', overflow:'hidden', display:'flex', flexDirection:'column', ...extra });
  const lbl  = { fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, color:T2, marginBottom:10 };
  const rowS = { borderBottom:`1px solid ${BDR}`, padding:'8px 0', display:'flex', gap:10, alignItems:'flex-start' };

  return (
    <div style={{ position:'absolute', inset:0, display:'grid', gridTemplateColumns:'210px 1fr 210px', gridTemplateRows:'1fr 1fr', gap:10, padding:'10px 12px 12px' }}>

      {/* ── LEFT: SCHEDULE ── */}
      <div style={{ ...card(), gridColumn:1, gridRow:'1 / 3' }}>
        <div style={lbl}>Today's Schedule</div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {events.length === 0 ? (
            <div style={{ color:T2, fontSize:13, fontFamily:"'Inter',sans-serif" }}>No meetings scheduled</div>
          ) : events.map((e,i) => {
            const s=new Date(e.start), end=new Date(e.end), now=new Date();
            const live=s<=now&&end>=now, past=end<now;
            const mins=Math.round((end-s)/60000);
            const dur=mins<60?`${mins}m`:`${Math.floor(mins/60)}h${mins%60?` ${mins%60}m`:''}`;
            return (
              <div key={i} style={{ ...rowS, opacity:past?0.35:1 }}>
                <div style={{ minWidth:42, flexShrink:0 }}>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:700, color:live?TEAL:T }}>
                    {s.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
                  </div>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:T2 }}>{dur}</div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:T, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.title}</div>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:live?TEAL:T2 }}>{live?'● Live now':e.location||''}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CENTRE: ORB + PROMPTS ── */}
      <div style={{
        ...card({ background:'#0f1520', borderColor:'rgba(0,201,255,0.18)', boxShadow:'0 0 40px rgba(0,201,255,0.04)' }),
        gridColumn:2, gridRow:'1 / 3', alignItems:'center', padding:'20px 24px 18px', gap:0,
      }}>
        {/* Header */}
        <div style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexShrink:0 }}>
          <span style={{ fontFamily:"'Orbitron',monospace", fontSize:9, letterSpacing:'0.22em', color:'rgba(0,201,255,0.4)' }}>ATLAS AGENT</span>
          <div style={{ display:'flex', gap:8 }}>
            {response && (
              <button onClick={reset} style={{ padding:'3px 10px', borderRadius:20, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:T2, fontFamily:"'Inter',sans-serif", fontSize:11, cursor:'pointer' }}>
                ✕ Clear
              </button>
            )}
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:'rgba(255,255,255,0.15)', letterSpacing:'0.1em', alignSelf:'center' }}>
              {orbState === 'idle' ? '○ READY' : orbState === 'listening' ? '● LISTENING' : orbState === 'thinking' ? '· THINKING' : '◈ SPEAKING'}
            </span>
          </div>
        </div>

        {/* Orb */}
        <div style={{ flexShrink:0, margin:'4px 0 10px' }}>
          <Orb state={listening ? 'listening' : orbState} />
        </div>

        {/* Voice transcript */}
        <AnimatePresence>
          {listening && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
              style={{ width:'100%', padding:'6px 12px', marginBottom:10, background:'rgba(160,80,255,0.1)', border:'1px solid rgba(160,80,255,0.25)', borderRadius:8, fontFamily:"'Inter',sans-serif", fontSize:12, color:'#c080ff', flexShrink:0 }}>
              {transcript || <span style={{ opacity:0.5 }}>Listening…</span>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Response area */}
        <AnimatePresence>
          {response && (
            <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              style={{ width:'100%', padding:'12px 14px', marginBottom:14, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, fontFamily:"'Inter',sans-serif", fontSize:13, color:T, lineHeight:1.65, maxHeight:160, overflowY:'auto', flexShrink:0 }}>
              {response}
              {streaming && <span style={{ display:'inline-block', width:2, height:'1em', background:TEAL, marginLeft:2, verticalAlign:'text-bottom', animation:'blink 1s infinite' }} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick prompt buttons */}
        <div style={{ width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, flex:1, alignContent:'start' }}>
          {PROMPTS.map((p, i) => (
            <motion.button key={i} onClick={() => sendPrompt(p.text, i)}
              whileHover={{ scale:1.02, borderColor:'rgba(0,201,255,0.4)' }}
              whileTap={{ scale:0.98 }}
              style={{
                padding:'10px 12px', borderRadius:10, cursor:'pointer', textAlign:'left',
                background: activePrompt === i ? 'rgba(0,201,255,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activePrompt === i ? 'rgba(0,201,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: activePrompt === i ? TEAL : T2,
                fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, transition:'color 0.15s',
                display:'flex', alignItems:'center', gap:8,
              }}
            >
              <span style={{ fontSize:14, flexShrink:0 }}>
                {['📅','✅','📬','⚡','🎯','🌤️'][i]}
              </span>
              {p.label}
            </motion.button>
          ))}
        </div>

        {/* Mic button */}
        <motion.button
          onClick={toggleListen}
          animate={listening ? { scale:[1,1.08,1], boxShadow:['0 0 0px rgba(160,80,255,0)','0 0 20px rgba(160,80,255,0.5)','0 0 0px rgba(160,80,255,0)'] } : {}}
          transition={{ duration:0.9, repeat:Infinity }}
          style={{
            marginTop:14, width:48, height:48, borderRadius:'50%', flexShrink:0,
            background: listening ? 'rgba(160,80,255,0.2)' : 'rgba(0,201,255,0.08)',
            border: `1px solid ${listening ? 'rgba(160,80,255,0.5)' : 'rgba(0,201,255,0.2)'}`,
            color: listening ? '#c080ff' : T2, fontSize:18, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}
        >
          🎤
        </motion.button>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:'rgba(255,255,255,0.12)', letterSpacing:'0.12em', marginTop:6 }}>
          {listening ? 'TAP TO STOP' : 'TAP TO SPEAK'}
        </div>
      </div>

      {/* ── RIGHT TOP: TASKS ── */}
      <div style={{ ...card(), gridColumn:3, gridRow:1, alignItems:'center', justifyContent:'center' }}>
        <div style={lbl}>Tasks Due</div>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:46, fontWeight:700, color:overdue.length>0?'#ff4757':TEAL, lineHeight:1, letterSpacing:'-0.02em' }}>
          {overdue.length + dueToday.length}
        </div>
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:T2, marginTop:4, marginBottom:14 }}>
          {overdue.length > 0 ? `${overdue.length} overdue` : 'all up to date'}
        </div>
        <div style={{ width:'100%', borderTop:`1px solid ${BDR}`, paddingTop:12 }}>
          {[...overdue, ...dueToday].slice(0, 5).map((t, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background:overdue.includes(t)?'#ff4757':TEAL }} />
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:T, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.content}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT BOTTOM: INBOX + WEATHER ── */}
      <div style={{ ...card(), gridColumn:3, gridRow:2 }}>
        {/* Inbox */}
        <div style={{ borderBottom:`1px solid ${BDR}`, paddingBottom:14, marginBottom:14 }}>
          <div style={lbl}>Inbox</div>
          <div style={{ fontFamily:"'Orbitron',monospace", fontSize:36, fontWeight:700, color:'#ffa502', lineHeight:1 }}>
            {threads.length}
          </div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:T2, marginTop:4, marginBottom:10 }}>unread emails</div>
          {threads.slice(0, 3).map((t, i) => {
            const msg = t.messages?.[t.messages.length-1];
            const sender = (msg?.sender||'').replace(/<[^>]+>/,'').trim().split(' ')[0];
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div style={{ width:5, height:5, borderRadius:'50%', flexShrink:0, background:'#ffa502' }} />
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:T2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sender}: {msg?.subject}</div>
              </div>
            );
          })}
        </div>
        {/* Weather */}
        <WeatherWidget />
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}

// ─── Weather ──────────────────────────────────────────────────────────────────
function WeatherWidget() {
  const [w, setW] = useState(null);
  useEffect(() => { fetch('/api/weather?city=London').then(r=>r.json()).then(setW).catch(()=>{}); }, []);
  const icon = d => { const s=(d||'').toLowerCase(); return s.includes('sun')||s.includes('clear')?'☀️':s.includes('rain')||s.includes('shower')?'🌧️':s.includes('cloud')?'☁️':'🌤️'; };
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1, justifyContent:'center' }}>
      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, color:'#9aa0b8', marginBottom:8 }}>London</div>
      {w && !w.error ? (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:26 }}>{icon(w.description)}</span>
            <div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:26, fontWeight:700, color:'#fff', lineHeight:1 }}>{w.temp_c}°</div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:'#9aa0b8' }}>{w.description}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:12, marginTop:8 }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:'#9aa0b8' }}>💧{w.humidity}%</span>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:'#9aa0b8' }}>💨{w.wind_kmph}km/h</span>
          </div>
        </>
      ) : (
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:'#4a5068' }}>Loading weather…</div>
      )}
    </div>
  );
}
