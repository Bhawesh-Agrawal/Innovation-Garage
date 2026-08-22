import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Timer State (in-memory — survives serverless warm instances)
// For production reliability, this is stored in your Google Sheet "Config" tab
// via the GAS script. The in-memory cache reduces Sheet API calls.
// ─────────────────────────────────────────────────────────────────────────────
let cachedState: {
  status: "idle" | "running" | "stopped";
  startTime: number | null;
  elapsed: number;
} = { status: "idle", startTime: null, elapsed: 0 };

let lastFetch = 0;
const CACHE_TTL = 8000; // 8 seconds — don't hammer the GAS endpoint

const GAS_URL = process.env.GOOGLE_SCRIPT_URL; // Google Apps Script web app URL
const ADMIN_KEY = process.env.SIH_ADMIN_KEY || "ig-admin-2025"; // set in Vercel env vars

// ─────────────────────────────────────────────────────────────────────────────
// GET — Return timer state (used by the SIH page to display timer)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  const now = Date.now();

  // Use cache if fresh enough
  if (now - lastFetch < CACHE_TTL) {
    return NextResponse.json(cachedState);
  }

  // Fetch from GAS (Google Sheet Config tab)
  try {
    if (GAS_URL) {
      const res = await fetch(
        `${GAS_URL}?action=getTimerState`,
        { next: { revalidate: 0 } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.status) {
          cachedState = {
            status: data.status,
            startTime: data.startTime ?? null,
            elapsed: data.elapsed ?? 0,
          };
          lastFetch = now;
        }
      }
    }
  } catch {
    // Return cached/default state on error
  }

  return NextResponse.json(cachedState);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Admin control (start / stop / reset)
// Body: { action: "start" | "stop" | "reset", adminKey: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, adminKey } = body;

    // Validate admin key
    if (!adminKey || adminKey !== ADMIN_KEY) {
      return NextResponse.json(
        { error: "Unauthorized — invalid admin key" },
        { status: 401 }
      );
    }

    // Validate action
    if (!["start", "stop", "reset"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const now = Date.now();

    // Compute new state
    let newState: typeof cachedState;
    if (action === "start") {
      if (cachedState.status === "running") {
        return NextResponse.json({ error: "Timer already running" }, { status: 400 });
      }
      newState = {
        status: "running",
        startTime: now - cachedState.elapsed * 1000, // resume from paused point
        elapsed: cachedState.elapsed,
      };
    } else if (action === "stop") {
      if (cachedState.status !== "running") {
        return NextResponse.json({ error: "Timer not running" }, { status: 400 });
      }
      const elapsed = Math.floor((now - (cachedState.startTime ?? now)) / 1000);
      newState = { status: "stopped", startTime: null, elapsed };
    } else {
      // reset
      newState = { status: "idle", startTime: null, elapsed: 0 };
    }

    // Persist to Google Sheet via GAS
    if (GAS_URL) {
      try {
        await fetch(GAS_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "setTimerState",
            timerStatus: newState.status,
            timerStartTime: newState.startTime,
            timerElapsed: newState.elapsed,
          }),
        });
      } catch {
        // GAS write failed — still update in-memory cache
      }
    }

    // Update cache
    cachedState = newState;
    lastFetch = now;

    return NextResponse.json({ success: true, state: newState });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
