import { Bookmark, CheckCircle2, Clock } from 'lucide-react';

interface Round2AnswerState {
  selectedOptionId?: string | null;
  selectedLogoId?: string | null;
  selectedBrandName?: string | null;
  isMarkedForReview: boolean;
}

interface QuizRound2RightSidebarProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, Round2AnswerState>;
  questionIds: string[];
  onSelectQuestion: (index: number) => void;
  remainingSeconds?: number;
}

export default function QuizRound2RightSidebar({
  totalQuestions,
  currentIndex,
  answers,
  questionIds,
  onSelectQuestion,
  remainingSeconds,
}: QuizRound2RightSidebarProps) {
  const answeredCount = Object.values(answers).filter(
    (a) => a.selectedOptionId != null || a.selectedLogoId != null
  ).length;
  const markedCount = Object.values(answers).filter((a) => a.isMarkedForReview).length;
  const unansweredCount = totalQuestions - answeredCount;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <aside className="w-full md:w-64 lg:w-72 flex flex-col space-y-4 py-2 sm:py-4 select-none">
      {/* Overall Timer Card (Customizable by Admin) */}
      {remainingSeconds !== undefined && (
        <div className="bg-gradient-to-r from-[#54133F] via-[#6D1B50] to-[#E56A21] rounded-[22px] p-4 text-[#FFF8EA] shadow-md border border-[#E56A21]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
                <Clock className="w-5 h-5 text-amber-200 animate-pulse" />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-amber-200/90">
                  Round 2 Timer
                </span>
                <span className="font-mono text-2xl font-bold tracking-widest text-white leading-tight">
                  {formatTimer(remainingSeconds)}
                </span>
              </div>
            </div>
            {remainingSeconds < 300 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-100 border border-rose-400/40 animate-pulse">
                Ending Soon
              </span>
            )}
          </div>
        </div>
      )}

      {/* Overview Progress Card */}
      <div className="bg-white/92 backdrop-blur-md rounded-[22px] p-5 border border-white/80 shadow-[0_8px_30px_rgba(70,40,25,0.06)] text-[#3E231C]">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E8DFD8]">
          <h3 className="font-cormorant text-lg font-bold text-[#54133F]">
            Round 2 Progress
          </h3>
          <span className="text-xs font-semibold text-[#E56A21] bg-[#E56A21]/10 px-2.5 py-0.5 rounded-full border border-[#E56A21]/20">
            50 Questions
          </span>
        </div>

        {/* Completion Progress Bar */}
        <div className="w-full bg-stone-100 rounded-full h-2 mb-3.5 overflow-hidden border border-stone-200">
          <div
            className="bg-gradient-to-r from-[#E56A21] to-[#059669] h-full rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <span className="block text-emerald-800 font-bold text-base">{answeredCount}</span>
            <span className="text-[10px] text-emerald-700 font-medium">Answered</span>
          </div>
          <div className="p-2 rounded-xl bg-purple-50/80 border border-purple-200">
            <span className="block text-purple-800 font-bold text-base">{markedCount}</span>
            <span className="text-[10px] text-purple-700 font-medium">Marked</span>
          </div>
          <div className="p-2 rounded-xl bg-stone-50 border border-stone-200">
            <span className="block text-stone-700 font-bold text-base">{unansweredCount}</span>
            <span className="text-[10px] text-stone-600 font-medium">Remaining</span>
          </div>
        </div>
      </div>

      {/* Question Navigator Grid */}
      <div className="bg-white/92 backdrop-blur-md rounded-[22px] p-5 border border-white/80 shadow-[0_8px_30px_rgba(70,40,25,0.06)] flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E8DFD8]">
          <h4 className="font-cormorant text-base font-bold text-[#54133F]">
            Emblem Grid
          </h4>
          <span className="text-[11px] text-[#7A4232]">
            Q{currentIndex + 1} Selected
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-[#7A4232] pb-3 mb-3 border-b border-[#E8DFD8]">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
            <span>Answered</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-600 inline-block" />
            <span>Review</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-white border border-stone-300 inline-block" />
            <span>Unattempted</span>
          </div>
        </div>

        {/* 50-Item Question Number Grid */}
        <div className="grid grid-cols-5 gap-1.5 overflow-y-auto max-h-[300px] pr-1">
          {questionIds.map((qId, idx) => {
            const ans = answers[qId];
            const isAnswered = ans && (ans.selectedOptionId != null || ans.selectedLogoId != null);
            const isMarked = ans && ans.isMarkedForReview;
            const isCurrent = idx === currentIndex;

            let btnStyle = 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100';

            if (isAnswered && isMarked) {
              btnStyle = 'bg-gradient-to-br from-emerald-600 to-purple-600 text-white border-transparent';
            } else if (isAnswered) {
              btnStyle = 'bg-emerald-600 text-white border-emerald-700 shadow-xs';
            } else if (isMarked) {
              btnStyle = 'bg-purple-600 text-white border-purple-700 shadow-xs';
            }

            if (isCurrent) {
              btnStyle += ' ring-2 ring-[#E56A21] ring-offset-1 font-bold scale-105 z-10';
            }

            return (
              <button
                key={qId}
                type="button"
                title={`Question ${idx + 1}`}
                aria-label={`Question ${idx + 1}`}
                onClick={() => onSelectQuestion(idx)}
                className={`h-8 rounded-lg text-xs font-semibold border flex items-center justify-center relative transition-all cursor-pointer ${btnStyle}`}
              >
                <span>{idx + 1}</span>
                {isMarked && (
                  <Bookmark className="w-2.5 h-2.5 text-amber-300 fill-amber-300 absolute top-0.5 right-0.5" />
                )}
                {isAnswered && !isMarked && (
                  <CheckCircle2 className="w-2 h-2 text-white/80 absolute bottom-0.5 right-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
