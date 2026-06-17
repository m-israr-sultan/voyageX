"use client";

import { useEffect, useState, useRef } from "react";

type ConnState = "online" | "offline" | "slow" | "reconnected";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";
// Lightweight probe — HEAD to the API root; fast, no payload
const PROBE_URL = `${API_BASE}/api/v1/health`;
// 2G round-trip threshold — if ping > 3 s we warn "slow connection"
const SLOW_THRESHOLD_MS = 3_000;
// How often to verify real connectivity (ms)
const PROBE_INTERVAL_MS = 30_000;

async function probeConnectivity(): Promise<"online" | "offline" | "slow"> {
  if (!navigator.onLine) return "offline";
  const t0 = Date.now();
  try {
    await fetch(PROBE_URL, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(6_000) });
    const rtt = Date.now() - t0;
    return rtt > SLOW_THRESHOLD_MS ? "slow" : "online";
  } catch {
    return "offline";
  }
}

export default function OfflineDetector() {
  const [state, setState] = useState<ConnState>("online");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const probe = async () => {
    const result = await probeConnectivity();
    setState((prev) => {
      if (result === "online" && (prev === "offline" || prev === "slow")) return "reconnected";
      if (result === "offline") return "offline";
      if (result === "slow") return "slow";
      return "online";
    });
  };

  useEffect(() => {
    // Initial probe
    probe();

    // Recurring probe — paused when tab is hidden
    const id = setInterval(() => {
      if (document.visibilityState === "visible") probe();
    }, PROBE_INTERVAL_MS);

    const handleOnline = () => probe();
    const handleOffline = () => setState("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(id);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-dismiss "reconnected" banner after 3 s
  useEffect(() => {
    if (state === "reconnected") {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setState("online"), 3_000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [state]);

  if (state === "online") return null;

  const configs: Record<Exclude<ConnState, "online">, { bg: string; text: string; msg: string }> = {
    offline: {
      bg: "bg-red-600",
      text: "text-white",
      msg: "⚠ No internet — changes will retry when you reconnect",
    },
    slow: {
      bg: "bg-amber-500",
      text: "text-white",
      msg: "⚡ Slow connection detected — some requests may be slower",
    },
    reconnected: {
      bg: "bg-green-600",
      text: "text-white",
      msg: "✓ Connection restored",
    },
  };

  const cfg = configs[state];

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] max-w-sm w-[90vw] px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ${cfg.bg} ${cfg.text}`}
      role="status"
      aria-live="polite"
    >
      {cfg.msg}
    </div>
  );
}
