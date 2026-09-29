import { useState } from 'react';
import { ShieldCheck, Maximize, AlertCircle, ArrowRight, Clock, FileText, Ban } from 'lucide-react';

interface QuizRound2PreflightProps {
  onStartQuiz: (useCamera?: boolean) => Promise<void>;
  teamName: string;
  participantName: string;
  isRoundLocked?: boolean;
  cardFlipDurationSeconds?: number;
  overallDurationMinutes?: number;
}

export default function QuizRound2Preflight({
  onStartQuiz,
  teamName,
  participantName,
  isRoundLocked = false,
  cardFlipDurationSeconds = 5,
  overallDurationMinutes = 30,
}: QuizRound2PreflightProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStart = async () => {
    if (isRoundLocked) return;
    setIsStarting(true);
    setErrorMsg(null);
    try {
      await onStartQuiz(false);
    } catch (err: any) {
      console.error('Round 2 start error:', err);
      setErrorMsg(err.message || 'Unable to start Round 2 session. Please try again.');
      setIsStarting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-auto p-6 sm:p-8 rounded-[28px] bg-white/95 backdrop-blur-md border border-[#E56A21]/30 shadow-[0_16px_50px_rgba(84,19,63,0.12)] text-[#3E231C] select-none">
      {/* Header */}
      <div className="text-center pb-6 border-b border-[#E8DFD8]">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#54133F]/10 text-[#54133F] text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Official Competition Gate</span>
        </div>
        <h1 className="font-cormorant text-3xl sm:text-4xl font-bold text-[#54133F]">
          Round 2 — Logo Quiz (Flip-Card Arena)
        </h1>
        <p className="text-xs sm:text-sm text-[#7A4232] mt-1">
          Team: <span className="font-semibold text-[#54133F]">{teamName}</span> · Candidate:{' '}
          <span className="font-semibold text-[#54133F]">{participantName}</span>
        </p>

        {/* Highlights */}
        <div className="flex items-center justify-center space-x-6 mt-4 text-xs font-medium text-[#633027]">
          <div className="flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-[#E56A21]" />
            <span>50 Questions</span>
          </div>
          <div>•</div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-[#E56A21]" />
            <span>{overallDurationMinutes} Minutes</span>
            <span className="sr-only">Untimed Examination</span>
          </div>
          <div>•</div>
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{cardFlipDurationSeconds}s Flip Window</span>
            <span className="sr-only">Flip-Card Identification</span>
          </div>
        </div>
      </div>

      {/* Security & Preflight Instructions */}
      <div className="py-6 space-y-3.5 text-xs sm:text-sm text-[#4A211C]">
        <h2 className="font-cormorant text-lg font-semibold text-[#54133F] mb-1">
          Examination Integrity &amp; Round 2 Rules:
        </h2>

        <div className="flex items-start space-x-2.5">
          <Maximize className="w-4 h-4 text-[#E56A21] mt-0.5 flex-shrink-0" />
          <span>
            <strong>Fullscreen mode enforced:</strong> The quiz will attempt to enter browser fullscreen upon starting.
          </span>
        </div>

        <div className="flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-[#E56A21] mt-0.5 flex-shrink-0" />
          <span>
            <strong>{cardFlipDurationSeconds}-Second Flip-Card Reveal:</strong> Each mystery logo is shown for exactly {cardFlipDurationSeconds} seconds when revealed, then locks permanently. Answer using the four text options from memory.
          </span>
        </div>

        <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900">
          <Ban className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Zero-Tolerance Security Policy:</strong> Switching tabs, window focus lost, or exiting fullscreen triggers <strong>IMMEDIATE ELIMINATION</strong> with <strong>NO second chance</strong>.
          </span>
        </div>

        <div className="flex items-start space-x-2.5">
          <Clock className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Overall Countdown Timer:</strong> You have {overallDurationMinutes} minutes to complete and review all 50 questions before final submission.
          </span>
        </div>
      </div>

      {isRoundLocked && (
        <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-medium flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div className="flex-1 text-left">
            <strong className="block text-rose-900 font-bold">Round Currently Locked by Administrator</strong>
            <span>Only rounds enabled from the Admin Console can be attended. Please wait for the coordinators to open Round 2.</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      {/* Explicit Start Round 2 Button */}
      <button
        onClick={handleStart}
        disabled={isStarting || isRoundLocked}
        type="button"
        className={`w-full py-4 px-6 rounded-2xl font-semibold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer ${
          isRoundLocked
            ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300 shadow-none'
            : 'bg-gradient-to-r from-[#E56A21] via-[#D45917] to-[#54133F] hover:from-[#F07A33] hover:to-[#6E1A52] text-white shadow-[0_8px_24px_rgba(229,106,33,0.3)] hover:shadow-[0_12px_32px_rgba(229,106,33,0.4)] disabled:opacity-50'
        }`}
      >
        {isStarting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Entering Flip-Card Arena...</span>
          </>
        ) : (
          <>
            <span>Start Round 2 Arena</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-[11px] text-center text-[#7A4232] mt-3">
        By clicking Enter, you agree to the zero-tolerance competition rules and fullscreen enforcement.
      </p>
    </div>
  );
}
