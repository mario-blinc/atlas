import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import GridBackground from './components/GridBackground';
import LeftPanel from './components/LeftPanel';
import ChatPanel from './components/ChatPanel';
import ProjectNavigator from './components/ProjectNavigator';
import SessionRestore from './components/SessionRestore';
import { useVoiceInput, useVoiceOutput } from './hooks/useVoice';
import { useSession } from './hooks/useSession';

const DADDYS_HOME_RESPONSE = "Good to have you back. Systems are live, context is loaded. What are we building today?";
const DADDYS_HOME_PHRASES = ["daddy's home", "daddys home", "daddy's home"];

export default function App() {
  const [apiOnline, setApiOnline] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [inputMode, setInputMode] = useState('type');
  const [bootSequence, setBootSequence] = useState(false);
  const { messages, pendingRestore, sessionRestored, restoreSession, startFresh, addMessage, updateLastMessage } = useSession();
  const voiceOutput = useVoiceOutput();
  const streamingRef = useRef(false);

  const handleVoiceTranscript = useCallback((text) => {
    handleSend(text);
  }, []); // eslint-disable-line

  const voiceInput = useVoiceInput(handleVoiceTranscript);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  const isDaddysHome = (text) =>
    DADDYS_HOME_PHRASES.some(p => text.toLowerCase().trim().includes(p));

  const triggerDaddysHome = useCallback(() => {
    setBootSequence(true);
    addMessage({ role: 'user', content: "Daddy's home" });

    setTimeout(() => {
      addMessage({ role: 'assistant', content: '', streaming: true });
      let i = 0;
      const chars = DADDYS_HOME_RESPONSE.split('');
      const interval = setInterval(() => {
        if (i < chars.length) {
          updateLastMessage(prev => ({
            ...prev,
            content: prev.content + chars[i],
          }));
          i++;
        } else {
          clearInterval(interval);
          updateLastMessage(prev => ({ ...prev, streaming: false }));
          voiceOutput.speak(DADDYS_HOME_RESPONSE);
          setBootSequence(false);
        }
      }, 28);
    }, 600);
  }, [addMessage, updateLastMessage, voiceOutput]);

  const handleSend = useCallback(async (text) => {
    if (!text?.trim() || isThinking || streamingRef.current) return;

    if (isDaddysHome(text)) {
      triggerDaddysHome();
      return;
    }

    addMessage({ role: 'user', content: text });
    setIsThinking(true);
    streamingRef.current = true;

    // Build history for context (last 20 messages)
    const history = [...messages, { role: 'user', content: text }]
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.error) throw new Error(payload.error);
            if (payload.done) break;
            if (payload.text) {
              if (firstChunk) {
                setIsThinking(false);
                addMessage({ role: 'assistant', content: payload.text, streaming: true });
                firstChunk = false;
              } else {
                updateLastMessage(prev => ({
                  ...prev,
                  content: prev.content + payload.text,
                }));
              }
              fullResponse += payload.text;
            }
          } catch (e) {
            if (e.message !== 'Unexpected end of JSON input') throw e;
          }
        }
      }

      updateLastMessage(prev => ({ ...prev, streaming: false }));
      if (fullResponse) voiceOutput.speak(fullResponse.slice(0, 300));

    } catch (err) {
      setIsThinking(false);
      addMessage({
        role: 'assistant',
        content: `System error: ${err.message}. Check that the ATLAS server is running.`,
      });
    } finally {
      streamingRef.current = false;
      setIsThinking(false);
    }
  }, [messages, isThinking, addMessage, updateLastMessage, voiceOutput, triggerDaddysHome]);

  const handleSelectProject = (project, isNew) => {
    setActiveProject(project);
    if (!isNew) {
      handleSend(`Load context for project: ${project.name}. Briefly tell me where we left off and what's most relevant right now.`);
    }
  };

  const sessionLive = sessionRestored || messages.length > 0;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <GridBackground />

      {/* Boot glow overlay */}
      <AnimatePresence>
        {bootSequence && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none',
              background: 'radial-gradient(ellipse at center, rgba(0,180,255,0.08) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Session restore modal */}
      <AnimatePresence>
        {pendingRestore && !sessionRestored && (
          <SessionRestore onRestore={restoreSession} onFresh={startFresh} />
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        <LeftPanel
          apiOnline={apiOnline}
          voiceActive={voiceInput.isListening}
          sessionLive={sessionLive}
        />

        <ChatPanel
          messages={messages}
          isThinking={isThinking}
          activeProject={activeProject}
          onSendMessage={handleSend}
          voiceInput={voiceInput}
          voiceOutput={voiceOutput}
          inputMode={inputMode}
          setInputMode={setInputMode}
        />

        <ProjectNavigator
          onSelectProject={handleSelectProject}
          activeProjectId={activeProject?.id}
        />
      </div>

      {/* Initialise session if no pending restore */}
      {!pendingRestore && !sessionRestored && (
        <SessionInit onInit={startFresh} />
      )}
    </div>
  );
}

function SessionInit({ onInit }) {
  useEffect(() => { onInit(); }, [onInit]);
  return null;
}
