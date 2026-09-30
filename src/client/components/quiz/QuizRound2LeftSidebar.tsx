import { useState } from 'react';
import { Layers, BookOpen, HelpCircle, X, ShieldCheck } from 'lucide-react';

interface QuizRound2LeftSidebarProps {
  cameraStream?: MediaStream | null;
  cardFlipDurationSeconds?: number;
  overallDurationMinutes?: number;
}

type ActiveNavModal = 'instructions' | 'rules' | 'help' | null;

export default function QuizRound2LeftSidebar({
  cardFlipDurationSeconds = 5,
  overallDurationMinutes = 30,
}: QuizRound2LeftSidebarProps) {
  const [activeModal, setActiveModal] = useState<ActiveNavModal>(null);

  return (
    <>
      <aside className="w-full md:w-56 lg:w-64 flex flex-col justify-between py-2 sm:py-4 select-none">
        {/* Top Header & Navigation Items */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3 px-3 py-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#54133F] via-[#7B1D5C] to-[#E56A21] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Layers className="w-5 h-5 text-[#FFF8EA]" />
            </div>
            <div>
              <span className="block text-xs font-bold text-[#E56A21] uppercase tracking-wider">
                Round 2
              </span>
              <h2 className="font-cormorant text-xl sm:text-2xl font-bold text-[#54133F] leading-tight">
                Logo Quiz
              </h2>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 px-1">
            <button
              onClick={() => setActiveModal('instructions')}
              type="button"
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium text-[#4A211C] hover:bg-white/80 hover:text-[#54133F] transition-colors cursor-pointer border border-transparent hover:border-[#E8DFD8]"
            >
              <Layers className="w-4 h-4 text-[#E56A21]" />
              <span>Flip-Card Guide</span>
            </button>

            <button
              onClick={() => setActiveModal('rules')}
              type="button"
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium text-[#4A211C] hover:bg-white/80 hover:text-[#54133F] transition-colors cursor-pointer border border-transparent hover:border-[#E8DFD8]"
            >
              <BookOpen className="w-4 h-4 text-[#E56A21]" />
              <span>Round 2 Rules</span>
            </button>

            <button
              onClick={() => setActiveModal('help')}
              type="button"
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium text-[#4A211C] hover:bg-white/80 hover:text-[#54133F] transition-colors cursor-pointer border border-transparent hover:border-[#E8DFD8]"
            >
              <HelpCircle className="w-4 h-4 text-[#E56A21]" />
              <span>Help &amp; Support</span>
            </button>
          </nav>
        </div>

        {/* Proctor Integrity Badge */}
        <div className="mt-6 px-2">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/70 p-3 backdrop-blur-xs shadow-xs text-center">
            <div className="flex items-center justify-center space-x-1.5 text-emerald-800 text-xs font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Security Monitoring Active</span>
            </div>
            <p className="text-[11px] text-emerald-900/80 leading-snug">
              Zero tolerance active: Tab switch, window blur, or exiting fullscreen triggers instant elimination.
            </p>
          </div>
        </div>
      </aside>

      {/* Slide-over / Modal for Instructions, Rules, Help */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#E8DFD8] relative text-[#3E231C] max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              type="button"
              aria-label="Close"
              className="absolute top-5 right-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'instructions' && (
              <div>
                <h3 className="font-cormorant text-2xl font-bold text-[#54133F] mb-4">
                  Flip-Card Logo Identification Game
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-[#4A211C] leading-relaxed">
                  <p>• <strong>Hidden Mystery Card:</strong> Click &quot;Reveal Logo&quot; to flip the card and view the logo.</p>
                  <p>• <strong>Strict {cardFlipDurationSeconds}-Second Reveal:</strong> The card remains visible for exactly {cardFlipDurationSeconds} seconds, then permanently locks face-down.</p>
                  <p>• <strong>Identify from Memory:</strong> Select the correct brand name from the four text choices after the card locks.</p>
                  <p>• <strong>Review &amp; Submit:</strong> Complete all 50 questions within {overallDurationMinutes} minutes, review your answers, and explicitly submit Round 2.</p>
                </div>
              </div>
            )}

            {activeModal === 'rules' && (
              <div>
                <h3 className="font-cormorant text-2xl font-bold text-[#54133F] mb-4">
                  Round 2 Rules &amp; Guidelines
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-[#4A211C] leading-relaxed">
                  <p>• <strong>50 Logo Questions:</strong> Attend every question. Each question offers 4 text options.</p>
                  <p>• <strong>Single Reveal:</strong> The logo cannot be re-revealed once the {cardFlipDurationSeconds}-second window closes.</p>
                  <p className="text-rose-700 font-semibold">• <strong>Zero-Tolerance Elimination:</strong> Tab switch, window blur, or exiting fullscreen causes instant elimination with no second chance.</p>
                  <p>• <strong>Timer:</strong> Overall duration is {overallDurationMinutes} minutes. The quiz auto-submits when the timer ends.</p>
                </div>
              </div>
            )}

            {activeModal === 'help' && (
              <div>
                <h3 className="font-cormorant text-2xl font-bold text-[#54133F] mb-4">
                  Help &amp; Support
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-[#4A211C] leading-relaxed">
                  <p>If you encounter technical issues with card flip rendering, contact the proctor desk immediately.</p>
                  <p>Do NOT switch tabs or minimize the window.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
