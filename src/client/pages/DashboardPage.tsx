import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Clock, Award, LogOut, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/v1/auth/me');
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          // If not logged in, redirect to login page
          navigate('/login');
        }
      } catch (err) {
        console.error('Failed to load user:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [navigate]);

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-300">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-ping" />
          <span>Verifying secure session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-200 via-slate-100 to-slate-300 bg-clip-text text-transparent font-cormorant text-2xl">
                Kala Sangamam
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Skill Arena 2026
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-200">{user?.fullName}</p>
              <p className="text-xs text-amber-400 capitalize">{user?.role} Session Active</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center space-x-1.5 text-xs font-medium"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        {/* Welcome Banner */}
        <div className="glass-panel p-8 rounded-3xl mb-8 relative overflow-hidden border border-amber-500/20">
          <div className="relative z-10">
            <span className="text-xs font-semibold tracking-widest text-amber-400 uppercase">
              Authenticated Competition Portal
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-3">
              Welcome, {user?.fullName}!
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              You are signed in for the <span className="text-amber-300 font-medium">SKP Cultural Fest 2026 Skill Arena</span>.
              Round 1 is an 80-minute, 100-question examination governed by server-authoritative timings and strict proctoring compliance.
            </p>
          </div>
        </div>

        {/* Examination Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-panel p-8 rounded-3xl border border-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                Round 1 — Examination
              </span>
              <div className="flex items-center text-xs text-slate-400 space-x-1">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>80 Minutes</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">General &amp; Technical MCQ Arena</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              100 randomized questions. Answers automatically persist in real time with server-authoritative scoring.
            </p>

            <div className="space-y-2 mb-8">
              <div className="flex items-center text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2" />
                <span>Single active device enforcement enabled</span>
              </div>
              <div className="flex items-center text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2" />
                <span>Server-side timer with reconnect tolerance</span>
              </div>
              <div className="flex items-center text-xs text-slate-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 mr-2" />
                <span>Strict examination mode (tab switch, focus loss recorded)</span>
              </div>
            </div>

            <Link
              to="/quiz"
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <span>Enter Security Start Gate</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Rules Sidebar */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 mb-4">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Security Checklist</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-3 leading-relaxed">
                <li>• Single browser tab only</li>
                <li>• No secondary displays / monitors</li>
                <li>• No AI assistance (ChatGPT, Claude, Gemini, etc.)</li>
                <li>• Fullscreen examination required</li>
                <li>• Webcam stream active during exam</li>
              </ul>
            </div>

            <div className="pt-6 border-t border-slate-800/80">
              <Link to="/rules" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                View Full Competition Rules →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>© 2026 SKP Cultural Fest. Skill Arena Examination System.</p>
      </footer>
    </div>
  );
}
