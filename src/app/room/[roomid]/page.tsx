"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function formatTimeReamining(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString()}:${secs.toString().padStart(2, "0")}`;
}

export default function Page() {
  const params = useParams() as { roomId?: string };
  const paramRoomId = params.roomId;
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [roomId, setRoomId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(10);

  useEffect(() => {
    if (paramRoomId) {
      setRoomId(paramRoomId);
      return;
    }

    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const segments = path.split("/").filter(Boolean);
      const last = segments[segments.length - 1] ?? "";
      if (
        segments.length >= 2 &&
        segments[segments.length - 2] === "room" &&
        last
      ) {
        setRoomId(last);
      }
    }
  }, [paramRoomId]);

  useEffect(() => {
    if (timeRemaining === null) return;
    if (timeRemaining <= 0) {
      setTimeRemaining(null);
      return;
    }
    const id = window.setTimeout(
      () => setTimeRemaining((t) => (t !== null ? t - 1 : null)),
      1000
    );
    return () => clearTimeout(id);
  }, [timeRemaining]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async (): Promise<void> => {
    const textToCopy =
      typeof window !== "undefined" && window.location?.href
        ? window.location.href
        : roomId;
    if (!textToCopy) return;

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        return;
      } catch {
        // fallback
      }
    }

    const ta = document.createElement("textarea");
    ta.value = textToCopy;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      setCopied(true);
    } finally {
      document.body.removeChild(ta);
    }
  };

  return (
    <main className="flex flex-col h-screen max-h-screen overflow-hidden bg-zinc-900 text-white">
      <header className="border-b border-zinc-800 p-4 flex items-center justify-between bg-zinc-900/30">
        <div className="flex-col">
          <span className="text-xs text-zinc-500 uppercase">Room Id</span>
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-green-500 break-words select-all"
              title={roomId || ""}
            >
              {roomId || "—"}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!roomId}
              aria-label="Copy room link"
              className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-zinc-300 hover:text-zinc-200 transition-colors disabled:opacity-50"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <div className="h-8 w-px bg-zinc-800" />
        <div className="flex flex-col">
          <span className="text-xs text-zinc-500">Self Destruct</span>
          <span
            className={`text-sm font-bold flex items-center gap-2 ${
              timeRemaining !== null && timeRemaining < 60
                ? "text-red-500"
                : "text-yellow-500"
            }`}
          >
            {timeRemaining !== null
              ? formatTimeReamining(timeRemaining)
              : "---:--"}
          </span>
        </div>
        <button className="text-xs bg-zinc-800 hover:bg-red-600 px-3 py-1.5 rounded text-zinc-400 hover:text-white font-bold transition-all group flex items-center gap-2 disabled:opacity-50">
          <span className="group-hover:animate-pulse">*</span>
          KILL NOW
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"></div>

      <div className="flex gap-4 p-4 border-t border-zinc-800 bg-zinc-900/10">
        <div className="flex-1 relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 animate-pulse">
            {">"}
          </span>
          <input
            ref={inputRef}
            autoFocus
            type="text"
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                inputRef.current?.focus();
              }
            }}
            placeholder="Type message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-black border border-zinc-800 focus:border-zinc-700 focus:outline-none transition-colors text-zinc-100 placeholder:text-zinc-700 py-3 pl-8 pr-4 text-sm"
          />
        </div>
        <button className="bg-zinc-800 text-zinc-400 px-6 text-sm font-bold hover:text-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
          SEND
        </button>
      </div>
    </main>
  );
}
