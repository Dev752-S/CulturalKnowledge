import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Award, Users, FileCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CulturalHeader from '../components/landing/CulturalHeader';

interface Round2ResultData {
  attemptId: string;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  submittedAt: string | null;
  teamName: string | null;
  participantName: string;
}

export default function QuizRound2ResultPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<Round2ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await fetch('/api/v1/round2/result');
        const data = await res.json();
        if (data.success && data.result) {
          setResult(data.result);
        } else {
          // No result yet, navigate back to Round 2
          navigate('/quiz/round-2');
        }
      } catch (err) {
        console.error('Failed to load Round 2 result:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadResult();
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8EA] flex items-center justify-center text-[#54133F]">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 bg-[#E56A21] rounded-full animate-ping" />
          <span className="font-cormorant text-xl">Loading Submission Status...</span>
        </div>
      </div>
    );
  }

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
      {/* Background overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255, 248, 234, 0.85) 0%, rgba(255, 248, 234, 0.5) 65%, transparent 100%)',
        }}
      />

      <div className="relative z-10 w-full">
        <CulturalHeader user={user} onLogout={handleLogout} />
      </div>

      <main className="relative z-10 flex-1 max-w-xl mx-auto px-4 py-8 flex flex-col justify-center items-center my-auto w-full">
        <div className="w-full bg-white/95 backdrop-blur-md rounded-[28px] p-8 sm:p-10 border border-white/80 shadow-[0_16px_50px_rgba(84,19,63,0.12)] text-center animate-in zoom-in-95 duration-300">
          {/* Award Icon */}
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#E56A21] via-[#D45917] to-[#54133F] text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#E56A21]/20">
            <Award className="w-8 h-8 text-[#FFF8EA]" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider inline-flex items-center space-x-1 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Submission Successful</span>
          </span>

          <h1 className="font-cormorant text-4xl sm:text-5xl font-bold text-[#54133F] mb-2">
            Round 2 Completed
          </h1>
          <p className="text-xs sm:text-sm text-[#7A4232] mb-6 leading-relaxed max-w-md mx-auto">
            Your responses have been submitted successfully. Thank you for participating in the Logo Quiz.
          </p>

          {/* Team and Candidate Info */}
          <div className="flex items-center justify-center space-x-6 text-xs text-[#54133F] font-semibold py-3 border-y border-[#E8DFD8] mb-6">
            <div className="flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-[#E56A21]" />
              <span>{result?.teamName || user?.teamName || 'Team Vibes'}</span>
            </div>
            <div>•</div>
            <div>{result?.participantName || user?.fullName || 'Participant'}</div>
          </div>

          {/* Submission Details Card (NO SCORE, NO MARKS) */}
          <div className="bg-[#FFF8EA] rounded-2xl p-5 border border-[#C58A3A]/30 mb-6 flex items-center justify-between text-left">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#8A6D65] uppercase tracking-wider font-semibold">Response Status</p>
                <p className="text-sm font-bold text-[#54133F]">All Answers Recorded</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E8DFD8] text-xs font-bold text-[#54133F]">
                50 Questions
              </span>
            </div>
          </div>

          {/* Counts breakdown */}
          <div className="grid grid-cols-2 gap-3 text-xs mb-8">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[#8A6D65] block">Questions Answered</span>
              <span className="font-bold text-base text-[#3E231C]">{result?.answeredCount ?? 0} / 50</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[#8A6D65] block">Not Answered</span>
              <span className="font-bold text-base text-[#3E231C]">{result?.unansweredCount ?? 0}</span>
            </div>
          </div>

          {/* Return Navigation */}
          <div className="space-y-3">
            <Link
              to="/events"
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#E56A21] via-[#D45917] to-[#54133F] hover:from-[#F07A33] hover:to-[#6E1A52] text-white font-semibold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Back to Competition Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/"
              className="w-full py-2.5 px-6 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs sm:text-sm font-semibold transition-colors block text-center cursor-pointer"
            >
              Return to Arena Home
            </Link>
          </div>
        </div>
      </main>

      <div className="h-6" />
    </div>
  );
}
