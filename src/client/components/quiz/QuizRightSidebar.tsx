import { Clock, Bookmark } from 'lucide-react';

interface QuizRightSidebarProps {
  remainingSeconds: number;
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, { selectedOption: string | null; isMarkedForReview: boolean }>;
  questionIds: string[];
  onSelectQuestion: (index: number) => void;
}

export default function QuizRightSidebar({
  remainingSeconds,
  totalQuestions,
  currentIndex,
  answers,
  questionIds,
  onSelectQuestion,
}: QuizRightSidebarProps) {
  // Format MM:SS
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLowTime = remainingSeconds < 300; // Under 5 mins

  return (
    <aside className="w-full md:w-64 lg:w-72 flex flex-col space-y-4 py-2 sm:py-4 select-none">
      {/* 1. Timer Card (Section 53) */}
      <div
        className={`p-5 rounded-[22px] border text-center transition-all ${
          isLowTime
            ? 'bg-rose-50/95 border-rose-300 shadow-sm'
            : 'bg-white/92 backdrop-blur-md border-white/80 shadow-[0_8px_30px_rgba(70,40,25,0.06)]'
        }`}
      >
        <div className="flex items-center justify-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#7A4232] mb-1">
          <Clock className={`w-3.5 h-3.5 ${isLowTime ? 'text-rose-600 animate-pulse' : 'text-[#E56A21]'}`} />
          <span>Time Remaining</span>
        </div>

        {/* Large Time Display */}
        <div
          className={`font-mono text-3xl sm:text-4xl font-bold tracking-tight my-1 ${
            isLowTime ? 'text-rose-600' : 'text-[#54133F]'
          }`}
        >
          {formattedTime}
        </div>

        <span className="text-[11px] font-medium text-[#8A6D65]">
          of 60 Minutes
        </span>
      </div>

      {/* 2. Question Navigator Card (Section 46–50 & 97) */}
      <div className="flex-1 bg-white/92 backdrop-blur-md rounded-[22px] p-4 sm:p-5 border border-white/80 shadow-[0_8px_30px_rgba(70,40,25,0.06)] flex flex-col justify-between overflow-hidden">
        <div>
          <h3 className="font-cormorant text-lg font-bold text-[#54133F] mb-3 pb-2 border-b border-[#E8DFD8]">
            Question Navigator
          </h3>

          {/* Legend (Section 47) */}
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

          {/* 100 Question Numbers in 5 Columns (Section 48 & 96) */}
          <div className="max-h-[300px] sm:max-h-[340px] md:max-h-[360px] overflow-y-auto pr-1">
            <div className="grid grid-cols-5 gap-1.5 text-xs font-semibold">
              {Array.from({ length: totalQuestions }, (_, i) => {
                const qId = questionIds[i];
                const ans = qId ? answers[qId] : null;
                const isAnswered = ans && ans.selectedOption !== null;
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

        {/* Small stats summary at bottom of navigator */}
        <div className="pt-3 mt-3 border-t border-[#E8DFD8] text-[11px] text-[#7A4232] flex justify-between font-medium">
          <span>Total: 100</span>
          <span>
            Done: {Object.values(answers).filter((a) => a.selectedOption !== null).length} / 100
          </span>
        </div>
      </div>
    </aside>
  );
}
