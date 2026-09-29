import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface QuizRound2SubmitModalProps {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  markedCount: number;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function QuizRound2SubmitModal({
  isOpen,
  totalQuestions,
  answeredCount,
  unansweredCount,
  markedCount,
  isSubmitting,
  onConfirm,
  onCancel,
}: QuizRound2SubmitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E8DFD8] text-center animate-in zoom-in-95 duration-200">
        {/* Top Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <h3 className="font-cormorant text-2xl sm:text-3xl font-bold text-[#54133F] mb-2">
          Round 2 Review
        </h3>
        <p className="text-xs sm:text-sm text-[#7A4232] mb-6">
          Total Questions: {totalQuestions}. Please review your attempt summary before completing Round 2.
        </p>

        {/* Summary Metric Cards (NO SCORE, NO MARKS) */}
        <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="block text-emerald-800 font-bold text-lg">{answeredCount} / {totalQuestions}</span>
            <span className="text-[11px] text-emerald-700 font-medium">Answered</span>
          </div>

          <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
            <span className="block text-purple-800 font-bold text-lg">{markedCount}</span>
            <span className="text-[11px] text-purple-700 font-medium">Marked</span>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="block text-stone-700 font-bold text-lg">{unansweredCount}</span>
            <span className="text-[11px] text-stone-600 font-medium">Not Answered</span>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-800 mb-6 flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            Once submitted, your answers cannot be changed. Are you sure you wish to submit?
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Continue Quiz
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#E56A21] to-[#059669] hover:from-[#F07A33] hover:to-[#047857] text-white text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Round 2'}
          </button>
        </div>
      </div>
    </div>
  );
}
