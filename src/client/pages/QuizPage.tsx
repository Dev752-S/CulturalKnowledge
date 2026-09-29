import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Clock, ArrowRight } from 'lucide-react';

export default function QuizPage() {
  const { user, hasTeamName, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/');
      } else if (!hasTeamName) {
        navigate('/team-name');
      }
    }
  }, [user, hasTeamName, isLoading, navigate]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#FFF8EA] flex items-center justify-center text-[#54133F]">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 bg-[#C58A3A] rounded-full animate-ping" />
          <span className="font-cormorant text-xl">Loading Quiz Gate...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-between">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-amber-400 hover:text-amber-300 font-cormorant text-xl">
          ← Back to Cultural Knowledge
        </Link>
        <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
          Round 1 Examination Gate
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-amber-500/30 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold font-cormorant text-white mb-2">Quiz Examination Security Gate</h1>
          <p className="text-slate-400 text-sm mb-6">
            Team: <span className="text-amber-400 font-semibold">{user.teamName || 'Active Team'}</span> · Participant:{' '}
            <span className="text-white font-medium">{user.fullName}</span>
          </p>

          <div className="flex justify-center space-x-6 text-xs text-slate-300 mb-8 py-3 border-y border-slate-800">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>60 Minutes</span>
            </div>
            <div>• 100 Questions</div>
            <div>• Single Device Lock</div>
          </div>

          <button
            type="button"
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform inline-flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Begin Preflight Security Check</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-600">
        SKP Cultural Fest 2026 · Skill Arena Examination System
      </footer>
    </div>
  );
}
