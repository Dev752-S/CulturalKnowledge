import { ShieldAlert, Maximize } from 'lucide-react';

interface QuizSecurityModalProps {
  type: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | null;
  onDismiss: () => void;
  onRequestFullscreen?: () => void;
}

export default function QuizSecurityModal({
  type,
  onDismiss,
  onRequestFullscreen,
}: QuizSecurityModalProps) {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-amber-200 text-center animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center mx-auto mb-4">
          {type === 'FULLSCREEN_EXIT' ? (
            <Maximize className="w-6 h-6 text-[#E56A21]" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-amber-600" />
          )}
        </div>

        <h3 className="font-cormorant text-2xl font-bold text-[#54133F] mb-2">
          {type === 'FULLSCREEN_EXIT' ? 'Fullscreen Mode Exited' : 'Security Notice'}
        </h3>

        <p className="text-xs sm:text-sm text-[#4A211C] mb-6 leading-relaxed">
          {type === 'TAB_SWITCH' && (
            <>Leaving or switching away from the quiz tab has been recorded as a security signal. Please remain on the quiz screen.</>
          )}
          {type === 'WINDOW_BLUR' && (
            <>The quiz window lost focus. Please return to the quiz interface. This incident has been logged.</>
          )}
          {type === 'FULLSCREEN_EXIT' && (
            <>Please return to browser fullscreen mode to continue your examination according to competition rules.</>
          )}
        </p>

        <div className="flex items-center justify-center space-x-3">
          {type === 'FULLSCREEN_EXIT' && onRequestFullscreen ? (
            <button
              type="button"
              onClick={onRequestFullscreen}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#E56A21] to-[#54133F] hover:from-[#F07A33] hover:to-[#6E1A52] text-white text-xs sm:text-sm font-semibold shadow-md transition-colors cursor-pointer"
            >
              Return to Fullscreen
            </button>
          ) : (
            <button
              type="button"
              onClick={onDismiss}
              className="w-full py-2.5 px-5 rounded-xl bg-[#54133F] hover:bg-[#6E1A52] text-white text-xs sm:text-sm font-semibold shadow-md transition-colors cursor-pointer"
            >
              Continue Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
