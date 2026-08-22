"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// CHECKPOINT DATA — Fill in details when ready
// ─────────────────────────────────────────────────────────────────────────────
const checkpoints = [
  {
    number: 1,
    title: "Checkpoint 1",
    deadline: "TBD", // TODO: Fill in deadline e.g. "Aug 30, 2025 · 10:00 AM"
    description:
      "Details about Checkpoint 1 will be updated here. Stay tuned for the requirements and evaluation criteria.", // TODO: Fill in description
    icon: "flag",
  },
  {
    number: 2,
    title: "Checkpoint 2",
    deadline: "TBD", // TODO: Fill in deadline
    description:
      "Details about Checkpoint 2 will be updated here. Stay tuned for the requirements and evaluation criteria.", // TODO: Fill in description
    icon: "rocket_launch",
  },
  {
    number: 3,
    title: "Checkpoint 3 — Final",
    deadline: "TBD", // TODO: Fill in deadline
    description:
      "The grand finale! Details about the final checkpoint will be updated here. Prepare to present your complete solution.", // TODO: Fill in description
    icon: "emoji_events",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TIMER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function LiveTimer() {
  const [timerState, setTimerState] = useState<{
    status: "idle" | "running" | "stopped";
    startTime: number | null;
    elapsed: number;
  }>({ status: "idle", startTime: null, elapsed: 0 });

  const [display, setDisplay] = useState({ h: "00", m: "00", s: "00" });
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Format seconds → HH MM SS
  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return {
      h: String(h).padStart(2, "0"),
      m: String(m).padStart(2, "0"),
      s: String(s).padStart(2, "0"),
    };
  };

  // Fetch timer state from API
  const fetchTimer = useCallback(async () => {
    try {
      const res = await fetch("/api/sih-timer");
      if (!res.ok) return;
      const data = await res.json();
      setTimerState((prev) => {
        // Only update if something changed
        if (
          prev.status !== data.status ||
          prev.startTime !== data.startTime
        ) {
          return {
            status: data.status,
            startTime: data.startTime,
            elapsed: data.elapsed ?? 0,
          };
        }
        return prev;
      });
    } catch {
      // silent fail — timer will continue with last known state
    }
  }, []);

  // Tick the running timer
  useEffect(() => {
    if (timerState.status === "running" && timerState.startTime) {
      const tick = () => {
        const elapsed = Math.floor((Date.now() - timerState.startTime!) / 1000);
        setDisplay(formatTime(elapsed));
      };
      tick(); // immediate first tick
      intervalRef.current = setInterval(tick, 1000);
    } else if (timerState.status === "stopped") {
      setDisplay(formatTime(timerState.elapsed));
    } else {
      setDisplay({ h: "00", m: "00", s: "00" });
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState]);

  // Poll API every 10 seconds to sync across viewers
  useEffect(() => {
    fetchTimer(); // initial fetch
    pollRef.current = setInterval(fetchTimer, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchTimer]);

  // Admin action
  const adminAction = async (action: "start" | "stop" | "reset") => {
    if (!adminKey.trim()) {
      setAdminError("Admin key required");
      return;
    }
    setAdminLoading(true);
    setAdminError("");
    try {
      const res = await fetch("/api/sih-timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminKey }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAdminError(data.error || "Action failed");
      } else {
        await fetchTimer(); // immediate refresh
      }
    } catch {
      setAdminError("Network error");
    } finally {
      setAdminLoading(false);
    }
  };

  const isRunning = timerState.status === "running";

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Timer Display */}
      <div className="relative">
        {/* Glow backing */}
        {isRunning && (
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
        )}
        <div className="relative bg-surface-card border-2 border-primary/40 px-8 py-6 flex flex-col items-center gap-4">
          {/* LIVE badge */}
          <div className="flex items-center gap-2">
            {isRunning ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full bg-primary opacity-75 rounded-full" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                </span>
                <span className="text-primary font-pixel text-xl tracking-widest uppercase">
                  Live
                </span>
              </>
            ) : timerState.status === "stopped" ? (
              <span className="text-yellow-400 font-pixel text-xl tracking-widest uppercase">
                Paused
              </span>
            ) : (
              <span className="text-white/40 font-pixel text-xl tracking-widest uppercase">
                Awaiting Start
              </span>
            )}
          </div>

          {/* HH : MM : SS */}
          <div className="flex items-center gap-2 md:gap-4">
            {[
              { val: display.h, label: "HRS" },
              { val: ":", label: "" },
              { val: display.m, label: "MIN" },
              { val: ":", label: "" },
              { val: display.s, label: "SEC" },
            ].map((seg, i) =>
              seg.label === "" ? (
                <span
                  key={i}
                  className="text-5xl md:text-8xl font-pixel text-primary/70 leading-none"
                >
                  :
                </span>
              ) : (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-5xl md:text-8xl font-pixel text-text-main leading-none tabular-nums">
                    {seg.val}
                  </span>
                  <span className="text-xs font-pixel text-white/30 tracking-widest mt-1">
                    {seg.label}
                  </span>
                </div>
              )
            )}
          </div>

          {/* 36 HRS total indicator */}
          {isRunning && (
            <p className="text-white/30 font-pixel text-lg tracking-widest">
              / 36:00:00 Total
            </p>
          )}
        </div>
      </div>

      {/* Admin Panel Toggle — hidden by default, revealed with triple-click on timer label */}
      <button
        className="text-white/10 font-pixel text-xs hover:text-white/30 transition-colors select-none"
        onClick={() => setShowAdmin((v) => !v)}
      >
        {showAdmin ? "▲ Hide Admin" : "▼ Admin Controls"}
      </button>

      {showAdmin && (
        <div className="bg-surface-card border border-white/10 p-4 flex flex-col gap-3 w-full max-w-sm">
          <p className="text-white/40 font-pixel text-sm uppercase tracking-wider">
            Admin Panel — SIH Timer
          </p>
          <input
            type="password"
            placeholder="Admin Key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="bg-background-main border border-white/20 text-text-main font-pixel px-3 py-2 text-lg focus:outline-none focus:border-primary"
          />
          {adminError && (
            <p className="text-red-400 font-pixel text-sm">{adminError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => adminAction("start")}
              disabled={adminLoading || isRunning}
              className="flex-1 py-2 bg-primary text-white font-pixel text-lg uppercase tracking-widest hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {adminLoading ? "..." : "Start"}
            </button>
            <button
              onClick={() => adminAction("stop")}
              disabled={adminLoading || !isRunning}
              className="flex-1 py-2 bg-yellow-500 text-black font-pixel text-lg uppercase tracking-widest hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {adminLoading ? "..." : "Stop"}
            </button>
            <button
              onClick={() => adminAction("reset")}
              disabled={adminLoading}
              className="flex-1 py-2 bg-surface-card border border-white/20 text-white font-pixel text-lg uppercase tracking-widest hover:border-red-500 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {adminLoading ? "..." : "Reset"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function SIHPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow relative w-full bg-background-main text-text-main font-pixel min-h-screen">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[image:var(--bg-grid-radial)] bg-[size:32px_32px] pointer-events-none opacity-20 fixed" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none fixed" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none fixed" />

        <div className="relative z-10 max-w-[1280px] mx-auto px-6 py-12 lg:py-20 flex flex-col gap-24">

          {/* ── HERO ─────────────────────────────────────────────────────── */}
          <section className="flex flex-col items-center text-center pt-8 gap-6">
            {/* SIH × IG badge */}
            <div className="inline-flex items-center gap-3 px-4 py-1 border border-secondary/60 bg-surface-card/80 backdrop-blur-sm shadow-[0_0_20px_rgba(215,38,255,0.15)]">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-sm bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-sm h-3 w-3 bg-secondary" />
              </span>
              <span className="text-xl font-pixel tracking-widest uppercase text-white">
                SIH × Innovation Garage
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-7xl font-pixel font-bold leading-tight text-text-main uppercase">
              IGnite<span className="text-primary">36</span>{" "}
              <span className="text-secondary">Hackathon</span>
              <br />
              <span className="text-3xl md:text-5xl text-white/60">2025 [SIH]</span>
            </h1>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-white/60 font-pixel max-w-3xl leading-relaxed">
              Are you passionate about startups and solving real world problems?
              <br />
              <span className="text-text-main">
                Then this hackathon is the event you&apos;ve been waiting for!
              </span>
            </p>

            {/* Description */}
            <div className="max-w-2xl text-center">
              <p className="text-white/50 font-pixel text-lg leading-relaxed mb-4">
                Register for IG&apos;s{" "}
                <span className="text-primary">36 Hour-Hackathon</span> in
                collaboration with{" "}
                <span className="text-secondary">
                  Smart India Hackathon (SIH) 2025!
                </span>
              </p>
              <p className="text-white/40 font-pixel text-lg leading-relaxed">
                Brainstorm, build, and present game-changing solutions to
                some of the country&apos;s biggest challenges. Your idea might
                just be the next big breakthrough.
              </p>
            </div>

            {/* SIH Portal link */}
            <a
              href="https://sih.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xl text-cyber-lavender hover:text-secondary transition-colors border-b border-cyber-lavender/30 hover:border-secondary pb-0.5 font-pixel"
            >
              <span className="material-symbols-outlined text-xl">open_in_new</span>
              SIH Official Portal — Themes &amp; Problem Statements
            </a>

            {/* Register Now CTA */}
            <div className="mt-4">
              <Link
                href="/sih/register"
                className="group relative inline-flex items-center gap-3 bg-primary text-white font-pixel text-2xl md:text-3xl uppercase tracking-widest px-10 py-5 hover:bg-primary/90 transition-all duration-200 shadow-[6px_6px_0px_0px_rgba(215,38,255,0.6)] hover:shadow-[8px_8px_0px_0px_rgba(215,38,255,0.8)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-0 active:translate-y-0"
              >
                <span className="material-symbols-outlined text-3xl">how_to_reg</span>
                Register Now
                <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
              <p className="text-white/30 font-pixel text-sm mt-3 tracking-wider">
                NITW Students Only · Teams of 2–6
              </p>
            </div>
          </section>

          {/* ── LIVE TIMER ───────────────────────────────────────────────── */}
          <section className="flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-3xl md:text-5xl font-pixel text-text-main uppercase tracking-widest">
                Hackathon Timer
              </h2>
              <div className="h-1 w-32 bg-gradient-to-r from-secondary via-white to-primary" />
              <p className="text-white/40 font-pixel text-xl">
                36 Hours of Pure Innovation
              </p>
            </div>
            <LiveTimer />
          </section>

          {/* ── CHECKPOINTS ──────────────────────────────────────────────── */}
          <section className="flex flex-col items-center gap-12">
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-3xl md:text-5xl font-pixel text-text-main uppercase tracking-widest">
                Checkpoints
              </h2>
              <div className="h-1 w-32 bg-gradient-to-r from-primary via-white to-secondary" />
              <p className="text-white/40 font-pixel text-xl max-w-xl">
                Three milestones. Three chances to prove your team&apos;s worth.
                Details for each checkpoint will be announced soon.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {checkpoints.map((cp, idx) => (
                <div
                  key={idx}
                  className="group relative bg-surface-card border-2 border-white/10 p-6 flex flex-col gap-4 hover:border-primary transition-all duration-300 hover:shadow-[6px_6px_0px_0px_rgba(255,106,0,0.4)]"
                >
                  {/* Number badge */}
                  <div className="absolute -top-4 left-6 bg-primary px-3 py-0.5">
                    <span className="text-white font-pixel text-lg uppercase tracking-widest">
                      0{cp.number}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="material-symbols-outlined text-4xl text-primary">
                      {cp.icon}
                    </span>
                    <h3 className="text-2xl font-pixel text-text-main uppercase">
                      {cp.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-white/50 font-pixel text-lg leading-relaxed flex-1">
                    {cp.description}
                  </p>

                  {/* Deadline */}
                  <div className="flex items-center gap-2 border-t border-white/10 pt-4">
                    <span className="material-symbols-outlined text-xl text-secondary">
                      schedule
                    </span>
                    <span className="font-pixel text-lg uppercase tracking-wider">
                      <span className="text-white/40">Deadline: </span>
                      <span
                        className={
                          cp.deadline === "TBD"
                            ? "text-white/30"
                            : "text-secondary"
                        }
                      >
                        {cp.deadline}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Vertical timeline connector (decorative) */}
            <div className="hidden md:flex items-center gap-0 w-full max-w-4xl justify-center -mt-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="w-4 h-4 bg-primary rounded-full shrink-0" />
                  {i < 2 && (
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-primary to-secondary" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── GUIDELINES ───────────────────────────────────────────────── */}
          <section className="flex flex-col gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-3xl md:text-5xl font-pixel text-text-main uppercase tracking-widest">
                Guidelines
              </h2>
              <div className="h-1 w-32 bg-gradient-to-r from-secondary via-white to-primary" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: "group",
                  title: "Team Composition",
                  points: [
                    "6 members per team, with the designated Team Leader acting as the primary point of contact.",
                    "At least one female member is mandatory for every participating team.",
                    "All members must be regular, full-time NITW students; inter-institute teams are strictly prohibited.",
                    "Mandatory presence of all team members is required at every checkpoint; unexcused absences will result in point deductions or disqualification.",
                  ],
                },
                {
                  icon: "lightbulb",
                  title: "Problem Statements",
                  points: [
                    "Choose up to 2 official SIH Problem Statements directly from sih.gov.in.",
                    "Select problem statements that strictly align with your team's core technical expertise.",
                    "Scope your solution to deliver a working end-to-end prototype within the event timeframe.",
                  ],
                },
                {
                  icon: "engineering",
                  title: "Track & Hardware Requirements",
                  points: [
                    "Teams may enter Software or Hardware tracks based on the technical needs of their chosen PS (multidisciplinary teams are encouraged for Hardware).",
                    "Hardware teams must submit an itemized Bill of Materials (BOM) PDF listing every component alongside its exact cost.",
                    "Hardware component costs must be kept as low as possible; budget optimization directly impacts your technical evaluation score.",
                    "All issued hardware tools, microcontrollers, and sensors must be returned in working condition post-evaluation or face financial penalties.",
                  ],
                },
                {
                  icon: "verified",
                  title: "Evaluation, Code Integrity & Rules",
                  points: [
                    "Checkpoints are formal elimination rounds; unresponsiveness, casual behavior, or failing to act on mentor feedback leads to immediate disqualification.",
                    "AI tools are allowed, but the team as a whole must be able to explain any chunk of code on demand.",
                    "Code must be continuously pushed to a public GitHub/GitLab repository; a single bulk commit at the end will trigger a plagiarism investigation.",
                    "Teams must be demo-ready the instant evaluators arrive at their station, and all decisions made by the evaluation panel are final and non-negotiable.",
                  ],
                },
              ].map((section, i) => (
                <div
                  key={i}
                  className="bg-surface-card border-2 border-white/10 p-6 hover:border-secondary/40 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-3xl text-secondary">
                      {section.icon}
                    </span>
                    <h3 className="text-2xl font-pixel text-text-main uppercase">
                      {section.title}
                    </h3>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {section.points.map((pt, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary text-xl mt-0.5 shrink-0">
                          chevron_right
                        </span>
                        <span className="text-white/60 font-pixel text-lg leading-snug">
                          {pt}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── BOTTOM CTA ───────────────────────────────────────────────── */}
          <section className="flex flex-col items-center gap-6 pb-8">
            <div className="bg-surface-card border-2 border-primary/30 p-10 flex flex-col items-center gap-6 text-center w-full max-w-3xl relative overflow-hidden">
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary" />

              <p className="text-4xl font-pixel text-text-main uppercase">
                Ready. Get Set.{" "}
                <span className="text-primary">Innovate!</span>
              </p>
              <p className="text-white/50 font-pixel text-xl max-w-lg leading-relaxed">
                IG&apos;s bringing the challenge <em>and</em> the goodies. 36 hours of
                pure innovation and creativity.
              </p>
              <Link
                href="/sih/register"
                className="group inline-flex items-center gap-3 bg-primary text-white font-pixel text-2xl uppercase tracking-widest px-8 py-4 hover:bg-primary/90 transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(215,38,255,0.6)] hover:shadow-[6px_6px_0px_0px_rgba(215,38,255,0.8)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
              >
                Register Your Team
                <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
