import { useCallback, useEffect, useRef, useState } from 'react';

type AudioContextCtor = typeof AudioContext;

declare global {
  interface Window {
    webkitAudioContext?: AudioContextCtor;
  }
}

function decodeBase64(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function pcm16ToFloat32(bytes: Uint8Array): Float32Array {
  const sampleCount = Math.floor(bytes.byteLength / 2);
  const output = new Float32Array(sampleCount);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let i = 0; i < sampleCount; i += 1) {
    output[i] = view.getInt16(i * 2, true) / 0x8000;
  }

  return output;
}

export function usePcmPlayer(initialEnabled = true) {
  const contextRef = useRef<AudioContext | null>(null);
  const nextStartRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const enabledRef = useRef(initialEnabled);
  const [voiceEnabled, setVoiceEnabledState] = useState(initialEnabled);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const ensureContext = useCallback(() => {
    if (contextRef.current) {
      return contextRef.current;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      return null;
    }

    contextRef.current = new AudioCtor();
    setIsUnlocked(contextRef.current.state === 'running');
    return contextRef.current;
  }, []);

  const reset = useCallback(() => {
    const context = contextRef.current;
    for (const source of sourcesRef.current) {
      try {
        source.stop();
      } catch {
        // Ignore nodes that already finished.
      }
      source.disconnect();
    }
    sourcesRef.current.clear();
    nextStartRef.current = context ? context.currentTime : 0;
    setIsPlaying(false);
  }, []);

  const unlock = useCallback(async () => {
    const context = ensureContext();
    if (!context) {
      return false;
    }

    if (context.state === 'suspended') {
      await context.resume();
    }

    const unlocked = context.state === 'running';
    setIsUnlocked(unlocked);
    return unlocked;
  }, [ensureContext]);

  const setVoiceEnabled = useCallback(async (enabled: boolean) => {
    enabledRef.current = enabled;
    setVoiceEnabledState(enabled);

    if (!enabled) {
      reset();
      return;
    }

    await unlock();
  }, [reset, unlock]);

  const enqueueBase64Pcm = useCallback(async (base64: string, sampleRate: number) => {
    if (!enabledRef.current) {
      return;
    }

    const context = ensureContext();
    if (!context || context.state !== 'running') {
      setIsUnlocked(false);
      return;
    }

    const pcm = pcm16ToFloat32(decodeBase64(base64));
    const audioBuffer = context.createBuffer(1, pcm.length, sampleRate);
    audioBuffer.copyToChannel(pcm, 0);

    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);

    const startAt = Math.max(context.currentTime + 0.02, nextStartRef.current);
    nextStartRef.current = startAt + audioBuffer.duration;
    sourcesRef.current.add(source);
    setIsPlaying(true);

    source.onended = () => {
      sourcesRef.current.delete(source);
      source.disconnect();
      if (sourcesRef.current.size === 0) {
        setIsPlaying(false);
      }
    };

    source.start(startAt);
  }, [ensureContext]);

  useEffect(() => () => {
    reset();
    const context = contextRef.current;
    if (!context) {
      return;
    }
    void context.close();
  }, [reset]);

  return {
    voiceEnabled,
    isUnlocked,
    isPlaying,
    unlock,
    reset,
    setVoiceEnabled,
    enqueueBase64Pcm,
  };
}
