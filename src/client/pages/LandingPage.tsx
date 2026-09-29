import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CulturalHeader from '../components/landing/CulturalHeader';
import CulturalHero from '../components/landing/CulturalHero';
import EventRules from '../components/landing/EventRules';

export default function LandingPage() {
  const { user, hasTeamName, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Participant Route Guard (Section 58 & 59)
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/');
      } else if (!hasTeamName) {
        navigate('/team-name');
      }
    }
  }, [user, hasTeamName, isLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#FFF8EA] flex items-center justify-center text-[#54133F]">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 bg-[#C58A3A] rounded-full animate-ping" />
          <span className="font-cormorant text-xl text-[#54133F]">Loading Cultural Knowledge...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-between bg-[#FFF8EA] text-[#4A211C] overflow-x-hidden select-none"
      style={{
        backgroundImage: "url('/assets/cultural_landing_bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Soft Center Radial Lightener to guarantee flawless text legibility across all screens */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255, 248, 234, 0.75) 0%, rgba(255, 248, 234, 0.38) 60%, transparent 100%)',
        }}
      />

      {/* 1. Thin Horizontal Navigation Bar (Section 7–15) */}
      <div className="relative z-10 w-full">
        <CulturalHeader user={user} onLogout={handleLogout} />
      </div>

      {/* 2. Main Central Cultural Welcome Area (Section 24–37) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 py-6 sm:py-8 my-auto max-w-4xl mx-auto w-full">
        {/* Central Hero Stack: ‘Welcome to -> Cultural Knowledge -> Subtitle -> Description */}
        <CulturalHero />

        {/* Event Rules & Instructions (Section 31–37) */}
        <EventRules />

        {/* Subtle, understated Quiz Transition (Section 42 & 70) */}
        <div className="mt-7 sm:mt-9">
          <Link
            to="/quiz"
            className="group inline-flex items-center space-x-2 px-5 py-2 rounded-full border border-[#C58A3A]/40 bg-[#FFFDF9]/85 hover:bg-[#FFFDF9] text-[#54133F] hover:text-[#7A1C5B] text-xs font-semibold tracking-[1.5px] uppercase transition-all shadow-[0_2px_10px_rgba(84,19,63,0.06)] hover:shadow-[0_4px_16px_rgba(84,19,63,0.12)] cursor-pointer"
          >
            <span>Proceed to Quiz</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </main>

      {/* 3. Subtle Bottom Balance Padding */}
      <div className="relative z-10 h-3 sm:h-5 pointer-events-none" />
    </div>
  );
}
