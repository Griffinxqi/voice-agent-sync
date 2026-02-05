import React, { type JSX } from "react";
import {
  Activity,
  MessageSquare,
  Volume2,
  Wrench,
  CheckCircle,
} from "lucide-react";
import type { ServerEvent } from "./types";

type AgentChunkEvent = Extract<ServerEvent, { type: "agent_chunk" }>;

interface EventDisplayProps {
  events: ServerEvent[];
}

const EventDisplay: React.FC<EventDisplayProps> = ({ events }) => {
  const getEventIcon = (type: ServerEvent["type"]): JSX.Element => {
    switch (type) {
      case "stt_chunk":
      case "stt_output":
        return <MessageSquare className="w-4 h-4" />;
      case "agent_chunk":
        return <Activity className="w-4 h-4" />;
      case "tool_call":
        return <Wrench className="w-4 h-4" />;
      case "tool_result":
        return <CheckCircle className="w-4 h-4" />;
      case "tts_chunk":
        return <Volume2 className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: ServerEvent["type"]): string => {
    switch (type) {
      case "stt_chunk":
      case "stt_output":
        return "text-electric-blue";
      case "agent_chunk":
        return "text-neon-green";
      case "tool_call":
        return "text-purple-400";
      case "tool_result":
        return "text-pink-400";
      case "tts_chunk":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const formatEventContent = (event: ServerEvent): JSX.Element => {
    switch (event.type) {
      case "stt_chunk":
        return (
          <div>
            <div className="text-xs opacity-60 mb-1">Partial Transcript</div>
            <div className="text-sm italic">&quot;{event.transcript}&quot;</div>
          </div>
        );

      case "stt_output":
        return (
          <div>
            <div className="text-xs opacity-60 mb-1">Final Transcript</div>
            <div className="text-sm font-medium">
              &quot;{event.transcript}&quot;
            </div>
          </div>
        );

      case "agent_chunk":
        return (
          <div>
            <div className="text-xs opacity-60 mb-1">Agent Response</div>
            <div className="text-sm whitespace-pre-wrap">{event.text}</div>
          </div>
        );

      case "tool_call":
        return (
          <div>
            <div className="text-xs opacity-60 mb-1">
              Tool Call: {event.name}
            </div>
            <pre className="text-xs font-mono bg-black/30 p-2 rounded mt-1 overflow-x-auto">
              {JSON.stringify(event.args, null, 2)}
            </pre>
          </div>
        );

      case "tool_result":
        return (
          <div>
            <div className="text-xs opacity-60 mb-1">
              Tool Result: {event.name}
            </div>
            <div className="text-sm whitespace-pre-wrap">{event.result}</div>
          </div>
        );

      case "tts_chunk":
        return <div className="text-xs opacity-60">Audio chunk received</div>;
    }
  };

  const formatTime = (ts: number): string =>
    new Date(ts).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });

  /** 🔹 Group consecutive agent_chunk events (FIXED) */
  const groupedEvents: ServerEvent[] = [];
  let currentAgentChunk: AgentChunkEvent | null = null;

  for (const event of events) {
    if (event.type === "agent_chunk") {
      if (currentAgentChunk) {
        currentAgentChunk = {
          ...currentAgentChunk,
          text: currentAgentChunk.text + event.text,
          ts: event.ts,
        } as AgentChunkEvent;
      } else {
        currentAgentChunk = event;
      }
    } else {
      if (currentAgentChunk) {
        groupedEvents.push(currentAgentChunk);
        currentAgentChunk = null;
      }
      groupedEvents.push(event);
    }
  }

  if (currentAgentChunk) {
    groupedEvents.push(currentAgentChunk);
  }

  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
      {groupedEvents.map((event, index) => (
        <div
          key={`${event.type}-${event.ts}-${index}`}
          className="glass-effect p-3 rounded-lg animate-slide-up"
          style={{ animationDelay: `${index * 0.05}s` }}>
          <div className="flex items-start gap-3">
            <div className={`mt-1 ${getEventColor(event.type)}`}>
              {getEventIcon(event.type)}
            </div>

            <div className="flex-1 min-w-0">{formatEventContent(event)}</div>

            <div className="text-[10px] opacity-40 font-mono shrink-0">
              {formatTime(event.ts)}
            </div>
          </div>
        </div>
      ))}

      {groupedEvents.length === 0 && (
        <div className="text-center py-12 opacity-40">
          <Activity className="w-12 h-12 mx-auto mb-3 animate-pulse" />
          <p className="text-sm">Waiting for interaction…</p>
        </div>
      )}
    </div>
  );
};

export default EventDisplay;
