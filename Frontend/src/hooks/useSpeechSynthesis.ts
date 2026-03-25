import { useCallback, useEffect, useState } from 'react';

export function useSpeechSynthesis() {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [, setVoicesTick] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    const onVoices = () => setVoicesTick((n) => n + 1);
    window.speechSynthesis.onvoiceschanged = onVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 1.1;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find((v) => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported],
  );

  const stop = useCallback(() => {
    if (isSupported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [isSupported]);

  return { speak, stop, isSupported, speaking };
}
