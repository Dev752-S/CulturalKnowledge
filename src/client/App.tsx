import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Award, Sparkles, Terminal, CheckCircle2, Server, Database, LogIn, Users } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import TeamNamePage from './pages/TeamNamePage';
import DashboardPage from './pages/DashboardPage';

interface HealthResponse {
  success: boolean;
  status: string;
  timestamp: string;
  version: string;
  service: string;
  checks: {
    database: { status: string; latencyMs?: number };
    redis: { status: string };
  };
}

async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/v1/health');
  if (!res.ok && res.status !== 503) {
    throw new Error('Health check failed');
  }
  return res.json();
}

function HomePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ fullName: string; teamName?: string | null; role: string } | null>(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch('/api/v1/auth/me');
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          // Bypass protection (Section 15): If authenticated participant has no team name, redirect to /team-name
          if (data.user.role === 'participant' && (!data.hasTeamName || !data.user.teamName)) {
            navigate('/team-name');
          }
        }
      } catch {
        // guest visitor
      }
    }
    checkUser();
  }, [navigate]);

  const { data: health, isLoading, isError } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 10000,
  });

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                SKP SKILL ARENA
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                FEST 2026
              </span>
            </div>
          </div>

          {/* System Health Badge */}
          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                isLoading
                  ? 'bg-slate-800/60 border-slate-700 text-slate-400'
                  : isError
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : health?.status === 'healthy'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isLoading
                    ? 'bg-slate-400 animate-pulse'
                    : isError
                    ? 'bg-rose-400'
                    : health?.status === 'healthy'
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="capitalize">
                {isLoading ? 'Checking API...' : isError ? 'API Offline' : `API: ${health?.status}`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-800/40 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Official Competition Portal</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            SKP Cultural Fest <span className="gradient-text">2026</span>
            <br />
            <span className="text-3xl sm:text-5xl font-bold text-slate-200">
              Skill Arena Competition
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            High-integrity gamified competition system featuring a server-authoritative 100-MCQ examination,
            real-time anti-cheat signals, live leaderboard, and auditorium Round 2 Logo Arena.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {currentUser?.teamName ? (
              <div className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold shadow-sm">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Team: <strong className="text-white ml-1">{currentUser.teamName}</strong></span>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Enter Kala Sangamam / Login</span>
              </Link>
            )}
            <Link
              to="/rules"
              className="px-6 py-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
            >
              Competition Rules
            </Link>
            <Link
              to="/schedule"
              className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold text-sm transition-all hover:scale-105 active:scale-95"
            >
              Event Schedule
            </Link>
          </div>
        </div>

        {/* Foundation Status Grid */}
        <div className="mt-20">
          <div className="flex items-center space-x-2 mb-6">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Phase 0 — Core Architecture Verification</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Vercel Serverless & Hono */}
            <div className="glass-panel rounded-2xl p-6 transition-all hover:border-indigo-500/40">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Server className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-medium px-2 py-1 rounded bg-indigo-500/10 text-indigo-300">
                  Node 24 / Hono
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Serverless Backend Engine</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Hono API framework configured with strict Zod validation, security headers, request logging, and unified error responses.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                Operational &amp; Vercel Ready
              </div>
            </div>

            {/* Card 2: Authoritative Database */}
            <div className="glass-panel rounded-2xl p-6 transition-all hover:border-indigo-500/40">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Database className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-medium px-2 py-1 rounded bg-cyan-500/10 text-cyan-300">
                  PostgreSQL / Drizzle
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Authoritative Persistent State</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                18 relational tables generated with Drizzle ORM covering users, attempts, proctor signals, and Logo Arena tiles.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center text-xs text-cyan-400 font-medium">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-cyan-400" />
                Schemas &amp; DDL Migrated
              </div>
            </div>

            {/* Card 3: Security & Proctoring Invariants */}
            <div className="glass-panel rounded-2xl p-6 transition-all hover:border-indigo-500/40">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-medium px-2 py-1 rounded bg-pink-500/10 text-pink-300">
                  Untrusted Client
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Strict Server Authority</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Server-side timers, answer keys withheld from browser, one active session lock, and append-only audit trail.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center text-xs text-pink-400 font-medium">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-pink-400" />
                Security Invariants Enforced
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          <p>© 2026 SKP Cultural Fest. Skill Arena Competition System.</p>
          <p className="mt-1">Production Candidate Architecture — Free-First Serverless</p>
        </div>
      </footer>
    </div>
  );
}

function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium mb-8 inline-block">
        ← Back to Arena Home
      </Link>
      <h1 className="text-3xl font-bold text-white mb-6">Skill Arena Official Competition Rules</h1>
      <div className="space-y-6 text-slate-300 leading-relaxed glass-panel p-8 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white mb-2">Round 1: 100 MCQ Examination</h2>
          <p className="text-sm text-slate-400">
            80-minute server-authoritative timer. 100 randomized questions covering general and technical domains. Answers auto-save in real time.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white mb-2">Anti-Cheat Compliance</h2>
          <p className="text-sm text-slate-400">
            Webcam preflight check required. Fullscreen and active window monitoring signals recorded for proctor review.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white mb-2">Round 2: Top 15 Finalist Logo Arena</h2>
          <p className="text-sm text-slate-400">
            Top 15 qualified contestants advance to the live auditorium competition with 100 logo tiles and instant scoring.
          </p>
        </div>
      </div>
    </div>
  );
}

function SchedulePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium mb-8 inline-block">
        ← Back to Arena Home
      </Link>
      <h1 className="text-3xl font-bold text-white mb-6">SKP Cultural Fest 2026 Schedule</h1>
      <div className="glass-panel p-8 rounded-2xl text-slate-300 space-y-4">
        <div className="flex justify-between border-b border-slate-800 pb-3">
          <span className="font-semibold text-white">Participant Check-in &amp; Preflight</span>
          <span className="text-indigo-400">09:00 AM – 10:00 AM</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-3">
          <span className="font-semibold text-white">Round 1 MCQ Examination (80 mins)</span>
          <span className="text-indigo-400">10:30 AM – 11:50 AM</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-3">
          <span className="font-semibold text-white">Qualification &amp; Top 15 Announcement</span>
          <span className="text-indigo-400">01:30 PM – 02:00 PM</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-white">Round 2 Auditorium Logo Arena</span>
          <span className="text-indigo-400">02:30 PM – 05:00 PM</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/team-name" element={<TeamNamePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
      </Routes>
    </BrowserRouter>
  );
}
