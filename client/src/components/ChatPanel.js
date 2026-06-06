import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-blue)' }}
        />
      ))}
    </div>
  );
}

function Message({ msg, isNew }) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: 4,
        marginBottom: 20,
      }}
    >
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '0.15em',
        color: isUser ? 'var(--text-dim)' : 'var(--accent-blue)',
        textTransform: 'uppercase',
        paddingLeft: isUser ? 0 : 2,
      }}>
        {isUser ? 'MARIO' : 'ATLAS'}
      </div>
      <div style={{
        maxWidth: '82%',
        background: isUser
          ? 'rgba(255,255,255,0.04)'
          : 'rgba(0,180,255,0.06)',
        border: `1px solid ${isUser ? 'rgba(255,255,255,0.08)' : 'var(--border-blue)'}`,
        borderRadius: isUser ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
        padding: '12px 16px',
        color: 'var(--text-primary)',
        fontSize: 14,
        lineHeight: 1.7,
        fontFamily: 'var(--font-body)',
        boxShadow: isUser ? 'none' : '0 0 20px rgba(0,180,255,0.05)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
        {msg.streaming && <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--accent-blue)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s infinite' }} />}
      </div>
    </motion.div>
  );
}

export default function ChatPanel({
  messages,
  isThinking,
  activeProject,
  onSendMessage,
  voiceInput,
  voiceOutput,
  inputMode,
  setInputMode,
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const { isListening, transcript, supported: voiceSupported, startListening, stopListening } = voiceInput;
  const { muted, setMuted, speak } = voiceOutput;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    if (inputMode === 'type') textareaRef.current?.focus();
  }, [inputMode]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isThinking) return;
    setInput('');
    onSendMessage(text);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid var(--border-blue)',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.2em', color: 'var(--accent-blue)' }}>
            ACTIVE SESSION
          </div>
          {activeProject && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
              {activeProject.name}
            </div>
          )}
        </div>

        {/* Voice mute toggle */}
        <button
          onClick={() => setMuted(!muted)}
          title={muted ? 'Enable voice output' : 'Mute voice output'}
          style={{
            background: muted ? 'transparent' : 'rgba(0,180,255,0.1)',
            border: `1px solid ${muted ? 'var(--border-blue)' : 'var(--border-blue-strong)'}`,
            borderRadius: 6,
            padding: '6px 10px',
            cursor: 'pointer',
            color: muted ? 'var(--text-dim)' : 'var(--accent-blue)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.1em',
            transition: 'all 0.2s',
          }}
        >
          {muted ? 'VOICE OFF' : 'VOICE ON'}
        </button>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ margin: 'auto', textAlign: 'center', maxWidth: 400 }}
          >
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              letterSpacing: '0.3em',
              color: 'var(--accent-blue)',
              marginBottom: 12,
              textShadow: '0 0 20px rgba(0,180,255,0.4)',
            }}>
              SYSTEM READY
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.8, letterSpacing: '0.05em' }}>
              Say or type "Daddy's home" to initialise<br />the full session protocol.
            </div>
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <Message key={i} msg={msg} isNew={i === messages.length - 1 && msg.role === 'assistant'} />
        ))}

        {isThinking && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', color: 'var(--accent-blue)' }}>
              ATLAS
            </div>
            <div style={{
              background: 'rgba(0,180,255,0.06)',
              border: '1px solid var(--border-blue)',
              borderRadius: '2px 12px 12px 12px',
              padding: '12px 16px',
              boxShadow: '0 0 20px rgba(0,180,255,0.05)',
            }}>
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border-blue)',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Voice transcript preview */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginBottom: 10,
                padding: '8px 12px',
                background: 'rgba(0,245,255,0.06)',
                border: '1px solid rgba(0,245,255,0.3)',
                borderRadius: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--accent-cyan)',
                minHeight: 32,
              }}
            >
              {transcript || (
                <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Listening...</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          {/* Mode toggle */}
          <div style={{
            display: 'flex',
            border: '1px solid var(--border-blue)',
            borderRadius: 6,
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {['TYPE', 'VOICE'].map(mode => (
              <button
                key={mode}
                onClick={() => setInputMode(mode.toLowerCase())}
                style={{
                  background: inputMode === mode.toLowerCase() ? 'rgba(0,180,255,0.2)' : 'transparent',
                  border: 'none',
                  color: inputMode === mode.toLowerCase() ? 'var(--accent-blue)' : 'var(--text-dim)',
                  padding: '8px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          {inputMode === 'type' ? (
            <>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Enter command..."
                rows={1}
                style={{
                  flex: 1,
                  background: 'rgba(0,180,255,0.04)',
                  border: '1px solid var(--border-blue)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  resize: 'none',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  lineHeight: 1.5,
                  maxHeight: 120,
                  overflow: 'auto',
                  caretColor: 'var(--accent-blue)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--border-blue-strong)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-blue)'}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                style={{
                  background: input.trim() && !isThinking ? 'rgba(0,180,255,0.2)' : 'transparent',
                  border: `1px solid ${input.trim() && !isThinking ? 'var(--border-blue-strong)' : 'var(--border-blue)'}`,
                  borderRadius: 8,
                  padding: '10px 18px',
                  color: input.trim() && !isThinking ? 'var(--accent-blue)' : 'var(--text-dim)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  cursor: input.trim() && !isThinking ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  height: 42,
                }}
              >
                SEND
              </button>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'center' }}>
              {voiceSupported ? (
                <>
                  <motion.button
                    onMouseDown={startListening}
                    onMouseUp={stopListening}
                    onTouchStart={startListening}
                    onTouchEnd={stopListening}
                    animate={isListening ? {
                      boxShadow: ['0 0 10px rgba(0,245,255,0.3)', '0 0 25px rgba(0,245,255,0.6)', '0 0 10px rgba(0,245,255,0.3)'],
                    } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{
                      flex: 1,
                      height: 42,
                      background: isListening ? 'rgba(0,245,255,0.15)' : 'rgba(0,180,255,0.08)',
                      border: `1px solid ${isListening ? 'var(--accent-cyan)' : 'var(--border-blue)'}`,
                      borderRadius: 8,
                      color: isListening ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.15em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {isListening ? (
                      <>
                        <WaveIcon />
                        RELEASE TO SEND
                      </>
                    ) : 'HOLD TO SPEAK'}
                  </motion.button>
                  {transcript && (
                    <button
                      onClick={() => onSendMessage(transcript)}
                      style={{
                        background: 'rgba(0,180,255,0.2)',
                        border: '1px solid var(--border-blue-strong)',
                        borderRadius: 8,
                        padding: '10px 16px',
                        color: 'var(--accent-blue)',
                        fontFamily: 'var(--font-display)',
                        fontSize: 10,
                        letterSpacing: '0.15em',
                        cursor: 'pointer',
                        height: 42,
                      }}
                    >
                      SEND
                    </button>
                  )}
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                  Voice input not supported in this browser
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
      `}</style>
    </motion.div>
  );
}

function WaveIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      {[0,1,2,3,4].map(i => (
        <motion.rect
          key={i}
          x={i * 4}
          y={0}
          width={2.5}
          rx={1.25}
          fill="var(--accent-cyan)"
          animate={{ height: [4, 14, 4], y: [5, 0, 5] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </svg>
  );
}
