import { Bookmark, ArrowLeft, ArrowRight, CheckCircle2, Check } from 'lucide-react';

export interface Round2OptionData {
  optionId: string;
  logoId: string;
  key: 'A' | 'B' | 'C' | 'D';
  svgUrl: string;
  pngUrl: string;
}

export interface Round2QuestionData {
  questionId: string;
  questionNumber: number;
  questionText: string;
  options: Round2OptionData[];
}

interface QuizLogoQuestionCardProps {
  question: Round2QuestionData;
  totalQuestions: number;
  selectedLogoId: string | null;
  isMarkedForReview: boolean;
  onSelectOption: (logoId: string, optionId: string) => void;
  onToggleReview: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmitReview: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
}

export default function QuizLogoQuestionCard({
  question,
  totalQuestions,
  selectedLogoId,
  isMarkedForReview,
  onSelectOption,
  onToggleReview,
  onPrevious,
  onNext,
  onSubmitReview,
  isFirstQuestion,
  isLastQuestion,
}: QuizLogoQuestionCardProps) {
  return (
    <div className="w-full h-full flex flex-col justify-between bg-white/92 backdrop-blur-md rounded-[24px] p-5 sm:p-7 md:p-9 border border-white/80 shadow-[0_12px_40px_rgba(70,40,25,0.07)] text-[#3E231C] select-none transition-all">
      {/* Top Header Row: Question X of 50 + Category + Mark for Review */}
      <div>
        <div className="flex items-start justify-between pb-4 border-b border-[#E8DFD8]/80 gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-1">
              <h2 className="font-cormorant text-2xl sm:text-3xl font-bold text-[#54133F]">
                Question {question.questionNumber} of {totalQuestions}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E56A21]/10 text-[#E56A21] border border-[#E56A21]/20">
                Visual Logo Quiz
              </span>
            </div>
            <p className="text-xs text-[#8A6D65] uppercase tracking-wider font-semibold">
              Select the matching brand logo
            </p>
          </div>

          {/* Mark for Review Button */}
          <button
            type="button"
            onClick={onToggleReview}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              isMarkedForReview
                ? 'bg-purple-50 border-purple-400 text-purple-700 shadow-xs'
                : 'bg-white/80 border-stone-200 text-[#7A584E] hover:border-purple-300 hover:text-purple-600'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isMarkedForReview ? 'fill-purple-600 text-purple-600' : ''}`} />
            <span>{isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
          </button>
        </div>

        {/* Question Text Clue */}
        <div className="py-4 sm:py-6">
          <h3 className="font-cormorant text-xl sm:text-2xl md:text-[24px] font-semibold text-[#2C1810] leading-snug">
            {question.questionText}
          </h3>
        </div>

        {/* 4 Visual Logo Cards: 2x2 Grid (Desktop) / 1 Column (Mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6">
          {question.options.map((option) => {
            const isSelected = selectedLogoId === option.logoId;

            return (
              <button
                key={option.optionId}
                type="button"
                onClick={() => onSelectOption(option.logoId, option.optionId)}
                className={`relative w-full rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden group ${
                  isSelected
                    ? 'bg-[#FDF3EA] border-2 border-[#E56A21] shadow-md ring-2 ring-[#E56A21]/30 -translate-y-0.5'
                    : 'bg-[#FFFDF9] border border-[#E8DFD8] hover:border-[#E56A21]/60 hover:bg-[#FFFBF5] hover:-translate-y-0.5 hover:shadow-md'
                }`}
                style={{ minHeight: '170px' }}
              >
                {/* Option Letter Badge (A, B, C, D) in Upper Left */}
                <div
                  className={`absolute top-3 left-3 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-[#E56A21] text-white shadow-xs'
                      : 'bg-stone-100 text-[#633027] border border-stone-200 group-hover:bg-[#E56A21]/15 group-hover:text-[#E56A21]'
                  }`}
                >
                  {option.key}
                </div>

                {/* Selected Checkmark Indicator in Upper Right */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs animate-in zoom-in-75">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Logo Image Area: Constrained, centered, crisp SVG with PNG fallback */}
                <div className="w-full flex items-center justify-center p-3 my-auto">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center">
                    <img
                      src={option.svgUrl}
                      alt={`Option ${option.key}`}
                      onError={(e) => {
                        // Fallback to PNG if SVG fails to load
                        if (e.currentTarget.src !== option.pngUrl) {
                          e.currentTarget.src = option.pngUrl;
                        }
                      }}
                      className="max-w-full max-h-full object-contain filter transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* CRITICAL: Company name is NEVER displayed under option card */}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E8DFD8]/80">
        {/* Previous Button */}
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirstQuestion}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
            isFirstQuestion
              ? 'opacity-40 border-stone-200 text-stone-400 cursor-not-allowed'
              : 'border-[#643C28]/20 bg-white/80 text-[#54133F] hover:bg-white hover:border-[#E56A21]/40 shadow-xs cursor-pointer'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {/* Next or Review & Submit Button */}
        {isLastQuestion ? (
          <button
            type="button"
            onClick={onSubmitReview}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E56A21] via-[#059669] to-[#047857] hover:from-[#F07A33] hover:to-[#059669] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <span>Review &amp; Submit</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E56A21] via-[#D45917] to-[#54133F] hover:from-[#F07A33] hover:to-[#6E1A52] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <span>Next Question</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
