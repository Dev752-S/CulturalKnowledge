import { useState, useEffect } from 'react';
import { Bookmark, ArrowLeft, ArrowRight, Check, Eye, Lock, Clock, Sparkles, HelpCircle, CheckCircle2 } from 'lucide-react';

export interface Round2OptionData {
  optionId: string;
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
  brandName?: string;
  logoId?: string;
}

export interface Round2QuestionData {
  questionId: string;
  questionNumber: number;
  questionText: string;
  category?: string;
  difficulty?: string;
  logoSvgUrl: string;
  logoPngUrl: string;
  logoImageUrl?: string;
  options: Round2OptionData[];
}

interface QuizLogoQuestionCardProps {
  question: Round2QuestionData;
  totalQuestions: number;
  selectedOptionId: string | null;
  isMarkedForReview: boolean;
  isRevealing: boolean;
  isLocked: boolean;
  countdownSeconds: number;
  flipDurationSeconds?: number;
  onRevealCard: () => void;
  onSelectOption: (optionId: string, brandName: string) => void;
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
  selectedOptionId,
  isMarkedForReview,
  isRevealing,
  isLocked,
  countdownSeconds,
  flipDurationSeconds = 5,
  onRevealCard,
  onSelectOption,
  onToggleReview,
  onPrevious,
  onNext,
  onSubmitReview,
  isFirstQuestion,
  isLastQuestion,
}: QuizLogoQuestionCardProps) {
  const [imgFailed, setImgFailed] = useState(false);

  // Reset img error on question change
  useEffect(() => {
    setImgFailed(false);
  }, [question.questionId]);

  const canFlip = !isRevealing && !isLocked && !selectedOptionId;

  return (
    <div className="w-full h-full flex flex-col justify-between bg-white/92 backdrop-blur-md rounded-[24px] p-4 sm:p-6 md:p-8 border border-white/80 shadow-[0_12px_40px_rgba(70,40,25,0.07)] text-[#3E231C] select-none transition-all">
      {/* Top Header Row: Question X of 50 + Category + Mark for Review */}
      <div>
        <div className="flex items-start justify-between pb-3.5 border-b border-[#E8DFD8]/80 gap-3">
          <div>
            <div className="flex items-center space-x-2.5 mb-1">
              <h2 className="font-cormorant text-2xl sm:text-3xl font-bold text-[#54133F]">
                Question {question.questionNumber} of {totalQuestions}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E56A21]/10 text-[#E56A21] border border-[#E56A21]/20">
                Flip-Card Logo Game
              </span>
            </div>
            <p className="text-xs text-[#8A6D65] uppercase tracking-wider font-semibold">
              5-Second Visual Identification · Text-Based Memory Recall
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

        {/* Question Text Clue / Title */}
        <div className="pt-3 pb-4">
          <h3 className="font-cormorant text-xl sm:text-2xl font-semibold text-[#2C1810] leading-snug">
            {question.questionText}
          </h3>
        </div>

        {/* ======================================================== */}
        {/* CENTER FLIP-CARD INTERACTIVE STAGE                       */}
        {/* ======================================================== */}
        <div className="w-full flex justify-center mb-6">
          <div className="w-full max-w-[380px] h-[280px] sm:h-[310px] perspective-1000">
            <div
              className={`w-full h-full relative transform-style-3d transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                isRevealing ? 'rotate-y-180' : ''
              }`}
            >
              {/* ---------------- FRONT FACE (UNREVEALED OR LOCKED) ---------------- */}
              <div
                className={`absolute inset-0 w-full h-full rounded-3xl p-5 border-2 shadow-lg backface-hidden flex flex-col justify-between overflow-hidden ${
                  isLocked || selectedOptionId
                    ? 'bg-gradient-to-br from-[#FAF6F0] to-[#F3EDE2] border-[#54133F]/20 text-[#54133F]'
                    : 'bg-gradient-to-br from-[#54133F] via-[#6F1A52] to-[#E56A21] border-[#E56A21]/40 text-[#FFF8EA]'
                }`}
              >
                {/* Ornate corner decorative accents */}
                <div className="absolute top-2.5 left-2.5 w-6 h-6 border-t-2 border-l-2 border-amber-300/40 rounded-tl-lg pointer-events-none" />
                <div className="absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 border-amber-300/40 rounded-tr-lg pointer-events-none" />
                <div className="absolute bottom-2.5 left-2.5 w-6 h-6 border-b-2 border-l-2 border-amber-300/40 rounded-bl-lg pointer-events-none" />
                <div className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 border-amber-300/40 rounded-br-lg pointer-events-none" />

                {/* Top status bar */}
                <div className="flex justify-between items-center z-10">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                      isLocked || selectedOptionId
                        ? 'bg-[#54133F]/10 text-[#54133F] border border-[#54133F]/20'
                        : 'bg-white/15 text-amber-100 border border-white/20'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-[#E56A21]" />
                    {question.category || 'Brand Emblem'}
                  </span>
                  <span className="text-xs font-mono font-bold opacity-80">
                    Q{question.questionNumber} / {totalQuestions}
                  </span>
                </div>

                {/* Card Center Content */}
                <div className="flex-1 flex flex-col items-center justify-center my-auto z-10 text-center px-4">
                  {isLocked || selectedOptionId ? (
                    /* Locked State Content */
                    <div className="flex flex-col items-center justify-center animate-in zoom-in-95">
                      <div className="w-16 h-16 rounded-full bg-[#54133F]/10 border border-[#54133F]/25 flex items-center justify-center mb-2.5 shadow-inner">
                        <Lock className="w-8 h-8 text-[#54133F]" />
                      </div>
                      <h4 className="font-cormorant font-bold text-2xl text-[#54133F]">
                        Card Locked
                      </h4>
                      <p className="text-xs text-[#7A4232] mt-1 max-w-[240px] leading-relaxed">
                        {flipDurationSeconds}-second reveal window ended. Logo hidden to test recall from memory.
                      </p>
                    </div>
                  ) : (
                    /* Initial Hidden State (Ready to Flip) */
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-400 via-[#E56A21] to-[#D45917] p-[3px] shadow-lg mb-2.5">
                        <div className="w-full h-full rounded-full bg-[#54133F] flex items-center justify-center">
                          <HelpCircle className="w-8 h-8 sm:w-10 sm:h-10 text-amber-200 animate-pulse" />
                        </div>
                      </div>
                      <h4 className="font-cormorant font-bold text-xl sm:text-2xl text-amber-100 drop-shadow-sm">
                        Mystery Logo Card
                      </h4>
                      <p className="text-xs text-amber-200/80 mt-0.5">
                        Click below to reveal for {flipDurationSeconds} seconds
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Action Area */}
                <div className="z-10 pt-2 border-t border-white/10 flex items-center justify-center">
                  {canFlip ? (
                    <button
                      type="button"
                      onClick={onRevealCard}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#E56A21] to-[#F07A33] hover:from-[#F07A33] hover:to-[#E56A21] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Reveal Logo ({flipDurationSeconds}s Timer)</span>
                    </button>
                  ) : isLocked || selectedOptionId ? (
                    <div className="flex items-center gap-1.5 text-xs text-[#7A4232] font-semibold">
                      <Lock className="w-3.5 h-3.5 text-[#54133F]" />
                      <span>Permanently Locked for this Question</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* ---------------- BACK FACE (ACTIVE REVEAL) ---------------- */}
              <div
                className="absolute inset-0 w-full h-full rounded-3xl p-5 bg-[#FFFDF9] border-2 border-[#E56A21] shadow-2xl backface-hidden rotate-y-180 flex flex-col justify-between overflow-hidden"
              >
                {/* Meta Top Header during Reveal */}
                <div className="flex items-center justify-between z-10 pb-2 border-b border-[#E8DFD8]">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                    {question.category || 'Brand Emblem'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E56A21] bg-[#E56A21]/10 px-2.5 py-0.5 rounded-full border border-[#E56A21]/20">
                    <Clock className="w-3 h-3 text-[#E56A21] animate-spin" />
                    <span>{countdownSeconds}s Left</span>
                  </span>
                </div>

                {/* Logo Image Stage: Strictly NO brand names! */}
                <div className="flex-1 flex flex-col items-center justify-center my-auto z-10 py-2">
                  <div className="w-32 h-32 sm:w-36 sm:h-36 p-3 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center overflow-hidden">
                    <img
                      src={imgFailed ? question.logoPngUrl : question.logoSvgUrl}
                      alt="Revealed Logo"
                      onError={() => setImgFailed(true)}
                      className="max-w-full max-h-full object-contain filter select-none transition-transform duration-300 hover:scale-105"
                      loading="eager"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[#7A4232] uppercase tracking-widest mt-2">
                    Memorize this emblem
                  </span>
                </div>

                {/* Countdown Progress Bar */}
                <div className="z-10 pt-2 border-t border-[#E8DFD8]">
                  <div className="flex justify-between items-center text-[10px] text-[#7A4232] mb-1 font-semibold">
                    <span>Reveal Active</span>
                    <span>Locking in {countdownSeconds}s...</span>
                  </div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 via-[#E56A21] to-[#54133F] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(0, Math.min(100, (countdownSeconds / (flipDurationSeconds || 5)) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FOUR TEXT ANSWER OPTIONS                                 */}
        {/* ======================================================== */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-cormorant text-lg sm:text-xl font-bold text-[#54133F]">
              Which logo was shown?
            </h4>
            {selectedOptionId && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Answer Recorded</span>
              </span>
            )}
          </div>

          {/* Conditional Guidance or Four Text Answer Buttons */}
          {!isLocked && !selectedOptionId ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-center flex flex-col items-center justify-center space-y-1.5 text-xs sm:text-sm text-amber-900 font-medium">
              <div className="flex items-center gap-2 font-semibold text-[#54133F]">
                <Eye className="w-4 h-4 text-[#E56A21]" />
                <span>Answer Options Are Hidden During Initial State</span>
              </div>
              <p className="text-xs text-[#7A4232]">
                Click <strong className="text-[#E56A21]">Reveal Logo</strong> above to inspect the card for 5 seconds. The 4 text answer options will unlock when the card locks.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {question.options.map((opt) => {
                const isSelected = selectedOptionId === opt.optionId;
                const isAlreadyAnswered = Boolean(selectedOptionId);

                return (
                  <button
                    key={opt.optionId}
                    type="button"
                    disabled={isAlreadyAnswered}
                    onClick={() => onSelectOption(opt.optionId, opt.text || opt.brandName || '')}
                    className={`relative w-full rounded-2xl p-4 flex items-center gap-3.5 transition-all duration-200 text-left ${
                      isSelected
                        ? 'bg-[#FDF3EA] border-2 border-[#E56A21] shadow-md ring-2 ring-[#E56A21]/30 -translate-y-0.5'
                        : isAlreadyAnswered
                        ? 'bg-stone-50 border border-stone-200 text-stone-400 cursor-not-allowed opacity-60'
                        : 'bg-white/95 border border-[#E8DFD8] hover:border-[#E56A21]/60 hover:bg-[#FFFBF5] hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    {/* Option Letter Badge (A, B, C, D) */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                        isSelected
                          ? 'bg-[#E56A21] text-white shadow-xs'
                          : 'bg-stone-100 text-[#633027] border border-stone-200'
                      }`}
                    >
                      {opt.key}
                    </div>

                    {/* Brand Name Text (NO logo images) */}
                    <span className="flex-1 font-semibold text-sm sm:text-base text-[#3E231C] truncate">
                      {opt.text || opt.brandName}
                    </span>

                    {/* Checkmark icon for selected option */}
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0 animate-in zoom-in-75">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* BOTTOM NAVIGATION BUTTONS                                */}
      {/* ======================================================== */}
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
