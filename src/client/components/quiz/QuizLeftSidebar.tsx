import { useState, useRef, useEffect } from 'react';
import { FileText, BookOpen, ShieldAlert, HelpCircle, X } from 'lucide-react';

interface QuizLeftSidebarProps {
  cameraStream: MediaStream | null;
}

type ActiveNavModal = 'instructions' | 'rules' | 'help' | null;

export default function QuizLeftSidebar({ cameraStream }: QuizLeftSidebarProps) {
  const [activeModal, setActiveModal] = useState<ActiveNavModal>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  return (
    <>
      <aside className="w-full md:w-56 lg:w-64 flex flex-col justify-between py-2 sm:py-4 select-none">
        {/* Top Header & Navigation Items */}
        <div className="space-y-6">
          {/* Header (Section 28) */}
          <div className="flex items-center space-x-3 px-3 py-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#54133F] via-[#7B1D5C] to-[#E56A21] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <FileText className="w-5 h-5 text-[#FFF8EA]" />
            </div>
            <div>
              <span className="block text-xs font-bold text-[#E56A21] uppercase tracking-wider">
                Round 1
              </span>
              <h2 className="font-cormorant text-xl sm:text-2xl font-bold text-[#54133F] leading-tight">
                Cultural Quiz
              </h2>
            </div>
          </div>

          {/* Navigation Items (Section 29 & 30) */}
          <nav className="space-y-1.5 px-1">
            {/* Question Paper (Active) */}
            <div
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-2xl bg-[#FCE6D0] text-[#54133F] font-semibold text-sm shadow-xs border border-[#E56A21]/20 cursor-default"
            >
              <FileText className="w-4 h-4 text-[#E56A21]" />
              <span>Question Paper</span>
            </div>

            {/* Instructions */}
            <button
              type="button"
              onClick={() => setActiveModal('instructions')}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-[#633027] hover:bg-white/60 hover:text-[#54133F] font-medium text-sm transition-colors text-left cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#7A4232]" />
              <span>Instructions</span>
            </button>

            {/* Rules */}
            <button
              type="button"
              onClick={() => setActiveModal('rules')}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-[#633027] hover:bg-white/60 hover:text-[#54133F] font-medium text-sm transition-colors text-left cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-[#7A4232]" />
              <span>Rules</span>
            </button>

            {/* Help */}
            <button
              type="button"
              onClick={() => setActiveModal('help')}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-[#633027] hover:bg-white/60 hover:text-[#54133F] font-medium text-sm transition-colors text-left cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#7A4232]" />
              <span>Help</span>
            </button>
          </nav>
        </div>

        {/* Live Proctoring Webcam Stream Display (Section 16) */}
        {cameraStream && (
          <div className="mt-6 px-2">
            <div className="rounded-2xl overflow-hidden border border-[#E56A21]/30 bg-black/5 p-2 backdrop-blur-xs shadow-xs">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute top-1.5 left-1.5 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Proctor Cam</span>
                </div>
              </div>
              <p className="text-[10px] text-center text-[#7A4232] mt-1.5 font-medium">
                Live Proctoring Active
              </p>
            </div>
          </div>
        )}
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
                  Examination Instructions
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-[#4A211C] leading-relaxed">
                  <p>• The quiz comprises <strong>100 Multiple Choice Questions</strong>.</p>
                  <p>• Total examination duration is <strong>60 minutes</strong>.</p>
                  <p>• Each question carries <strong>1 positive mark</strong>. There is no negative marking.</p>
                  <p>• You may jump between questions at any time using the <strong>Question Navigator</strong>.</p>
                  <p>• Use <strong>Mark for Review</strong> to flag questions you wish to revisit before final submission.</p>
                  <p>• Answers are <strong>autosaved immediately</strong> upon selection.</p>
                  <p>• When the timer expires, your examination will automatically submit.</p>
                </div>
              </div>
            )}

            {activeModal === 'rules' && (
              <div>
                <h3 className="font-cormorant text-2xl font-bold text-[#54133F] mb-4">
                  Official Competition Rules
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-[#4A211C] leading-relaxed">
                  <p>• <strong>Single Device Lock:</strong> Only one active session is authorized per team attempt.</p>
                  <p>• <strong>No External AI:</strong> External AI tools, search assistants, and chatbots are strictly prohibited.</p>
                  <p>• <strong>Stay in Fullscreen:</strong> Exiting fullscreen or switching browser tabs will record security signals.</p>
                  <p>• <strong>Proctor Verification:</strong> Live proctoring logs and camera availability are monitored.</p>
                  <p>• <strong>Server Authority:</strong> Timer, question mapping, and scoring are evaluated server-side.</p>
                </div>
              </div>
            )}

            {activeModal === 'help' && (
              <div>
                <h3 className="font-cormorant text-2xl font-bold text-[#54133F] mb-4">
                  Technical Support &amp; Help
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-[#4A211C] leading-relaxed">
                  <p>• If your network disconnects, keep the tab open. The quiz will auto-reconnect and sync with the server.</p>
                  <p>• To report a technical anomaly or question issue, notify your assigned room proctor.</p>
                  <p>• Do not close your browser window during an active attempt.</p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#E8DFD8] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="py-2 px-5 rounded-xl bg-[#54133F] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#6E1A52] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
