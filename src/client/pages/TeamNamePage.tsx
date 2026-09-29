import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import DecorativeDivider from '../components/auth/DecorativeDivider';

export default function TeamNamePage() {
  const [teamName, setTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { checkAuth: syncAuth } = useAuth();

  // Authentication check and bypass protection (Section 14 & 15)
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/v1/auth/me');
        const data = await res.json();

        if (!data.success || !data.user) {
          // Unauthenticated user -> redirect to login (root /)
          navigate('/');
          return;
        }

        // If user already has a team name, redirect to Landing Page (root /)
        if (data.hasTeamName || (data.user.teamName && data.user.teamName.trim().length > 0)) {
          navigate('/');
          return;
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        navigate('/');
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = teamName.trim();

    if (!trimmed) {
      setError('Please enter your team name.');
      return;
    }

    if (trimmed.length < 2) {
      setError('Team name must be at least 2 characters long.');
      return;
    }

    if (trimmed.length > 50) {
      setError('Team name cannot exceed 50 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/participant/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: trimmed }),
      });

      const data = await res.json();

      if (data.success) {
        if (syncAuth) {
          await syncAuth();
        }
        // Navigate to Landing Page on success
        navigate('/');
      } else {
        setError(data.error?.message || 'Failed to register team name. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting team name:', err);
      setError('Unable to save team name. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F5EFE4] flex items-center justify-center text-[#5A2920]">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 bg-[#C58A3A] rounded-full animate-ping" />
          <span className="font-cormorant text-xl">Verifying session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F5EFE4] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 select-none">
      {/* High-Resolution Watercolor Cultural Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-95 transition-opacity duration-1000"
        style={{
          backgroundImage: "url('/assets/cultural_watercolor_bg.jpg')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      {/* Central Soft Translucent Radial Layer for optimal card legibility */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(245, 239, 228, 0.55) 0%, rgba(245, 239, 228, 0.2) 65%, transparent 100%)',
        }}
      />

      {/* Centered Composition: Title -> Ornament -> Centered Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[620px] flex flex-col items-center text-center my-auto"
      >
        {/* Main Page Title: Cultural Knowledge */}
        <h1 className="font-cormorant text-4xl sm:text-5xl md:text-[56px] lg:text-[64px] font-medium tracking-[2px] sm:tracking-[3px] text-[#4A211C] select-none leading-tight">
          Cultural Knowledge
        </h1>

        {/* Subtle Cultural Decorative Ornament */}
        <div className="my-2.5 sm:my-3.5 w-full">
          <DecorativeDivider />
        </div>

        {/* Central Form Container */}
        <div
          className="w-[calc(100%-16px)] sm:w-full max-w-[580px] rounded-[24px] p-8 sm:p-10 md:p-12 backdrop-blur-md flex flex-col items-center text-center transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.78)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 18px 50px rgba(70, 40, 25, 0.16)',
          }}
        >
          {/* Team Name Heading */}
          <h2
            className="font-cormorant text-3xl sm:text-4xl md:text-[46px] font-medium tracking-tight mb-6 sm:mb-8 select-none leading-none"
            style={{ color: '#4A211C' }}
          >
            Team Name
          </h2>

          {error && (
            <div className="w-full max-w-[400px] mb-5 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs sm:text-sm font-medium text-center shadow-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
            {/* Input Box */}
            <div className="w-full max-w-[400px]">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name..."
                disabled={isLoading}
                autoFocus
                className="w-full h-[58px] px-5 rounded-[12px] text-center sm:text-left text-[#251D18] placeholder-slate-400 text-base sm:text-lg font-inter focus:outline-none focus:ring-2 focus:ring-[#B87932]/50 focus:border-[#B87932] transition-all shadow-inner"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(90, 70, 60, 0.3)',
                }}
                maxLength={50}
              />
            </div>

            {/* Continue Button Inside Container */}
            <motion.button
              type="submit"
              disabled={isLoading || !teamName.trim()}
              whileHover={!isLoading && teamName.trim() ? { y: -2, scale: 1.01 } : {}}
              whileTap={!isLoading && teamName.trim() ? { scale: 0.98 } : {}}
              className={`mt-6 sm:mt-8 w-full max-w-[280px] h-[52px] sm:h-[54px] rounded-xl font-inter text-xs sm:text-sm font-semibold tracking-[2px] uppercase select-none transition-all duration-200 shadow-[0_4px_16px_rgba(74,33,28,0.22)] ${
                isLoading || !teamName.trim()
                  ? 'opacity-50 cursor-not-allowed bg-[#4A211C] text-white/70'
                  : 'bg-gradient-to-r from-[#4A211C] via-[#5C2720] to-[#4A211C] hover:from-[#5C2720] hover:via-[#6E3027] hover:to-[#5C2720] hover:shadow-[0_8px_24px_rgba(74,33,28,0.3)] text-white cursor-pointer'
              }`}
            >
              {isLoading ? 'SAVING...' : 'CONTINUE'}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
