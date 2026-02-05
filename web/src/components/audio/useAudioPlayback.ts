import { useCallback, useRef } from "react";

// Sample rate of audio from ElevenLabs (pcm_24000 format)
const SAMPLE_RATE = 24000;

export interface AudioPlayback {
  push: (pcmBase64: string) => void;
  stop: () => void;
  resetScheduling: () => void;
}

export function useAudioPlayback(): AudioPlayback {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);
  const sourceQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const base64QueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  const ensureContext = useCallback((): AudioContext => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  const pcmBase64ToArrayBuffer = useCallback((pcmBase64: string) => {
    const binaryData = atob(pcmBase64);
    const arrayBuffer = new ArrayBuffer(binaryData.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < binaryData.length; i++) {
      uint8Array[i] = binaryData.charCodeAt(i);
    }

    return { arrayBuffer, length: uint8Array.length };
  }, []);

  const createAudioBuffer = useCallback(
    (arrayBuffer: ArrayBuffer, length: number): AudioBuffer => {
      const ctx = ensureContext();
      const dataView = new DataView(arrayBuffer);
      const audioBuffer = ctx.createBuffer(1, length / 2, SAMPLE_RATE);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < length; i += 2) {
        const sample = dataView.getInt16(i, true);
        channelData[i / 2] = sample / 32768;
      }

      return audioBuffer;
    },
    [ensureContext]
  );

  const sourceEnded = useCallback((source: AudioBufferSourceNode) => {
    const queue = sourceQueueRef.current;
    const index = queue.indexOf(source);
    if (index !== -1) {
      queue.splice(index, 1);
    }
  }, []);

  const schedulePlaySource = useCallback(
    (source: AudioBufferSourceNode) => {
      source.start(nextPlayTimeRef.current);
      source.addEventListener("ended", () => sourceEnded(source));
    },
    [sourceEnded]
  );

  const processQueue = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    while (base64QueueRef.current.length > 0) {
      const base64 = base64QueueRef.current.shift();
      if (!base64) break;

      const ctx = ensureContext();
      const { arrayBuffer, length } = pcmBase64ToArrayBuffer(base64);
      const audioBuffer = createAudioBuffer(arrayBuffer, length);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      sourceQueueRef.current.push(source);

      // Catch up if scheduling fell behind
      if (nextPlayTimeRef.current < ctx.currentTime) {
        nextPlayTimeRef.current = ctx.currentTime;
      }

      schedulePlaySource(source);
      nextPlayTimeRef.current += audioBuffer.duration;
    }

    isProcessingRef.current = false;
  }, [
    ensureContext,
    pcmBase64ToArrayBuffer,
    createAudioBuffer,
    schedulePlaySource,
  ]);

  const push = useCallback(
    (pcmBase64: string) => {
      base64QueueRef.current.push(pcmBase64);
      processQueue();
    },
    [processQueue]
  );

  const stop = useCallback(() => {
    base64QueueRef.current = [];

    for (const source of sourceQueueRef.current) {
      try {
        source.stop();
      } catch {
        // ignore
      }
    }

    sourceQueueRef.current = [];
    nextPlayTimeRef.current = 0;
  }, []);

  const resetScheduling = useCallback(() => {
    nextPlayTimeRef.current = 0;
  }, []);

  return {
    push,
    stop,
    resetScheduling,
  };
}
