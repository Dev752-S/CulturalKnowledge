import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import TeamNamePage from './pages/TeamNamePage';
import LandingPage from './pages/LandingPage';
import EventSelectorPage from './pages/EventSelectorPage';
import QuizRound1Page from './pages/QuizRound1Page';
import QuizResultPage from './pages/QuizResultPage';
import QuizRound2Page from './pages/QuizRound2Page';
import QuizRound2ResultPage from './pages/QuizRound2ResultPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';

function PageLoading() {
  return (
    <div className="min-h-screen bg-[#F5EFE4] flex items-center justify-center text-[#5A2920]">
      <div className="flex items-center space-x-3">
        <div className="w-2.5 h-2.5 bg-[#C58A3A] rounded-full animate-ping" />
        <span className="font-cormorant text-xl">Loading SKP Skill Arena...</span>
      </div>
    </div>
  );
}

/**
 * RootRoute: Authority-driven root route (/)
 * - Unauthenticated -> Displays LoginPage directly at /
 * - Authenticated without team name -> Redirects to /team-name
 * - Authenticated with team name -> Displays New Landing Page
 */
function RootRoute() {
  const { user, hasTeamName, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoading />;
  }

  // 1. Unauthenticated -> Login Page
  if (!user) {
    return <LoginPage />;
  }

  // 2. Authenticated but team name missing -> /team-name
  if (!hasTeamName) {
    return <Navigate to="/team-name" replace />;
  }

  // 3. Authenticated + team name completed -> New Landing Page
  return <LandingPage />;
}

/**
 * TeamNameRoute (/team-name)
 * - Unauthenticated -> Redirects to / (Login Page)
 * - Authenticated with team -> Redirects to / (Landing Page)
 * - Authenticated without team -> Renders TeamNamePage
 */
function TeamNameRoute() {
  const { user, hasTeamName, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoading />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (hasTeamName) {
    return <Navigate to="/" replace />;
  }

  return <TeamNamePage />;
}

/**
 * LoginRoute (/login)
 * - Unauthenticated -> Displays LoginPage
 * - Authenticated without team -> Redirects to /team-name
 * - Authenticated with team -> Redirects to / (Landing Page)
 */
function LoginRoute() {
  const { user, hasTeamName, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoading />;
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!hasTeamName) {
    return <Navigate to="/team-name" replace />;
  }

  return <Navigate to="/" replace />;
}

function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Link to="/" className="text-amber-400 hover:text-amber-300 text-sm font-medium mb-8 inline-block">
        ← Back to Arena
      </Link>
      <h1 className="text-3xl font-bold text-white mb-6">Skill Arena Official Competition Rules</h1>
      <div className="space-y-6 text-slate-300 leading-relaxed glass-panel p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white mb-2">Round 1: 100 MCQ Examination</h2>
          <p className="text-sm text-slate-400">
            60-minute server-authoritative timer. 100 randomized questions covering general and technical domains. Answers auto-save in real time.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white mb-2">Anti-Cheat Compliance</h2>
          <p className="text-sm text-slate-400">
            Webcam preflight check required. Fullscreen and active window monitoring signals recorded for proctor review.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white mb-2">Round 2: Top 15 Finalist Logo Arena</h2>
          <p className="text-sm text-slate-400">
            50 questions logo quiz. Visual logo options with 30-minute focused participation.
          </p>
        </div>
      </div>
    </div>
  );
}

function SchedulePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Link to="/" className="text-amber-400 hover:text-amber-300 text-sm font-medium mb-8 inline-block">
        ← Back to Arena
      </Link>
      <h1 className="text-3xl font-bold text-white mb-6">SKP Cultural Fest 2026 Schedule</h1>
      <div className="glass-panel p-8 rounded-2xl text-slate-300 space-y-4 bg-slate-900/60 border border-slate-800">
        <div className="flex justify-between border-b border-slate-800 pb-3">
          <span className="font-semibold text-white">Participant Check-in &amp; Preflight</span>
          <span className="text-amber-400">09:00 AM – 10:00 AM</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-3">
          <span className="font-semibold text-white">Round 1 MCQ Examination (60 mins)</span>
          <span className="text-amber-400">10:30 AM – 11:30 AM</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-3">
          <span className="font-semibold text-white">Qualification &amp; Top 15 Announcement</span>
          <span className="text-amber-400">01:30 PM – 02:00 PM</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-white">Round 2 Auditorium Logo Arena</span>
          <span className="text-amber-400">02:30 PM – 05:00 PM</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main URL /: Opens Login Page if unauth, /team-name if no team, or New Landing Page */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/team-name" element={<TeamNameRoute />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/events" element={<EventSelectorPage />} />
          <Route path="/quiz" element={<Navigate to="/quiz/round-1" replace />} />
          <Route path="/quiz/round-1" element={<QuizRound1Page />} />
          <Route path="/quiz/round-1/result" element={<QuizResultPage />} />
          <Route path="/quiz/round-2" element={<QuizRound2Page />} />
          <Route path="/quiz/round-2/result" element={<QuizRound2ResultPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/dev" element={<AdminPage />} />
          <Route path="/admin" element={<Navigate to="/dev" replace />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
