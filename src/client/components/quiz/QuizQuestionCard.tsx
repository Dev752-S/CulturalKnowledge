import { Bookmark, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface QuizQuestionData {
  id: string;
  number: number;
  category: string;
  text: string;
  options: Array<{ key: string; text: string }>;
}

interface QuizQuestionCardProps {
  question: QuizQuestionData;
  totalQuestions: number;
  selectedOption: string | null;
  isMarkedForReview: boolean;
  onSelectOption: (optionKey: string) => void;
  onToggleReview: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmitReview: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
}

export default function QuizQuestionCard({
  question,
  totalQuestions,
  selectedOption,
  isMarkedForReview,
  onSelectOption,
  onToggleReview,
  onPrevious,
  onNext,
  onSubmitReview,
  isFirstQuestion,
  isLastQuestion,
}: QuizQuestionCardProps) {
  return (
    <div className="w-full h-full flex flex-col justify-between bg-white/92 backdrop-blur-md rounded-[24px] p-6 sm:p-8 md:p-10 border border-white/80 shadow-[0_12px_40px_rgba(70,40,25,0.07)] text-[#3E231C] select-none transition-all">
      {/* Top Header Row: Question X of 100 + Category + Mark for Review */}
      <div>
        <div className="flex items-start justify-between pb-4 border-b border-[#E8DFD8]/80 gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-1">
              <h2 className="font-cormorant text-2xl sm:text-3xl font-bold text-[#54133F]">
                Question {question.number} of {totalQuestions}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E56A21]/10 text-[#E56A21] border border-[#E56A21]/20">
                {question.category}
              </span>
            </div>
            <p className="text-xs text-[#8A6D65] uppercase tracking-wider font-semibold">
              Multiple Choice Question
            </p>
          </div>

          {/* Mark for Review Button (Section 37) */}
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

        {/* Question Text */}
        <div className="py-5 sm:py-7">
          <h3 className="font-cormorant text-xl sm:text-2xl md:text-[25px] font-medium text-[#2C1810] leading-snug">
            {question.text}
          </h3>
        </div>

        {/* 4 Answer Options (Section 41 & 42) */}
        <div className="space-y-3 sm:space-y-3.5 mb-8">
          {question.options.map((option) => {
            const isSelected = selectedOption === option.key;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelectOption(option.key)}
                className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border transition-all flex items-center space-x-3.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FDF3EA] border-2 border-[#E56A21] shadow-xs'
                    : 'bg-[#FFFDF9] border-[#E8DFD8] hover:border-[#E56A21]/50 hover:bg-[#FFFBF5]'
                }`}
              >
                {/* Radio Indicator */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors flex-shrink-0 ${
                    isSelected
                      ? 'border-[#E56A21] bg-[#E56A21] text-white'
                      : 'border-stone-300 text-[#7A584E] bg-white'
                  }`}
                >
                  {option.key}
                </div>

                {/* Option Text */}
                <span
                  className={`font-cormorant text-base sm:text-lg md:text-[19px] leading-relaxed flex-1 ${
                    isSelected ? 'font-semibold text-[#54133F]' : 'font-normal text-[#3E231C]'
                  }`}
                >
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation Buttons (Section 51 & 52) */}
      <div className="flex items-center justify-between pt-5 border-t border-[#E8DFD8]/80">
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
