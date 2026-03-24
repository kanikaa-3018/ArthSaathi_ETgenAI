import { useState, useRef, useCallback, useEffect } from 'react';

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition; SpeechRecognition?: new () => SpeechRecognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const Ctor = getSpeechRecognitionCtor();
  const isSupported = !!Ctor;

  const startListening = useCallback(() => {
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = Array.from(event.results)
        .map((r) => r[0]?.transcript ?? '')
        .join('');
      setTranscript(result);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
  }, [Ctor]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  return { isListening, transcript, isSupported, startListening, stopListening };
}
