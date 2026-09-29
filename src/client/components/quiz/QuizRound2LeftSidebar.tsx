import { useState, useRef, useEffect } from 'react';
import { Award, FileText, BookOpen, ShieldAlert, HelpCircle, X, CheckCircle } from 'lucide-react';

interface QuizRound2LeftSidebarProps {
  cameraStream: MediaStream | null;
}

type ActiveNavModal = 'instructions' | 'rules' | 'help' | null;

export default function QuizRound2LeftSidebar({ cameraStream }: QuizRound2LeftSidebarProps) {
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
          {/* Header */}
          <div className="flex items-center space-x-3 px-3 py-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#54133F] via-[#7B1D5C] to-[#E56A21] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Award className="w-5 h-5 text-[#FFF8EA]" />
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

        {/* Live Proctoring Webcam Stream Display */}
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
                  Round 2 — Logo Quiz Instructions
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-[#4A211C] leading-relaxed">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>This round contains <strong>50 visual logo identification questions</strong>.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Each question presents <strong>four visual logo options (A, B, C, D)</strong>. Select one answer.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>This round is <strong>untimed</strong>. Take your time to carefully identify each emblem.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Your selections are <strong>saved automatically</strong> to the server as you click.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Navigate freely between questions using the <strong>Question Navigator</strong> on the right.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Use <strong>Mark for Review</strong> to flag questions to revisit before final submission.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Submit your examination when you have completed all questions.</span>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'rules' && (
              <div>
                <h3 className="font-cormorant text-2xl font-bold text-[#54133F] mb-4">
                  Competition Integrity &amp; Security Rules
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-[#4A211C] leading-relaxed">
                  <p>• <strong>No External AI Assistance:</strong> The use of external AI or automated tools is strictly prohibited.</p>
                  <p>• <strong>Single Window Policy:</strong> Do not switch browser tabs or leave the examination window.</p>
                  <p>• <strong>Unauthorized Devices:</strong> Using secondary monitors or unauthorized handheld devices during the quiz is prohibited.</p>
                  <p>• <strong>Security Signal Logging:</strong> Fullscreen exits and window focus changes are recorded automatically for review.</p>
                  <p>• <strong>Proctoring Stream:</strong> If webcam monitoring was selected at preflight, maintain your position in the camera view.</p>
                </div>
              </div>
            )}

            {activeModal === 'help' && (
              <div>
                <h3 className="font-cormorant text-2xl font-bold text-[#54133F] mb-4">
                  Need Help during the Quiz?
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-[#4A211C] leading-relaxed">
                  <p>• <strong>Connection Lost?</strong> If your internet drops temporarily, the arena will reconnect automatically and restore your answers from the server.</p>
                  <p>• <strong>Logo image not loading?</strong> The platform will automatically load a crisp PNG fallback for any SVG asset.</p>
                  <p>• <strong>Accidental Exit?</strong> You can re-open the examination link and resume from where you left off until you submit.</p>
                  <p>• <strong>Proctor Assistance:</strong> If you face hardware issues, raise your hand to alert the hall supervisor immediately.</p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#E8DFD8] text-right">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-[#54133F] text-white text-xs sm:text-sm font-semibold hover:bg-[#6E1A52] transition-colors cursor-pointer"
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
