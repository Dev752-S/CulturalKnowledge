import { useState } from 'react';
import { ChevronDown, AlertTriangle } from 'lucide-react';

interface QuizHeaderProps {
  teamName: string;
  onEndQuiz: () => void;
}

export default function QuizHeader({ teamName, onEndQuiz }: QuizHeaderProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleConfirmEnd = () => {
    setShowConfirmModal(false);
    onEndQuiz();
  };

  return (
    <>
      <header className="w-full h-16 sm:h-[68px] bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#643C28]/10 px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-40 select-none">
        {/* Left Brand: Lotus Symbol + Kala Sangamam + Cultural Knowledge */}
        <div className="flex items-center space-x-3">
          {/* Stylized Lotus Emblem */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#54133F] via-[#7B1D5C] to-[#E56A21] flex items-center justify-center text-white shadow-sm">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C11 6 7 9 7 13C7 16.5 9.5 19 12 21C14.5 19 17 16.5 17 13C17 9 13 6 12 2Z" />
              <path d="M7 13C4 11 2 13 2 16C2 18.5 4.5 20.5 7.5 20.5C6.5 19 6.5 16 7 13Z" opacity="0.7" />
              <path d="M17 13C20 11 22 13 22 16C22 18.5 19.5 20.5 16.5 20.5C17.5 19 17.5 16 17 13Z" opacity="0.7" />
            </svg>
          </div>

          <div className="flex flex-col text-left leading-none">
            <span className="font-cormorant text-2xl sm:text-[26px] font-bold tracking-wide text-[#54133F]">
              Kala Sangamam
            </span>
            <span className="font-cormorant text-xs sm:text-[13px] text-[#7A4232] font-medium tracking-wider mt-0.5">
              Cultural Knowledge
            </span>
          </div>
        </div>

        {/* Right Area: Team Pill + End Quiz Button */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Team Dropdown Pill */}
          <div className="hidden xs:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#FFF8EA] border border-[#C58A3A]/40 text-[#54133F] text-xs sm:text-sm font-semibold shadow-xs">
            <span className="truncate max-w-[130px] sm:max-w-[160px]">{teamName || 'Team Vibes'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#7A4232]" />
          </div>

          {/* End Quiz Distinct Soft Button (Section 27) */}
          <button
            onClick={() => setShowConfirmModal(true)}
            type="button"
            className="px-3.5 sm:px-4 py-1.5 rounded-xl border border-[#B3392F]/40 text-[#B3392F] hover:bg-[#B3392F]/10 text-xs sm:text-sm font-medium tracking-wide transition-colors cursor-pointer"
          >
            End Quiz
          </button>
        </div>
      </header>

      {/* End Quiz Confirmation Modal (Section 27 & 114) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#E8DFD8] text-center animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-cormorant text-2xl font-bold text-[#54133F] mb-2">
              End Quiz?
            </h3>
            <p className="text-xs sm:text-sm text-[#633027] mb-6 leading-relaxed">
              Are you sure you want to leave the quiz? Your current answers will be saved on the server.
            </p>

            <div className="flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEnd}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#B3392F] to-[#8C2356] hover:from-[#C74035] hover:to-[#9E2862] text-white text-xs sm:text-sm font-semibold shadow-md transition-colors cursor-pointer"
              >
                End Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
