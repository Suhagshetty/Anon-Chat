"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const params = useParams() as { roomId?: string };
  const paramRoomId = params.roomId;
  const [roomId, setRoomId] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (paramRoomId) {
      setRoomId(paramRoomId);
      return;
    }

    if (typeof window !== "undefined") {
      const path = window.location.pathname; // e.g. /room/H546VIR0UVRI8to5q41Zi
      const segments = path.split("/").filter(Boolean);
      const last = segments[segments.length - 1] ?? "";
      // only accept it if previous segment is "room"
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
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
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
        // fallthrough to legacy fallback
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
      </header>
    </main>
  );
}
