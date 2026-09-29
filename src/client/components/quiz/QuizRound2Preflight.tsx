import { useState } from 'react';
import { ShieldCheck, Maximize, Camera, AlertCircle, ArrowRight, Award, FileText } from 'lucide-react';

interface QuizRound2PreflightProps {
  onStartQuiz: (useCamera: boolean) => Promise<void>;
  teamName: string;
  participantName: string;
}

export default function QuizRound2Preflight({
  onStartQuiz,
  teamName,
  participantName,
}: QuizRound2PreflightProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [enableCamera, setEnableCamera] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStart = async () => {
    setIsStarting(true);
    setErrorMsg(null);
    try {
      await onStartQuiz(enableCamera);
    } catch (err: any) {
      console.error('Quiz start error:', err);
      setErrorMsg(err.message || 'Unable to start Round 2 session. Please try again.');
      setIsStarting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-auto p-6 sm:p-8 rounded-[28px] bg-white/95 backdrop-blur-md border border-[#E56A21]/30 shadow-[0_16px_50px_rgba(84,19,63,0.12)] text-[#3E231C] select-none">
      {/* Header */}
      <div className="text-center pb-6 border-b border-[#E8DFD8]">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#54133F]/10 text-[#54133F] text-xs font-semibold uppercase tracking-wider mb-2">
          <Award className="w-3.5 h-3.5 text-[#E56A21]" />
          <span>Official Competition Gate</span>
        </div>
        <h1 className="font-cormorant text-3xl sm:text-4xl font-bold text-[#54133F]">
          Round 2 — Logo Quiz
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
            <Award className="w-4 h-4 text-[#E56A21]" />
            <span>Visual Identification</span>
          </div>
          <div>•</div>
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Server Authoritative</span>
          </div>
        </div>
      </div>

      {/* Security & Preflight Instructions */}
      <div className="py-6 space-y-3.5 text-xs sm:text-sm text-[#4A211C]">
        <h2 className="font-cormorant text-lg font-semibold text-[#54133F] mb-1">
          Before Starting Round 2:
        </h2>

        <div className="flex items-start space-x-2.5">
          <Maximize className="w-4 h-4 text-[#E56A21] mt-0.5 flex-shrink-0" />
          <span>
            <strong>Fullscreen mode required:</strong> The quiz will attempt to enter browser fullscreen upon starting.
          </span>
        </div>

        <div className="flex items-start space-x-2.5">
          <Camera className="w-4 h-4 text-[#E56A21] mt-0.5 flex-shrink-0" />
          <span>
            <strong>Proctoring &amp; Camera stream:</strong> Live webcam presence monitoring is requested for participant verification.
          </span>
        </div>

        <div className="flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Stay on the quiz window:</strong> Leaving fullscreen or switching away from the quiz tab may be recorded as a security incident.
          </span>
        </div>

        <div className="flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Untimed Examination:</strong> Take your time to carefully identify each emblem. No timer countdown will be shown.
          </span>
        </div>
      </div>

      {/* Camera Opt-In / Check */}
      <div className="bg-[#FFF8EA] p-4 rounded-2xl border border-[#C58A3A]/30 mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Camera className="w-5 h-5 text-[#54133F]" />
          <div>
            <p className="text-xs font-semibold text-[#54133F]">Webcam Proctoring Stream</p>
            <p className="text-[11px] text-[#7A4232]">Allows proctors to verify attendance and presence</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enableCamera}
            onChange={(e) => setEnableCamera(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E56A21]"></div>
        </label>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      {/* Explicit Start Round 2 Button */}
      <button
        onClick={handleStart}
        disabled={isStarting}
        type="button"
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#E56A21] via-[#D45917] to-[#54133F] hover:from-[#F07A33] hover:to-[#6E1A52] text-white font-semibold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 shadow-[0_8px_24px_rgba(229,106,33,0.3)] hover:shadow-[0_12px_32px_rgba(229,106,33,0.4)] transition-all cursor-pointer disabled:opacity-50"
      >
        <span>{isStarting ? 'INITIALIZING LOGO ARENA...' : 'START ROUND 2'}</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-[11px] text-center text-[#8A6D65] mt-3">
        By clicking Start Round 2, your secure session will be initialized on the server.
      </p>
    </div>
  );
}
