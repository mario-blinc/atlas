import { useState, useEffect } from 'react';

const SESSION_KEY = 'atlas_session';

export function useSession() {
  const [messages, setMessages] = useState([]);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [pendingRestore, setPendingRestore] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.messages?.length > 0) setPendingRestore(true);
      } catch { /* ignore */ }
    }
  }, []);

  const restoreSession = () => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setMessages(parsed.messages || []);
    }
    setSessionRestored(true);
    setPendingRestore(false);
  };

  const startFresh = () => {
    localStorage.removeItem(SESSION_KEY);
    setMessages([]);
    setSessionRestored(true);
    setPendingRestore(false);
  };

  const addMessage = (msg) => {
    setMessages(prev => {
      const next = [...prev, msg];
      localStorage.setItem(SESSION_KEY, JSON.stringify({ messages: next, savedAt: Date.now() }));
      return next;
    });
  };

  const updateLastMessage = (updater) => {
    setMessages(prev => {
      const next = [...prev];
      if (next.length > 0) next[next.length - 1] = updater(next[next.length - 1]);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ messages: next, savedAt: Date.now() }));
      return next;
    });
  };

  return { messages, pendingRestore, sessionRestored, restoreSession, startFresh, addMessage, updateLastMessage };
}
