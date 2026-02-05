import { useMemo } from "react";
import { Mic, MicOff, Trash2, Radio, WifiOff } from "lucide-react";
import { useVoiceSession } from "./useWebSocket";
import EventDisplay from "./EventDisplay";

function App() {
  const wsUrl = import.meta.env.VITE_WS_BASE_URL;
  const {
    isConnected,
    isRecording,
    events,
    startRecording,
    stopRecording,
    clearEvents,
  } = useVoiceSession(`${wsUrl}/ws`);

  /**
   * Latest STT transcript (derived from events)
   */
  const currentTranscript = useMemo(() => {
    const lastSttOutput = [...events]
      .reverse()
      .find((e) => e.type === "stt_output");

    return lastSttOutput?.transcript ?? "";
  }, [events]);

  /**
   * Agent response since last STT output (derived from events)
   */
  const agentResponse = useMemo(() => {
    const lastSttIndex = events.map((e) => e.type).lastIndexOf("stt_output");

    if (lastSttIndex === -1) return "";

    return events
      .slice(lastSttIndex + 1)
      .filter((e) => e.type === "agent_chunk")
      .map((e) => e.text)
      .join("");
  }, [events]);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(#00FF41 1px, transparent 1px), linear-gradient(90deg, #00FF41 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Scan line effect */}
      <div className="scan-line fixed inset-0 pointer-events-none opacity-20" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-display font-bold text-deep-purple text-glow mb-2">
                VOICE_AGENT
              </h1>
              <p className="text-sm font-mono text-gray-400">
                Real-time conversational AI pipeline
              </p>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-2 glass-effect px-4 py-2 rounded-full">
              {isConnected ? (
                <>
                  <Radio className="w-4 h-4 text-neon-green animate-pulse" />
                  <span className="text-xs font-mono text-neon-green">
                    ONLINE
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-warm-orange" />
                  <span className="text-xs font-mono text-warm-orange">
                    OFFLINE
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Pipeline visualization */}
          <div className="glass-effect p-4 rounded-lg">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isRecording ? "bg-warm-orange animate-pulse" : "bg-gray-600"
                  }`}
                />
                <span
                  className={
                    isRecording ? "text-warm-orange" : "text-gray-500"
                  }>
                  MIC
                </span>
              </div>

              <div className="text-gray-600">→</div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    currentTranscript
                      ? "bg-electric-blue animate-pulse"
                      : "bg-gray-600"
                  }`}
                />
                <span
                  className={
                    currentTranscript ? "text-electric-blue" : "text-gray-500"
                  }>
                  STT
                </span>
              </div>

              <div className="text-gray-600">→</div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    agentResponse
                      ? "bg-neon-green animate-pulse"
                      : "bg-gray-600"
                  }`}
                />
                <span
                  className={
                    agentResponse ? "text-neon-green" : "text-gray-500"
                  }>
                  AGENT
                </span>
              </div>

              <div className="text-gray-600">→</div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    agentResponse
                      ? "bg-yellow-400 animate-pulse"
                      : "bg-gray-600"
                  }`}
                />
                <span
                  className={
                    agentResponse ? "text-yellow-400" : "text-gray-500"
                  }>
                  TTS
                </span>
              </div>

              <div className="text-gray-600">→</div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    agentResponse
                      ? "bg-purple-400 animate-pulse"
                      : "bg-gray-600"
                  }`}
                />
                <span
                  className={
                    agentResponse ? "text-purple-400" : "text-gray-500"
                  }>
                  SPEAKER
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Controls */}
            <div className="glass-effect p-6 rounded-lg space-y-4">
              <h2 className="text-xl font-display font-bold text-electric-blue mb-4">
                CONTROLS
              </h2>

              <button
                onClick={handleToggleRecording}
                disabled={!isConnected}
                className={`w-full py-6 rounded-lg font-display text-lg font-bold transition-all duration-300 ${
                  isRecording
                    ? "bg-warm-orange hover:bg-orange-600 animate-glow shadow-lg shadow-warm-orange/50"
                    : "bg-neon-green hover:bg-green-400 text-deep-purple"
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3`}>
                {isRecording ? (
                  <>
                    <MicOff className="w-6 h-6" />
                    STOP RECORDING
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" />
                    START RECORDING
                  </>
                )}
              </button>

              <button
                onClick={clearEvents}
                className="w-full py-3 rounded-lg font-display text-sm font-bold bg-red-700 hover:bg-red-900/50 text-white border border-red-800/50 transition-all flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />
                CLEAR HISTORY
              </button>
            </div>

            {/* Transcript */}
            <div className="glass-effect p-6 rounded-lg space-y-3">
              <h3 className="text-sm font-display font-bold text-electric-blue mb-2">
                YOUR SPEECH
              </h3>
              <div className="min-h-[80px] bg-black/30 p-4 rounded-lg border border-electric-blue/30">
                {currentTranscript ? (
                  <p className="text-white/90">
                    &quot;{currentTranscript}&quot;
                  </p>
                ) : (
                  <p className="text-gray-500 italic">
                    Waiting for speech input...
                  </p>
                )}
              </div>
            </div>

            {/* Agent */}
            <div className="glass-effect p-6 rounded-lg space-y-3">
              <h3 className="text-sm font-display font-bold text-neon-green mb-2">
                AGENT RESPONSE
              </h3>
              <div className="min-h-[120px] bg-black/30 p-4 rounded-lg border border-neon-green/30">
                {agentResponse ? (
                  <p className="text-white/90">{agentResponse}</p>
                ) : (
                  <p className="text-gray-500 italic">
                    Agent will respond here...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Event log */}
          <div className="glass-effect p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold text-purple-400">
                EVENT_LOG
              </h2>
              <div className="text-xs font-mono text-gray-500">
                {events.length} events
              </div>
            </div>
            <EventDisplay events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
