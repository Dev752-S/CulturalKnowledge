import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';

interface GoogleLoginButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export default function GoogleLoginButton({ onClick, isLoading = false }: GoogleLoginButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      aria-label="Continue with Google"
      className="cultural-glass-button relative flex items-center justify-between w-full max-w-[450px] h-[58px] px-6 mx-auto cursor-pointer transition-colors duration-200 select-none group focus:outline-none focus:ring-2 focus:ring-[#C58A3A]/50 focus:ring-offset-2 focus:ring-offset-cream"
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Left: Official 4-Color Google Logo */}
      <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-[#8C5A28] animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
        )}
      </div>

      {/* Center: Button Text */}
      <span className="font-inter text-[16px] sm:text-[17px] font-medium text-[#251D18] tracking-normal text-center flex-1">
        {isLoading ? 'Connecting to Arena...' : 'Continue with Google'}
      </span>

      {/* Right: Golden Arrow with micro-translation on hover */}
      <motion.div
        className="flex items-center justify-center text-[#8C5A28] flex-shrink-0"
        initial={{ x: 0 }}
        whileHover={{ x: 4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1 text-[#8C5A28]" />
      </motion.div>
    </motion.button>
  );
}
