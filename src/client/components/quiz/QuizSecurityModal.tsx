import { Ban, AlertTriangle, ArrowLeft } from 'lucide-react';

interface QuizSecurityModalProps {
  type: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | string | null;
  onExit?: () => void;
  onDismiss?: () => void;
  onRequestFullscreen?: () => void;
  reason?: string;
}

export default function QuizSecurityModal({
  type,
  onExit,
  reason,
}: QuizSecurityModalProps) {
  if (!type) return null;

  const eventLabel =
    type === 'TAB_SWITCH'
      ? 'Tab Switch / Background Window Detected'
      : type === 'WINDOW_BLUR'
      ? 'Window Focus Lost'
      : type === 'FULLSCREEN_EXIT'
      ? 'Fullscreen Mode Exited'
      : type;

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#FFFDF9] rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-rose-500/50 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
          <Ban className="w-8 h-8 text-rose-600" />
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold uppercase tracking-wider mb-3">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>ZERO TOLERANCE SECURITY VIOLATION</span>
        </div>

        <h3 className="font-cormorant text-3xl font-bold text-rose-900 mb-2">
          Participant Eliminated
        </h3>

        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold mb-4 text-center">
          Anomaly Detected: <span className="underline">{eventLabel}</span>
        </div>

        <p className="text-xs sm:text-sm text-[#5A2920] mb-6 leading-relaxed">
          {reason ||
            'As per SKP Skill Arena official competition rules, any active examination anomaly triggers immediate elimination. A zero-tolerance policy is strictly enforced. There is no second chance.'}
        </p>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={handleExit}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-700 via-rose-600 to-rose-800 hover:from-rose-800 hover:to-rose-900 text-white text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Competition Arena</span>
          </button>
        </div>
      </div>
    </div>
  );
}
