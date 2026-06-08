import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PROMPTS = [
  { icon:'📅', label:"Today's Schedule",   sub:'Meetings and commitments',      text:"What does my schedule look like today?" },
  { icon:'✅', label:'Overdue Tasks',       sub:'What needs attention now',      text:"What tasks are overdue and what should I tackle first?" },
  { icon:'📬', label:'Inbox Summary',       sub:'Emails needing a response',     text:"Summarise what's in my inbox. What needs my attention?" },
  { icon:'⚡', label:'Daily Briefing',      sub:'Full overview of your day',     text:"Give me a full briefing on my day — meetings, tasks, anything urgent." },
  { icon:'🎯', label:'What to Focus On',    sub:'Priority recommendation',       text:"Given everything on my plate, what should I focus on right now?" },
  { icon:'🌤️', label:'Weather',             sub:'London forecast today',         text:"What's the weather like in London today?" },
];

// ─── 3D Glass Orb ─────────────────────────────────────────────────────────────
function GlassOrb({ state }) {
  const colors = {
    idle:      { a:'#00c8ff', b:'#0066cc', c:'#00ff88' },
    speaking:  { a:'#00e5ff', b:'#0099ff', c:'#00ffcc' },
    listening: { a:'#cc66ff', b:'#6600cc', c:'#ff66cc' },
    thinking:  { a:'#4488ff', b:'#2244cc', c:'#00ccff' },
  }[state] || { a:'#00c8ff', b:'#0066cc', c:'#00ff88' };

  return (
    <div style={{ position:'relative', width:90, height:90 }}>
      {/* Glow behind orb */}
      <motion.div
        animate={{ scale:[1,1.3,1], opacity:[0.4,0.7,0.4] }}
        transition={{ duration: state==='idle'?4:1.5, repeat:Infinity }}
        style={{ position:'absolute', inset:-20, borderRadius:'50%', background:`radial-gradient(circle, ${colors.a}40 0%, transparent 70%)`, filter:'blur(12px)' }}
      />
      {/* Spinning outer ring */}
      <motion.div animate={{ rotate:360 }} transition={{ duration:state==='idle'?15:4, repeat:Infinity, ease:'linear' }}
        style={{ position:'absolute', inset:-8, borderRadius:'50%', border:`1px solid ${colors.a}30`, borderTopColor:colors.a, borderRightColor:'transparent' }} />
      {/* The orb itself */}
      <motion.div
        animate={{ scale: state==='idle'?[1,1.04,1]:[1,1.08,1] }}
        transition={{ duration: state==='idle'?3:0.8, repeat:Infinity }}
        style={{
          width:90, height:90, borderRadius:'50%', position:'relative', overflow:'hidden',
          background:`radial-gradient(circle at 35% 30%, ${colors.a}cc 0%, ${colors.b}88 40%, #060a18 80%)`,
          boxShadow:`0 0 40px ${colors.a}60, 0 0 80px ${colors.b}30, inset 0 0 30px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Glass reflection */}
        <div style={{ position:'absolute', top:'12%', left:'18%', width:'35%', height:'22%', borderRadius:'50%', background:'rgba(255,255,255,0.25)', filter:'blur(6px)', transform:'rotate(-20deg)' }} />
        <div style={{ position:'absolute', top:'55%', right:'15%', width:'20%', height:'12%', borderRadius:'50%', background:'rgba(255,255,255,0.1)', filter:'blur(3px)' }} />
        {/* Colour bands */}
        <div style={{ position:'absolute', bottom:'15%', left:'10%', width:'80%', height:'3px', background:`linear-gradient(90deg, transparent, ${colors.c}60, transparent)`, borderRadius:2, filter:'blur(2px)' }} />
      </motion.div>
      {/* Pulse rings when active */}
      {state !== 'idle' && [0,1].map(i => (
        <motion.div key={i} initial={{ scale:0.9, opacity:0.6 }} animate={{ scale:1.8, opacity:0 }}
          transition={{ duration:1.8, repeat:Infinity, delay:i*0.9 }}
          style={{ position:'absolute', inset:0, borderRadius:'50%', border:`1px solid ${colors.a}60` }} />
      ))}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ data }) {
  const [active, setActive] = useState(0);
  const events  = data?.events  || [];
  const tasks   = data?.tasks   || [];
  const threads = data?.threads || [];
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date());

  const navItems = [
    { icon:'⊞', label:'Overview'  },
    { icon:'◷', label:'Calendar'  },
    { icon:'◻', label:'Tasks'     },
    { icon:'✉', label:'Inbox'     },
    { icon:'◎', label:'Projects'  },
  ];

  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  return (
    <div style={{ width:220, flexShrink:0, height:'100%', background:'#0a0c14', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', padding:'0' }}>
      {/* Logo */}
      <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#00c8ff,#4d7ef7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0, boxShadow:'0 0 16px rgba(0,200,255,0.35)' }}>◈</div>
          <div>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:13, fontWeight:700, letterSpacing:'0.18em', color:'white' }}>ATLAS</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em', marginTop:1 }}>SECOND BRAIN</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding:'12px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {navItems.map((item,i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 10px',
            borderRadius:8, border:'none', cursor:'pointer', textAlign:'left', marginBottom:2,
            background: active===i ? 'rgba(0,200,255,0.1)' : 'transparent',
            color: active===i ? '#00c8ff' : 'rgba(255,255,255,0.5)',
            fontSize:13, fontFamily:"'Inter',sans-serif",
            borderLeft: active===i ? '2px solid #00c8ff' : '2px solid transparent',
            transition:'all 0.15s',
          }}>
            <span style={{ fontSize:14, width:18, textAlign:'center' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ padding:'14px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.15em', marginBottom:10, fontFamily:"'Space Mono',monospace" }}>TODAY</div>
        {[
          { label:'Meetings',    value:events.length,  color:'#00c8ff', sub: events.length > 0 ? events[0]?.title?.split('—')[0]?.trim() : 'Clear day' },
          { label:'Overdue',     value:overdue.length, color:'#ff4757', sub: overdue.length > 0 ? `${overdue.length} need attention` : 'All clear' },
          { label:'Unread',      value:threads.length, color:'#ffa502', sub:'emails' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:8, border:'1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginBottom:2 }}>{label}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:110 }}>{sub}</div>
            </div>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:20, fontWeight:700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <div style={{ padding:'14px 14px', flex:1, overflowY:'auto' }}>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.15em', marginBottom:10, fontFamily:"'Space Mono',monospace" }}>SCHEDULE</div>
        {events.length === 0 ? (
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>No meetings today</div>
        ) : events.map((e,i) => {
          const s = new Date(e.start);
          const n = new Date();
          const en = new Date(e.end);
          const live = s<=n && en>=n;
          return (
            <div key={i} style={{ marginBottom:8, padding:'8px 10px', background:live?'rgba(0,200,255,0.08)':'rgba(255,255,255,0.03)', borderRadius:8, border:`1px solid ${live?'rgba(0,200,255,0.2)':'rgba(255,255,255,0.05)'}` }}>
              <div style={{ fontSize:11, color:live?'#00c8ff':'white', fontWeight:live?600:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.title}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{s.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} · {e.location}</div>
            </div>
          );
        })}
      </div>

      {/* Clock + user */}
      <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:18, fontWeight:700, color:'white', letterSpacing:'0.05em' }}>
          {now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>
          {now.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}
        </div>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function MainView({ data }) {
  const [orbState, setOrbState]     = useState('idle');
  const [response, setResponse]     = useState('');
  const [streaming, setStreaming]   = useState(false);
  const [listening, setListening]   = useState(false);
  const [transcript, setTranscript] = useState('');
  const [activeIdx, setActiveIdx]   = useState(null);
  const recRef    = useRef(null);
  const streamRef = useRef(false);

  const events  = data?.events  || [];
  const tasks   = data?.tasks   || [];
  const threads = data?.threads || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Speak output
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate  = parseFloat(localStorage.getItem('atlas_rate')  || '0.92');
    u.pitch = parseFloat(localStorage.getItem('atlas_pitch') || '0.85');
    const vs = window.speechSynthesis.getVoices();
    const vname = localStorage.getItem('atlas_voice');
    const v = vname ? vs.find(x=>x.name===vname) : vs.find(x=>x.name==='Daniel'||x.lang==='en-GB');
    if (v) u.voice = v;
    u.onstart = () => setOrbState('speaking');
    u.onend   = () => { setOrbState('idle'); setActiveIdx(null); };
    u.onerror = () => setOrbState('idle');
    window.speechSynthesis.speak(u);
  }, []);

  // Send prompt
  const sendPrompt = useCallback(async (text, idx) => {
    if (streamRef.current) return;
    setActiveIdx(idx);
    setResponse('');
    setOrbState('thinking');
    setStreaming(true);
    streamRef.current = true;

    try {
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          messages:[{ role:'user', content:text }],
          context:{ events, tasks, threads },
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
              setResponse(prev => prev+p.text);
              full += p.text;
            }
          } catch {}
        }
      }
      setStreaming(false);
      if (full) speak(full.slice(0,500));
      else { setOrbState('idle'); setActiveIdx(null); }
    } catch {
      setResponse('Connection error.');
      setStreaming(false);
      setOrbState('idle');
    } finally { streamRef.current=false; }
  }, [events, tasks, threads, speak]);

  // Voice recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.continuous=false; r.interimResults=true; r.lang='en-GB';
    r.onresult = e => {
      let fin='', int='';
      for (let i=e.resultIndex; i<e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript;
        else int += e.results[i][0].transcript;
      }
      setTranscript(int||fin);
      if (fin) { setTranscript(''); setListening(false); sendPrompt(fin.trim(), null); }
    };
    r.onend = () => setListening(false);
    recRef.current = r;
  }, [sendPrompt]);

  const toggleListen = () => {
    if (!recRef.current) return;
    if (listening) { recRef.current.stop(); setListening(false); setOrbState('idle'); }
    else { setTranscript(''); recRef.current.start(); setListening(true); setOrbState('listening'); }
  };

  const reset = () => {
    window.speechSynthesis?.cancel();
    setOrbState('idle'); setResponse(''); setActiveIdx(null); setStreaming(false); streamRef.current=false;
  };

  return (
    <div style={{ width:'100vw', height:'100vh', display:'flex', overflow:'hidden', background:'#0d0f16' }}>
      <Sidebar data={data} />

      {/* Main content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', padding:'24px 40px' }}>

        {/* Ambient background glow */}
        <div style={{ position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)', width:500, height:300, background:'radial-gradient(ellipse, rgba(0,180,255,0.08) 0%, rgba(0,80,180,0.04) 40%, transparent 70%)', pointerEvents:'none', filter:'blur(20px)' }} />

        {/* Top-right nav */}
        <div style={{ position:'absolute', top:20, right:0, display:'flex', gap:24, alignItems:'center', padding:'0 32px' }}>
          {['Dashboard','Settings','Help'].map(item => (
            <button key={item} style={{ background:'transparent', border:'none', color: item==='Dashboard'?'white':'rgba(255,255,255,0.4)', fontSize:13, cursor:'pointer', fontWeight: item==='Dashboard'?600:400 }}>{item}</button>
          ))}
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#00c8ff,#4d7ef7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700 }}>M</div>
        </div>

        {/* Orb + greeting */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:32 }}>
          <GlassOrb state={listening?'listening':orbState} />
          <div style={{ marginTop:20, textAlign:'center' }}>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, letterSpacing:'0.25em', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginBottom:8 }}>
              {greeting.toUpperCase()}
            </div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:28, fontWeight:700, color:'white', letterSpacing:'-0.01em', lineHeight:1.2 }}>
              What do you need today, Mario?
            </div>
          </div>
        </motion.div>

        {/* Response area */}
        <AnimatePresence>
          {response && (
            <motion.div initial={{ opacity:0, y:8, scale:0.98 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0 }}
              style={{ width:'100%', maxWidth:580, marginBottom:20, padding:'14px 18px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, fontSize:14, color:'rgba(255,255,255,0.9)', lineHeight:1.7, position:'relative' }}>
              {response}
              {streaming && <span style={{ display:'inline-block', width:2, height:'1em', background:'#00c8ff', marginLeft:2, verticalAlign:'text-bottom', animation:'blink 1s infinite' }} />}
              <button onClick={reset} style={{ position:'absolute', top:10, right:12, background:'transparent', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:16 }}>✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice transcript */}
        <AnimatePresence>
          {listening && (
            <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{ width:'100%', maxWidth:580, marginBottom:16, padding:'10px 16px', background:'rgba(160,80,255,0.1)', border:'1px solid rgba(160,80,255,0.3)', borderRadius:12, fontSize:13, color:'#c080ff', textAlign:'center' }}>
              {transcript || <span style={{ opacity:0.5 }}>Listening…</span>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompt cards */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          style={{ width:'100%', maxWidth:680, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20 }}>
          {PROMPTS.map((p,i) => (
            <motion.button key={i} onClick={() => sendPrompt(p.text, i)}
              whileHover={{ scale:1.02, borderColor:'rgba(0,200,255,0.35)', background:'rgba(255,255,255,0.07)' }}
              whileTap={{ scale:0.98 }}
              style={{
                padding:'14px 16px', borderRadius:12, cursor:'pointer', textAlign:'left',
                background: activeIdx===i ? 'rgba(0,200,255,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeIdx===i ? 'rgba(0,200,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                display:'flex', flexDirection:'column', gap:4, position:'relative', transition:'background 0.15s, border-color 0.15s',
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <span style={{ fontSize:18 }}>{p.icon}</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.2)', transform:'rotate(-45deg)', display:'inline-block' }}>↗</span>
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:'white', marginTop:4 }}>{p.label}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.4 }}>{p.sub}</div>
            </motion.button>
          ))}
        </motion.div>

        {/* Mic button */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <motion.button onClick={toggleListen}
            animate={listening ? { scale:[1,1.1,1], boxShadow:['0 0 0px rgba(160,80,255,0)','0 0 24px rgba(160,80,255,0.6)','0 0 0px rgba(160,80,255,0)'] } : {}}
            transition={{ duration:1, repeat:Infinity }}
            style={{
              width:48, height:48, borderRadius:'50%',
              background: listening ? 'rgba(160,80,255,0.25)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${listening ? 'rgba(160,80,255,0.6)' : 'rgba(255,255,255,0.12)'}`,
              color: listening ? '#c080ff' : 'rgba(255,255,255,0.6)',
              fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.2s',
            }}
          >🎤</motion.button>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', letterSpacing:'0.12em', fontFamily:"'Space Mono',monospace" }}>
            {listening ? 'LISTENING — TAP TO STOP' : 'TAP TO SPEAK'}
          </span>
        </div>
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}
