import { useCallback, useEffect, useState } from 'react';

export function useSpeechSynthesis() {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [, setVoicesTick] = useState(0);

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
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find((v) => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported],
  );

  const stop = useCallback(() => {
    if (isSupported) window.speechSynthesis.cancel();
  }, [isSupported]);

  return { speak, stop, isSupported };
}
