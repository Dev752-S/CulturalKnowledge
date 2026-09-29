import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface QuizSubmitModalProps {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  markedCount: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirmSubmit: () => void;
}

export default function QuizSubmitModal({
  isOpen,
  totalQuestions,
  answeredCount,
  unansweredCount,
  markedCount,
  isSubmitting,
  onCancel,
  onConfirmSubmit,
}: QuizSubmitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E8DFD8] text-center animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h3 className="font-cormorant text-2xl sm:text-3xl font-bold text-[#54133F] mb-2">
          Submit Quiz?
        </h3>

        {/* Stats Summary Grid (Section 80) */}
        <div className="bg-[#FFF8EA] rounded-2xl p-4 my-5 border border-[#C58A3A]/25 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between items-center text-[#3E231C]">
            <span className="font-medium">Answered:</span>
            <span className="font-bold text-emerald-700">{answeredCount} / {totalQuestions}</span>
          </div>
          <div className="flex justify-between items-center text-[#3E231C]">
            <span className="font-medium">Not Answered:</span>
            <span className="font-bold text-amber-700">{unansweredCount}</span>
          </div>
          <div className="flex justify-between items-center text-[#3E231C]">
            <span className="font-medium">Marked for Review:</span>
            <span className="font-bold text-purple-700">{markedCount}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-[#8A6D65] mb-6 text-left bg-stone-50 p-3 rounded-xl border border-stone-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Once submitted, you cannot modify your answers. Official scoring will be processed server-side.</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Continue Quiz
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirmSubmit}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#E56A21] via-[#059669] to-[#047857] hover:from-[#F07A33] hover:to-[#059669] text-white text-xs sm:text-sm font-semibold shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmitting ? 'SUBMITTING...' : 'SUBMIT QUIZ'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
