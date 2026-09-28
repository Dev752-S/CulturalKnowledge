import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function TeamNamePage() {
  const [teamName, setTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Authentication check and bypass protection (Section 14 & 15)
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/v1/auth/me');
        const data = await res.json();

        if (!data.success || !data.user) {
          // Unauthenticated user -> redirect to login
          navigate('/login');
          return;
        }

        // If user already has a team name, redirect to Landing Page
        if (data.hasTeamName || (data.user.teamName && data.user.teamName.trim().length > 0)) {
          navigate('/');
          return;
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        navigate('/login');
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
        // Navigate to Landing Page on success (Section 16)
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F5EFE4] flex flex-col justify-between p-4 sm:p-6 md:p-10 select-none">
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
          background: 'radial-gradient(ellipse at center, rgba(245, 239, 228, 0.45) 0%, rgba(245, 239, 228, 0.1) 70%, transparent 100%)',
        }}
      />

      {/* Top Header: NEXT PAGE */}
      <header className="relative z-10 w-full pt-4 sm:pt-8 text-center">
        <h1 className="font-cormorant text-4xl sm:text-5xl md:text-6xl font-normal tracking-[4px] sm:tracking-[6px] text-[#4A1F1A] uppercase select-none">
          NEXT PAGE
        </h1>
      </header>

      {/* Center Section: Team Name Card + Continue Button to the right */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center py-6 px-4">
        {error && (
          <div className="mb-4 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs sm:text-sm font-medium max-w-md text-center shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* Centered White / Light Team Name Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[420px] bg-white/95 rounded-[16px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(80,50,30,0.12),0_2px_8px_rgba(0,0,0,0.04)] border border-white/90 flex flex-col items-center text-center backdrop-blur-sm"
          >
            <h2 className="font-cormorant text-3xl sm:text-4xl font-medium text-[#4A1F1A] mb-6 tracking-tight select-none">
              Team Name
            </h2>

            <div className="w-full">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name..."
                disabled={isLoading}
                autoFocus
                className="w-full h-[50px] sm:h-[54px] px-4 rounded-xl border border-slate-300 bg-white text-[#251D18] placeholder-slate-400 text-sm sm:text-base font-inter focus:outline-none focus:ring-2 focus:ring-[#B87932]/40 focus:border-[#B87932] transition-all"
                maxLength={50}
              />
            </div>
          </motion.div>

          {/* Continue Button to the Right of the Card on Desktop */}
          <motion.button
            type="submit"
            disabled={isLoading || !teamName.trim()}
            whileHover={!isLoading && teamName.trim() ? { scale: 1.02 } : {}}
            whileTap={!isLoading && teamName.trim() ? { scale: 0.98 } : {}}
            className={`h-[50px] sm:h-[54px] px-8 rounded-xl border border-[#2E1810] bg-white text-[#2E1810] font-inter text-xs sm:text-sm font-semibold tracking-[2px] uppercase select-none transition-all duration-200 shadow-sm ${
              isLoading || !teamName.trim()
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-slate-50 hover:shadow-md cursor-pointer'
            }`}
          >
            {isLoading ? 'SAVING...' : 'CONTINUE'}
          </motion.button>
        </form>
      </main>

      {/* Bottom Spacer */}
      <footer className="relative z-10 w-full h-8" />
    </div>
  );
}
