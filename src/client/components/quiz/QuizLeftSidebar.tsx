import { useState } from 'react';
import { FileText, BookOpen, HelpCircle, X, ShieldCheck } from 'lucide-react';

interface QuizLeftSidebarProps {
  cameraStream?: MediaStream | null;
}

type ActiveNavModal = 'instructions' | 'rules' | 'help' | null;

export default function QuizLeftSidebar({}: QuizLeftSidebarProps) {
  const [activeModal, setActiveModal] = useState<ActiveNavModal>(null);

  return (
    <>
      <aside className="w-full md:w-56 lg:w-64 flex flex-col justify-between py-2 sm:py-4 select-none">
        {/* Top Header & Navigation Items */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3 px-3 py-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#54133F] via-[#7B1D5C] to-[#E56A21] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <FileText className="w-5 h-5 text-[#FFF8EA]" />
            </div>
            <div>
              <span className="block text-xs font-bold text-[#E56A21] uppercase tracking-wider">
                Question Paper
              </span>
              <h2 className="font-cormorant text-xl sm:text-2xl font-bold text-[#54133F] leading-tight">
                Cultural Quiz
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
              <FileText className="w-4 h-4 text-[#E56A21]" />
              <span>Instructions</span>
            </button>

            <button
              onClick={() => setActiveModal('rules')}
              type="button"
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium text-[#4A211C] hover:bg-white/80 hover:text-[#54133F] transition-colors cursor-pointer border border-transparent hover:border-[#E8DFD8]"
            >
              <BookOpen className="w-4 h-4 text-[#E56A21]" />
              <span>Rules &amp; Scoring</span>
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
                  Instructions
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-[#4A211C] leading-relaxed">
                  <p>• <strong>100 MCQ Questions:</strong> Single correct answer per question.</p>
                  <p>• <strong>Navigation:</strong> Use &quot;Next&quot; / &quot;Previous&quot; or click question numbers directly from the navigator grid.</p>
                  <p>• <strong>Autosave:</strong> Every option selected is instantly autosaved to the server.</p>
                  <p>• <strong>Review Later:</strong> Bookmark questions to revisit before final submission.</p>
                </div>
              </div>
            )}

            {activeModal === 'rules' && (
              <div>
                <h3 className="font-cormorant text-2xl font-bold text-[#54133F] mb-4">
                  Rules &amp; Anti-Cheat
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-[#4A211C] leading-relaxed">
                  <p>• <strong>Duration:</strong> 60 minutes server-authoritative countdown.</p>
                  <p className="text-rose-700 font-semibold">• <strong>Zero-Tolerance Elimination:</strong> Any window blur, tab switch, or fullscreen exit triggers instant disqualification.</p>
                  <p>• <strong>Final Submission:</strong> Quiz submits automatically when time expires, or upon explicit submit confirmation.</p>
                </div>
              </div>
            )}

            {activeModal === 'help' && (
              <div>
                <h3 className="font-cormorant text-2xl font-bold text-[#54133F] mb-4">
                  Help &amp; Support
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-[#4A211C] leading-relaxed">
                  <p>If you encounter technical issues, contact the proctor desk or test coordinator immediately.</p>
                  <p>Do NOT refresh or switch tabs unless instructed by an official coordinator.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
