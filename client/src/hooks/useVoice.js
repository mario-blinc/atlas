import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoiceInput(onTranscript) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-GB';

      rec.onresult = (e) => {
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        setTranscript(interim || final);
        if (final) onTranscript(final.trim());
      };

      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, [onTranscript]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, transcript, supported, startListening, stopListening };
}

const VOICE_STORAGE_KEY = 'atlas_voice_settings';

function loadVoiceSettings() {
  try {
    return JSON.parse(localStorage.getItem(VOICE_STORAGE_KEY)) || {};
  } catch { return {}; }
}

function saveVoiceSettings(settings) {
  localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(settings));
}

export function useVoiceOutput() {
  const saved = loadVoiceSettings();
  const [muted, setMutedState] = useState(saved.muted ?? false);
  const [speaking, setSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceNameState] = useState(saved.voiceName ?? '');
  const [rate, setRateState] = useState(saved.rate ?? 0.92);
  const [pitch, setPitchState] = useState(saved.pitch ?? 0.85);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      // Filter to English voices only, deduplicate by name
      const english = voices.filter(v => v.lang.startsWith('en'));
      setAvailableVoices(english);
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const setMuted = useCallback((v) => {
    setMutedState(v);
    saveVoiceSettings({ ...loadVoiceSettings(), muted: v });
  }, []);

  const setSelectedVoiceName = useCallback((name) => {
    setSelectedVoiceNameState(name);
    saveVoiceSettings({ ...loadVoiceSettings(), voiceName: name });
  }, []);

  const setRate = useCallback((v) => {
    setRateState(v);
    saveVoiceSettings({ ...loadVoiceSettings(), rate: v });
  }, []);

  const setPitch = useCallback((v) => {
    setPitchState(v);
    saveVoiceSettings({ ...loadVoiceSettings(), pitch: v });
  }, []);

  const speak = useCallback((text) => {
    if (muted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 0.95;

    const voices = window.speechSynthesis.getVoices();

    if (selectedVoiceName) {
      const picked = voices.find(v => v.name === selectedVoiceName);
      if (picked) utterance.voice = picked;
    } else {
      // Smart default: prefer a calm male English voice
      const preferred = voices.find(v =>
        v.name === 'Daniel' ||
        v.name === 'Google UK English Male' ||
        v.name === 'Alex' ||
        v.name === 'Oliver'
      ) || voices.find(v => v.lang === 'en-GB') || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [muted, selectedVoiceName, rate, pitch]);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const previewVoice = useCallback((voiceName) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Systems are live. Good to have you back, Mario.");
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === voiceName);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, [rate, pitch]);

  return {
    muted, setMuted,
    speaking,
    speak, cancel,
    availableVoices,
    selectedVoiceName, setSelectedVoiceName,
    rate, setRate,
    pitch, setPitch,
    previewVoice,
  };
}
