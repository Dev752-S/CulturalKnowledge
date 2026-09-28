import { motion } from 'framer-motion';
import GoogleLoginButton from './GoogleLoginButton';

interface LoginCardProps {
  onLogin: () => void;
  isLoading?: boolean;
}

export default function LoginCard({ onLogin, isLoading }: LoginCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      className="cultural-glass-card relative w-full max-w-[650px] min-h-[460px] sm:min-h-[480px] p-8 sm:p-12 mx-auto flex flex-col items-center justify-between text-center overflow-hidden"
    >
      {/* Top-Left Gold Corner Floral Filigree */}
      <div className="absolute top-3 left-3 w-16 h-16 pointer-events-none opacity-40 select-none">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#B87932]">
          <path
            d="M4 4C18 4 30 16 30 30M4 4C4 18 16 30 30 30M4 4L22 22M14 6C18 10 20 18 20 24M6 14C10 18 18 20 24 20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="8" r="2.5" fill="currentColor" />
        </svg>
      </div>

      {/* Bottom-Right Gold Corner Floral Filigree */}
      <div className="absolute bottom-3 right-3 w-16 h-16 pointer-events-none opacity-40 select-none rotate-180">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#B87932]">
          <path
            d="M4 4C18 4 30 16 30 30M4 4C4 18 16 30 30 30M4 4L22 22M14 6C18 10 20 18 20 24M6 14C10 18 18 20 24 20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="8" r="2.5" fill="currentColor" />
        </svg>
      </div>

      {/* Upper Content Section */}
      <div className="w-full flex flex-col items-center">
        {/* ──── WELCOME TO ──── */}
        <div className="flex items-center justify-center space-x-3 w-full max-w-xs mb-4">
          <span className="h-[1px] w-8 sm:w-12 bg-gradient-to-r from-transparent to-[#B87932]" />
          <span className="font-inter text-[12px] sm:text-[14px] font-semibold tracking-[4px] sm:tracking-[5px] text-[#5A2920] uppercase select-none">
            WELCOME TO
          </span>
          <span className="h-[1px] w-8 sm:w-12 bg-gradient-to-l from-transparent to-[#B87932]" />
        </div>

        {/* Main Title: Cultural Knowledge (2 lines) */}
        <h2 className="font-cormorant text-5xl sm:text-6xl md:text-[64px] font-medium text-[#4A1F1A] leading-[1.05] tracking-tight mb-4 select-none">
          Cultural<br />Knowledge
        </h2>

        {/* Subtitle: Explore · Learn · Celebrate */}
        <p className="font-inter text-[12px] sm:text-[13px] font-medium tracking-[3px] sm:tracking-[4px] text-[#665B55] uppercase select-none mb-8">
          Explore · Learn · Celebrate
        </p>
      </div>

      {/* Lower Section: Google Login Button */}
      <div className="w-full flex justify-center pb-2">
        <GoogleLoginButton onClick={onLogin} isLoading={isLoading} />
      </div>
    </motion.div>
  );
}
