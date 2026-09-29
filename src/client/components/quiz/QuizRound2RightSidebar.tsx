import { Bookmark, CheckCircle2 } from 'lucide-react';

interface Round2AnswerState {
  selectedLogoId: string | null;
  selectedOptionId?: string | null;
  isMarkedForReview: boolean;
}

interface QuizRound2RightSidebarProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, Round2AnswerState>;
  questionIds: string[];
  onSelectQuestion: (index: number) => void;
}

export default function QuizRound2RightSidebar({
  totalQuestions,
  currentIndex,
  answers,
  questionIds,
  onSelectQuestion,
}: QuizRound2RightSidebarProps) {
  const answeredCount = Object.values(answers).filter((a) => a.selectedLogoId !== null).length;
  const markedCount = Object.values(answers).filter((a) => a.isMarkedForReview).length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <aside className="w-full md:w-64 lg:w-72 flex flex-col space-y-4 py-2 sm:py-4 select-none">
      {/* Overview Progress Card (Replaces the Timer panel naturally without fake metrics) */}
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
          <div className="p-2 rounded-xl bg-stone-50/80 border border-stone-200">
            <span className="block text-stone-700 font-bold text-base">{unansweredCount}</span>
            <span className="text-[10px] text-stone-600 font-medium">Remaining</span>
          </div>
        </div>
      </div>

      {/* Question Navigator Card (50 Questions in 5 Columns) */}
      <div className="flex-1 bg-white/92 backdrop-blur-md rounded-[22px] p-4 sm:p-5 border border-white/80 shadow-[0_8px_30px_rgba(70,40,25,0.06)] flex flex-col justify-between overflow-hidden">
        <div>
          <h3 className="font-cormorant text-lg font-bold text-[#54133F] mb-3 pb-2 border-b border-[#E8DFD8]">
            Question Navigator
          </h3>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#633027] mb-3.5 font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-200 border border-stone-300" />
              <span>Not Answered</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full ring-2 ring-[#E56A21] bg-[#FDF3EA]" />
              <span>Current</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span>Marked Review</span>
            </div>
          </div>

          {/* 50 Question Numbers in 5 Columns (10 rows) */}
          <div className="max-h-[360px] sm:max-h-[420px] overflow-y-auto pr-1">
            <div className="grid grid-cols-5 gap-1.5 text-xs font-semibold">
              {Array.from({ length: totalQuestions }, (_, i) => {
                const qId = questionIds[i];
                const ans = qId ? answers[qId] : null;
                const isAnswered = ans && ans.selectedLogoId !== null;
                const isMarked = ans && ans.isMarkedForReview;
                const isCurrent = i === currentIndex;

                let btnStyle = 'bg-[#F6EFE8] text-[#7A584E] hover:bg-[#EAE0D5]';

                if (isCurrent) {
                  btnStyle = 'ring-2 ring-[#E56A21] bg-[#FDF3EA] text-[#E56A21] font-bold shadow-xs';
                } else if (isMarked) {
                  btnStyle = 'bg-purple-600 text-white shadow-xs';
                } else if (isAnswered) {
                  btnStyle = 'bg-emerald-600 text-white shadow-xs';
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelectQuestion(i)}
                    className={`h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${btnStyle}`}
                    title={`Question ${i + 1}`}
                  >
                    <span>{i + 1}</span>
                    {isMarked && !isCurrent && (
                      <Bookmark className="w-2 h-2 absolute top-0.5 right-0.5 fill-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 mt-3 border-t border-[#E8DFD8] text-[11px] text-[#7A4232] flex items-center justify-between font-medium">
          <span>Question {currentIndex + 1} of {totalQuestions}</span>
          <span className="flex items-center space-x-1 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{answeredCount} Completed</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
