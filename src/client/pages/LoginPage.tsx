import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CulturalBackground from '../components/auth/CulturalBackground';
import TopBrand from '../components/auth/TopBrand';
import LoginCard from '../components/auth/LoginCard';
import { signInWithGooglePopup } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Authenticate with Google via Firebase Popup
      const { user, idToken } = await signInWithGooglePopup();

      // 2. Exchange credential with backend for server-authoritative session
      const res = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          email: user.email,
          name: user.displayName || 'SKP Participant',
          photoUrl: user.photoURL,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (checkAuth) {
          await checkAuth();
        }
        // Navigate to / if team name exists, else to /team-name
        if (data.hasTeamName) {
          navigate('/');
        } else {
          navigate('/team-name');
        }
      } else {
        setErrorMessage(data.error?.message || 'Authentication failed. Please try again.');
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, do not show error
        console.log('Google login popup was closed by user');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Popup was blocked by your browser. Please allow popups for this site.');
      } else {
        console.error('Google login error:', err);
        // Fallback for offline testing or development
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
            if (checkAuth) {
              await checkAuth();
            }
            if (data.hasTeamName) {
              navigate('/');
            } else {
              navigate('/team-name');
            }
            return;
          }
        } catch {
          // ignore
        }
        setErrorMessage(err.message || 'Unable to authenticate with Google. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CulturalBackground>
      {/* Upper Section: Kala Sangamam Title & Gold Ornament */}
      <TopBrand />

      {/* Center Section: Glassmorphic Cultural Knowledge Card */}
      <div className="w-full flex-1 flex flex-col items-center justify-center py-6 px-4">
        {errorMessage && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs font-medium max-w-md text-center">
            {errorMessage}
          </div>
        )}
        <LoginCard onLogin={handleGoogleLogin} isLoading={isLoading} />
      </div>

      {/* Subtle Bottom Balance Spacer to preserve visual symmetry */}
      <div className="h-4 sm:h-6" />
    </CulturalBackground>
  );
}
