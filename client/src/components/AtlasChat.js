import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  "What's my schedule today?",
  "What tasks are overdue?",
  "What's in my inbox?",
  "What's the weather like?",
  "Summarise my day",
];

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
      {[0,1,2].map(i => (
        <motion.div key={i}
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
          style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--blue)' }}
        />
      ))}
    </div>
  );
}

export default function AtlasChat({ dashboardData }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamingRef = useRef(false);

  // Voice input setup
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-GB';
      rec.onresult = (e) => {
        let final = '', interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        setVoiceTranscript(interim || final);
        if (final) {
          setInput(final.trim());
          setVoiceTranscript('');
          setIsListening(false);
        }
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Systems live. What do you need, Mario?",
      }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || streamingRef.current) return;
    setInput('');
    const updated = [...messages, { role: 'user', content: msg }];
    setMessages(updated);
    setThinking(true);
    streamingRef.current = true;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.slice(-12).map(m => ({ role: m.role, content: m.content })),
          context: {
            events: dashboardData?.events || [],
            tasks: dashboardData?.tasks || [],
            threads: dashboardData?.threads || [],
          },
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let first = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.done) break;
            if (payload.text) {
              if (first) {
                setThinking(false);
                setMessages(prev => [...prev, { role: 'assistant', content: payload.text, streaming: true }]);
                first = false;
              } else {
                setMessages(prev => {
                  const n = [...prev];
                  n[n.length - 1] = { ...n[n.length - 1], content: n[n.length - 1].content + payload.text };
                  return n;
                });
              }
            }
          } catch {}
        }
      }
      setMessages(prev => {
        const n = [...prev];
        if (n[n.length-1]) n[n.length-1] = { ...n[n.length-1], streaming: false };
        return n;
      });
    } catch {
      setThinking(false);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Check that the server is running.' }]);
    } finally {
      streamingRef.current = false;
      setThinking(false);
    }
  }, [messages, input, dashboardData]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setVoiceTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: 24, right: 24,
          width: 52, height: 52,
          borderRadius: '50%',
          background: open ? 'var(--bg-card)' : 'var(--bg-accent)',
          border: `1px solid ${open ? 'var(--border-light)' : 'transparent'}`,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          transition: 'background 0.2s',
        }}
      >
        <span style={{ fontSize: open ? 18 : 20 }}>{open ? '✕' : '◈'}</span>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: 88, right: 24,
              width: 380,
              height: 520,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 99,
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--bg)',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--text-primary)' }}>ATLAS</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>SECOND BRAIN</div>
              </div>
              <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>
                {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Suggestions (show when only greeting) */}
              {messages.length <= 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      style={{
                        background: 'var(--bg)', border: '1px solid var(--border-light)',
                        borderRadius: 20, padding: '5px 10px',
                        fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.target.style.background = 'var(--bg-accent)'; e.target.style.color = 'white'; }}
                      onMouseLeave={e => { e.target.style.background = 'var(--bg)'; e.target.style.color = 'var(--text-secondary)'; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '10px 13px',
                    background: msg.role === 'user' ? 'var(--bg-accent)' : 'var(--bg)',
                    borderRadius: msg.role === 'user' ? '12px 12px 3px 12px' : '3px 12px 12px 12px',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                    {msg.streaming && <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--blue)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s infinite' }} />}
                  </div>
                </div>
              ))}

              {thinking && (
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ padding: '10px 13px', background: 'var(--bg)', borderRadius: '3px 12px 12px 12px' }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Voice transcript preview */}
            <AnimatePresence>
              {isListening && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  style={{ padding: '8px 18px', background: 'rgba(106,138,181,0.1)', borderTop: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)', overflow: 'hidden' }}>
                  {voiceTranscript || <span style={{ opacity: 0.5 }}>Listening...</span>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--bg)' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask ATLAS anything..."
                style={{
                  flex: 1, background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 8, padding: '9px 12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  outline: 'none', caretColor: 'var(--blue)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
              />
              {/* Voice button */}
              <motion.button
                onClick={toggleVoice}
                animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: isListening ? 'var(--bg-accent)' : 'var(--bg-card)',
                  border: `1px solid ${isListening ? 'var(--bg-accent)' : 'var(--border-light)'}`,
                  cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                🎤
              </motion.button>
              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || thinking}
                style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: input.trim() && !thinking ? 'var(--bg-accent)' : 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed',
                  color: input.trim() && !thinking ? 'white' : 'var(--text-dim)',
                  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.2s',
                }}
              >
                ↑
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </>
  );
}
