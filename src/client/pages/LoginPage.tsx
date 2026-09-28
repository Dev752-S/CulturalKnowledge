import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CulturalBackground from '../components/auth/CulturalBackground';
import TopBrand from '../components/auth/TopBrand';
import LoginCard from '../components/auth/LoginCard';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'participant.skp2026@gmail.com',
          name: 'SKP Cultural Fest Participant',
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Redirect to participant competition dashboard / rules
        navigate('/dashboard');
      } else {
        alert('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Unable to connect to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CulturalBackground>
      {/* Upper Section: Kala Sangamam Title & Gold Ornament */}
      <TopBrand />

      {/* Center Section: Glassmorphic Cultural Knowledge Card */}
      <div className="w-full flex-1 flex items-center justify-center py-6 px-4">
        <LoginCard onLogin={handleGoogleLogin} isLoading={isLoading} />
      </div>

      {/* Subtle Bottom Balance Spacer to preserve visual symmetry */}
      <div className="h-6 sm:h-8" />
    </CulturalBackground>
  );
}
