import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AtlasOrb from './AtlasOrb';

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ children, style = {}, delay = 0, glow }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35 }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${glow ? 'rgba(0,201,255,0.2)' : 'var(--border)'}`,
        borderRadius: 16,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: glow ? '0 0 30px rgba(0,201,255,0.06)' : 'none',
        ...style,
      }}
    />
  );
}

function CardLabel({ children }) {
  return (
    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', marginBottom: 10, flexShrink: 0 }}>
      {children}
    </div>
  );
}

function BigStat({ value, label, color = 'var(--text-primary)', size = 52 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: size, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>{label}</div>
    </div>
  );
}

function Skel({ w = '60%', h = 20 }) {
  return (
    <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 1.5, repeat: Infinity }}
      style={{ height: h, width: w, background: 'var(--border-bright)', borderRadius: 6, marginBottom: 8 }} />
  );
}

// ─── Voice picker ─────────────────────────────────────────────────────────────
function VoicePicker({ onClose }) {
  const [voices, setVoices] = useState([]);
  const [selected, setSelected] = useState(localStorage.getItem('atlas_voice') || '');
  const [rate, setRate] = useState(parseFloat(localStorage.getItem('atlas_rate') || '0.92'));
  const [pitch, setPitch] = useState(parseFloat(localStorage.getItem('atlas_pitch') || '0.85'));

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices().filter(v => v.lang.startsWith('en')) || []);
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, []);

  const preview = (name) => {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance("Systems live. Good to have you back, Mario.");
    u.rate = rate; u.pitch = pitch;
    const v = window.speechSynthesis?.getVoices().find(x => x.name === name);
    if (v) u.voice = v;
    window.speechSynthesis?.speak(u);
  };

  const save = () => {
    localStorage.setItem('atlas_voice', selected);
    localStorage.setItem('atlas_rate', rate);
    localStorage.setItem('atlas_pitch', pitch);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
        marginBottom: 10, width: 280,
        background: '#1a1d28', border: '1px solid var(--border-bright)',
        borderRadius: 12, padding: 16, zIndex: 50,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 12 }}>Voice Settings</div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Voice</div>
        <select value={selected} onChange={e => setSelected(e.target.value)} style={{
          width: '100%', background: 'var(--bg)', border: '1px solid var(--border-bright)',
          borderRadius: 6, color: 'white', fontFamily: 'var(--font-body)', fontSize: 12, padding: '6px 8px', outline: 'none',
        }}>
          <option value="">Auto (Daniel / UK Male)</option>
          {voices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
        </select>
        <button onClick={() => preview(selected)} style={{
          marginTop: 6, width: '100%', padding: '5px', borderRadius: 6,
          background: 'transparent', border: '1px solid var(--border-bright)',
          color: 'var(--teal)', fontFamily: 'var(--font-body)', fontSize: 11, cursor: 'pointer',
        }}>▶ Preview voice</button>
      </div>

      {[
        { label: 'Speed', value: rate, set: setRate, min: 0.5, max: 1.5, step: 0.05 },
        { label: 'Pitch', value: pitch, set: setPitch, min: 0.5, max: 1.5, step: 0.05 },
      ].map(({ label, value, set, min, max, step }) => (
        <div key={label} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal)' }}>{value.toFixed(2)}</span>
          </div>
          <input type="range" min={min} max={max} step={step} value={value}
            onChange={e => set(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--teal)' }} />
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '7px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
        <button onClick={save} style={{ flex: 1, padding: '7px', borderRadius: 6, background: 'var(--teal)', border: 'none', color: 'var(--bg)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save</button>
      </div>
    </motion.div>
  );
}

// ─── Orb + Chat centre panel ──────────────────────────────────────────────────
function CentrePanel({ dashboardData }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Systems live. What do you need?' }]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [transcript, setTranscript] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(false);

  // Set up speech recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-GB';
    rec.onresult = (e) => {
      let final = '', interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setTranscript(interim || final);
      if (final) { setInput(final.trim()); setTranscript(''); setListening(false); }
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  // Spacebar to toggle voice
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        toggleListen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [listening]);

  const toggleListen = () => {
    if (!recognitionRef.current) return;
    if (listening) { recognitionRef.current.stop(); setListening(false); }
    else { setTranscript(''); recognitionRef.current.start(); setListening(true); }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = parseFloat(localStorage.getItem('atlas_rate') || '0.92');
    u.pitch = parseFloat(localStorage.getItem('atlas_pitch') || '0.85');
    const voiceName = localStorage.getItem('atlas_voice');
    const voices = window.speechSynthesis.getVoices();
    const voice = voiceName
      ? voices.find(v => v.name === voiceName)
      : voices.find(v => v.name === 'Daniel' || v.name === 'Google UK English Male' || v.lang === 'en-GB');
    if (voice) u.voice = voice;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || streamRef.current) return;
    setInput('');
    const updated = [...messages, { role: 'user', content: msg }];
    setMessages(updated);
    setThinking(true);
    streamRef.current = true;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.slice(-12).map(m => ({ role: m.role, content: m.content })),
          context: { events: dashboardData?.events || [], tasks: dashboardData?.tasks || [], threads: dashboardData?.threads || [] },
        }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '', fullText = '', first = true;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const p = JSON.parse(line.slice(6));
            if (p.done) break;
            if (p.text) {
              if (first) { setThinking(false); setMessages(prev => [...prev, { role: 'assistant', content: p.text, streaming: true }]); first = false; }
              else setMessages(prev => { const n = [...prev]; n[n.length-1] = { ...n[n.length-1], content: n[n.length-1].content + p.text }; return n; });
              fullText += p.text;
            }
          } catch {}
        }
      }
      setMessages(prev => { const n = [...prev]; if (n[n.length-1]) n[n.length-1] = { ...n[n.length-1], streaming: false }; return n; });
      if (fullText) speak(fullText.slice(0, 400));
    } catch {
      setThinking(false);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Is the server running?' }]);
    } finally { streamRef.current = false; setThinking(false); }
  }, [messages, input, dashboardData, speak]);

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <Card glow delay={0.1} style={{
      gridColumn: '2 / 4', gridRow: '1 / 3',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '20px 20px 16px',
      position: 'relative',
      background: 'linear-gradient(160deg, #0f1520 0%, #0d1018 100%)',
    }}>
      {/* Top label */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(0,201,255,0.5)' }}>ATLAS AGENT</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', position: 'relative' }}>
          <button onClick={() => setShowVoice(v => !v)} style={{
            padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border-bright)',
            background: 'transparent', color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            🎤 Change Voice
          </button>
          <AnimatePresence>
            {showVoice && <VoicePicker onClose={() => setShowVoice(false)} />}
          </AnimatePresence>
        </div>
      </div>

      {/* Orb */}
      <div style={{ flexShrink: 0, margin: '8px 0 12px' }}>
        <AtlasOrb speaking={speaking} listening={listening} thinking={thinking} />
      </div>

      {/* State label */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: listening ? '#c080ff' : thinking ? 'var(--blue)' : speaking ? 'var(--teal)' : 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: 10, flexShrink: 0 }}>
        {listening ? '● LISTENING' : thinking ? '⬡ PROCESSING' : speaking ? '◈ SPEAKING' : '○ READY'}
      </div>

      {/* Voice transcript */}
      <AnimatePresence>
        {listening && transcript && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ width: '100%', marginBottom: 8, padding: '6px 10px', background: 'rgba(160,80,255,0.08)', border: '1px solid rgba(160,80,255,0.2)', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 12, color: '#c080ff' }}>
            {transcript}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div style={{ flex: 1, width: '100%', overflowY: 'auto', marginBottom: 10, minHeight: 0 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
            <div style={{
              maxWidth: '88%', padding: '8px 12px', borderRadius: msg.role === 'user' ? '12px 12px 3px 12px' : '3px 12px 12px 12px',
              background: msg.role === 'user' ? 'rgba(0,201,255,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(0,201,255,0.2)' : 'var(--border)'}`,
              fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {msg.content}
              {msg.streaming && <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--teal)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s infinite' }} />}
            </div>
          </div>
        ))}
        {thinking && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
            <div style={{ padding: '8px 14px', borderRadius: '3px 12px 12px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <motion.div key={i} animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                  style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--teal)' }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ width: '100%', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask ATLAS anything..."
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-bright)',
              borderRadius: 10, padding: '10px 14px', color: 'white',
              fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
              caretColor: 'var(--teal)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--teal)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-bright)'}
          />
          <motion.button
            onClick={toggleListen}
            animate={listening ? { scale: [1, 1.08, 1], boxShadow: ['0 0 0px rgba(160,80,255,0)', '0 0 16px rgba(160,80,255,0.5)', '0 0 0px rgba(160,80,255,0)'] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: listening ? 'rgba(160,80,255,0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${listening ? 'rgba(160,80,255,0.5)' : 'var(--border-bright)'}`,
              color: listening ? '#c080ff' : 'var(--text-secondary)', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >🎤</motion.button>
          <button onClick={() => send()} disabled={!input.trim() || thinking} style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: input.trim() && !thinking ? 'var(--teal)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${input.trim() && !thinking ? 'var(--teal)' : 'var(--border-bright)'}`,
            color: input.trim() && !thinking ? 'var(--bg)' : 'var(--text-dim)',
            fontSize: 18, cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>↑</button>
        </div>
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
          PRESS SPACE TO SPEAK
        </div>
      </div>

      <style>{`@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </Card>
  );
}

// ─── Schedule card ────────────────────────────────────────────────────────────
function ScheduleCard({ events, loading, upcoming }) {
  const now = new Date();
  return (
    <Card delay={0} style={{ gridColumn: '1', gridRow: '1 / 3', display: 'flex', flexDirection: 'column' }}>
      <CardLabel>Today's Schedule</CardLabel>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? [0,1,2,3].map(i => <Skel key={i} w="100%" h={44} />) :
          events.length === 0 ? (
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>No meetings today</div>
              {upcoming.slice(0, 4).map((e, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                    {new Date(e.start).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'white' }}>{e.title}</div>
                </div>
              ))}
            </div>
          ) : events.map((e, i) => {
            const s = new Date(e.start), end = new Date(e.end);
            const live = s <= now && end >= now;
            const past = end < now;
            const mins = Math.round((end - s) / 60000);
            const dur = mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h${mins%60?` ${mins%60}m`:''}`;
            return (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', opacity: past ? 0.35 : 1 }}>
                <div style={{ minWidth: 44, flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: live ? 'var(--teal)' : 'white' }}>
                    {s.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-secondary)' }}>{dur}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: live ? 'var(--teal)' : 'var(--text-secondary)', marginTop: 1 }}>{live ? '● Live now' : e.location || ''}</div>
                </div>
              </div>
            );
          })
        }
      </div>
    </Card>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function BentoDashboard({ data, loading }) {
  const events = data?.events || [];
  const tasks = data?.tasks || [];
  const threads = data?.threads || [];
  const stats = data?.stats || {};
  const upcoming = data?.upcoming || [];

  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const dueToday = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString());

  return (
    <div style={{
      flex: 1, minHeight: 0,
      display: 'grid',
      gridTemplateColumns: '220px 1fr 1fr 220px',
      gridTemplateRows: '1fr 1fr',
      gap: 10, padding: '10px 12px 12px',
      overflow: 'hidden',
    }}>
      {/* Schedule — left, full height */}
      <ScheduleCard events={events} loading={loading} upcoming={upcoming} />

      {/* Centre orb + chat — spans 2 cols, 2 rows */}
      <CentrePanel dashboardData={data} />

      {/* Right column — 4 stacked cards */}
      {/* Tasks Due */}
      <Card delay={0.06} style={{ gridColumn: '4', gridRow: '1', alignItems: 'center', justifyContent: 'center' }}>
        <CardLabel>Tasks Due</CardLabel>
        {loading ? <Skel w="40%" h={50} /> : (
          <BigStat
            value={overdue.length + dueToday.length}
            label={overdue.length > 0 ? `${overdue.length} overdue` : 'all caught up'}
            color={overdue.length > 0 ? 'var(--red)' : 'var(--teal)'}
          />
        )}
      </Card>

      {/* Inbox + Weather stacked in row 2 */}
      <Card delay={0.1} style={{ gridColumn: '4', gridRow: '2', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Inbox */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 14 }}>
          <CardLabel>Inbox</CardLabel>
          {loading ? <Skel w="40%" h={42} /> : (
            <BigStat
              value={stats.unreadCount ?? threads.length}
              label="unread emails"
              color="var(--orange)"
              size={42}
            />
          )}
        </div>

        {/* Weather */}
        <WeatherMini loading={loading} />
      </Card>

    </div>
  );
}

function WeatherMini({ loading }) {
  const [w, setW] = useState(null);
  useEffect(() => {
    fetch('/api/weather?city=London').then(r => r.json()).then(setW).catch(() => {});
  }, []);

  if (loading || !w) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Skel w="60%" h={30} />
    </div>
  );

  const icon = (d = '') => {
    const s = d.toLowerCase();
    if (s.includes('sunny') || s.includes('clear')) return '☀️';
    if (s.includes('cloud')) return '☁️';
    if (s.includes('rain') || s.includes('shower')) return '🌧️';
    if (s.includes('snow')) return '❄️';
    return '🌤️';
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Weather · London</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 26 }}>{icon(w.description)}</span>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'white', lineHeight: 1 }}>{w.temp_c}°</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)' }}>{w.description}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)' }}>💧 {w.humidity}%</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)' }}>💨 {w.wind_kmph}km/h</span>
      </div>
    </div>
  );
}
