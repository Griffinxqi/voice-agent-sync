import { useCallback, useEffect, useRef, useState } from "react";
import type { ServerEvent } from "./types";
import { useAudioCapture } from "./components/audio/useAudioCapture";
import { useAudioPlayback } from "./components/audio/useAudioPlayback";

interface UseVoiceSessionReturn {
  isConnected: boolean;
  isRecording: boolean;
  events: ServerEvent[];
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearEvents: () => void;
}

export function useVoiceSession(url: string): UseVoiceSessionReturn {
  /** ---------------- STATE ---------------- */
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [events, setEvents] = useState<ServerEvent[]>([]);

  /** ---------------- REFS ---------------- */
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);

  /** ---------------- AUDIO ---------------- */
  const audioCapture = useAudioCapture();
  const audioPlayback = useAudioPlayback();

  // Store stable references
  const audioCaptureRef = useRef(audioCapture);
  const audioPlaybackRef = useRef(audioPlayback);

  useEffect(() => {
    audioCaptureRef.current = audioCapture;
    audioPlaybackRef.current = audioPlayback;
  });

  /** ---------------- EVENT HANDLING ---------------- */
  const handleEvent = useCallback(
    (event: ServerEvent) => {
      setEvents((prev) => [...prev, event]);
      if (event.type === "tts_chunk") {
        audioPlaybackRef.current.push(event.audio);
      }
    },
    [], // Remove audioPlayback dependency
  );

  /** ---------------- WEBSOCKET ---------------- */
  useEffect(() => {
    shouldReconnectRef.current = true;

    const connect = () => {
      if (wsRef.current) return;

      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("WS connected");
      };

      ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          handleEvent(event);
        } catch (err) {
          console.error("WS parse error", err);
        }
      };

      ws.onerror = (e) => {
        console.error("WS error", e);
      };

      ws.onclose = () => {
        console.log("WS closed");
        setIsConnected(false);
        wsRef.current = null;

        if (shouldReconnectRef.current) {
          reconnectTimerRef.current = window.setTimeout(connect, 2000);
        }
      };
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      audioCaptureRef.current.stop();
      audioPlaybackRef.current.stop();
    };
  }, [url, handleEvent]); // Remove audioCapture and audioPlayback

  /** ---------------- RECORDING ---------------- */
  const startRecording = useCallback(async () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    await audioCaptureRef.current.start((chunk) => {
      console.log("Audio chunk:", chunk.byteLength);
      if (chunk.byteLength === 0) return;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(chunk);
      }
    });

    setIsRecording(true);
  }, []); // Remove audioCapture dependency

  const stopRecording = useCallback(() => {
    audioCaptureRef.current.stop();
    setIsRecording(false);
  }, []); // Remove audioCapture dependency

  /** ---------------- PUBLIC API ---------------- */
  return {
    isConnected,
    isRecording,
    events,
    startRecording,
    stopRecording,
    clearEvents: () => setEvents([]),
  };
}
