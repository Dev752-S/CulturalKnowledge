import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Award, ArrowRight, Clock, FileText, Lock, AlertCircle } from 'lucide-react';
import CulturalHeader from '../components/landing/CulturalHeader';

interface RoundStatus {
  isActive: boolean;
  name?: string;
  durationMinutes?: number;
  totalQuestions?: number;
}

export default function EventSelectorPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [roundsStatus, setRoundsStatus] = useState<{
    round1: RoundStatus;
    round2: RoundStatus;
  }>({
    round1: { isActive: true, durationMinutes: 60, totalQuestions: 100 },
    round2: { isActive: true, totalQuestions: 50 },
  });

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    async function fetchRounds() {
      try {
        const res = await fetch('/api/v1/quiz/rounds-status');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.round1 && data.round2) {
            setRoundsStatus({
              round1: data.round1,
              round2: data.round2,
            });
          }
        }
      } catch {
        // Fallback to default state
      }
    }

    fetchRounds();
    // Poll every 5 seconds to catch live administrator toggles
    const interval = setInterval(fetchRounds, 5000);
    return () => clearInterval(interval);
  }, []);

  const isR1Active = Boolean(roundsStatus.round1.isActive);
  const isR2Active = Boolean(roundsStatus.round2.isActive);

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-between bg-[#FFF8EA] text-[#4A211C] select-none"
      style={{
        backgroundImage: "url('/assets/cultural_landing_bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background Soft Overlay for contrast */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255, 248, 234, 0.82) 0%, rgba(255, 248, 234, 0.5) 65%, transparent 100%)',
        }}
      />

      {/* Top Header */}
      <div className="relative z-10 w-full">
        <CulturalHeader user={user} onLogout={handleLogout} />
      </div>

      {/* Center Event / Round Selector */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center items-center my-auto w-full">
        <div className="text-center mb-8">
          <h1 className="font-cormorant text-4xl sm:text-5xl font-semibold text-[#54133F] tracking-wide">
            Select Competition Round
          </h1>
        </div>

        {/* Round Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* -------------------------------------------------------- */}
          {/* Round 1 Card — Cultural Quiz */}
          {/* -------------------------------------------------------- */}
          <div
            className={`rounded-[24px] p-7 backdrop-blur-md border transition-all flex flex-col justify-between ${
              isR1Active
                ? 'bg-white/92 border-[#E56A21]/40 shadow-[0_12px_36px_rgba(70,40,25,0.08)] hover:shadow-[0_16px_48px_rgba(229,106,33,0.15)]'
                : 'bg-white/70 border-slate-300 opacity-90 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                {isR1Active ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active Round</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 border border-rose-500/30 uppercase tracking-wider flex items-center space-x-1.5">
                    <Lock className="w-3 h-3 text-rose-600" />
                    <span>Locked · Disabled by Admin</span>
                  </span>
                )}
                <span className="text-xs text-[#7A4232] font-medium flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#E56A21]" />
                  <span>{roundsStatus.round1.durationMinutes || 60} Minutes</span>
                </span>
              </div>

              <h2 className="font-cormorant text-3xl font-semibold text-[#54133F] mb-1">
                Round 1
              </h2>
              <h3 className="font-cormorant text-2xl text-[#E56A21] font-medium mb-3">
                Cultural Quiz
              </h3>

              <p className="font-cormorant text-base text-[#4A211C] leading-relaxed mb-6">
                100 Questions covering Indian Traditional Culture, Vehicle GK, World GK, AI, and Current Affairs.
              </p>

              <div className="flex items-center space-x-4 text-xs text-[#633027] border-t border-[#E8DFD8] pt-4 mb-6">
                <div className="flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-[#E56A21]" />
                  <span>{roundsStatus.round1.totalQuestions || 100} Questions</span>
                </div>
                <div>•</div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-[#E56A21]" />
                  <span>{roundsStatus.round1.durationMinutes || 60} Minutes</span>
                </div>
              </div>
            </div>

            {isR1Active ? (
              <Link
                to="/quiz/round-1"
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#E56A21] via-[#D45917] to-[#54133F] hover:from-[#F07A33] hover:to-[#6E1A52] text-white font-semibold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>SELECT ROUND 1</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div>
                <div className="w-full py-3 px-6 rounded-xl bg-slate-100 border border-slate-300 text-slate-500 font-semibold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 cursor-not-allowed">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>ROUND 1 DISABLED BY ADMIN</span>
                </div>
                <div className="flex items-center justify-center space-x-1 mt-2 text-[11px] text-rose-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Awaiting admin activation. Competitors cannot attend.</span>
                </div>
              </div>
            )}
          </div>

          {/* -------------------------------------------------------- */}
          {/* Round 2 Card — Logo Quiz */}
          {/* -------------------------------------------------------- */}
          <div
            className={`rounded-[24px] p-7 backdrop-blur-md border transition-all flex flex-col justify-between ${
              isR2Active
                ? 'bg-white/92 border-[#E56A21]/40 shadow-[0_12px_36px_rgba(70,40,25,0.08)] hover:shadow-[0_16px_48px_rgba(229,106,33,0.15)]'
                : 'bg-white/70 border-slate-300 opacity-90 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                {isR2Active ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active Round</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 border border-rose-500/30 uppercase tracking-wider flex items-center space-x-1.5">
                    <Lock className="w-3 h-3 text-rose-600" />
                    <span>Locked · Disabled by Admin</span>
                  </span>
                )}
                <span className="text-xs text-[#7A4232] font-medium flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#E56A21]" />
                  <span>30 minutes</span>
                </span>
              </div>

              <h2 className="font-cormorant text-3xl font-semibold text-[#54133F] mb-1">
                Round 2
              </h2>
              <h3 className="font-cormorant text-2xl text-[#E56A21] font-medium mb-3">
                Logo Quiz
              </h3>

              <p className="font-cormorant text-base text-[#4A211C] leading-relaxed mb-6">
                50 Visual Logo Identification Questions. Test your brand knowledge across global tech, tools, and platforms.
              </p>

              <div className="flex items-center space-x-4 text-xs text-[#633027] border-t border-[#E8DFD8] pt-4 mb-6">
                <div className="flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-[#E56A21]" />
                  <span>{roundsStatus.round2.totalQuestions || 50} Questions</span>
                </div>
                <div>•</div>
                <div className="flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-[#E56A21]" />
                  <span>Visual Multiple Choice</span>
                </div>
              </div>
            </div>

            {isR2Active ? (
              <Link
                to="/quiz/round-2"
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#E56A21] via-[#D45917] to-[#54133F] hover:from-[#F07A33] hover:to-[#6E1A52] text-white font-semibold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>SELECT ROUND 2</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div>
                <div className="w-full py-3 px-6 rounded-xl bg-slate-100 border border-slate-300 text-slate-500 font-semibold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 cursor-not-allowed">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>ROUND 2 DISABLED BY ADMIN</span>
                </div>
                <div className="flex items-center justify-center space-x-1 mt-2 text-[11px] text-rose-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Awaiting admin activation. Competitors cannot attend.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="h-6" />
    </div>
  );
}
