import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, RefreshCw, ArrowLeft, Users, Sparkles, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CulturalHeader from '../components/landing/CulturalHeader';

interface Round1Entry {
  rank: number;
  participantId: string;
  participantName: string;
  teamName: string;
  score: number;
  accuracyPercentage: string;
  submittedAt: string | null;
}

interface Round2Entry {
  rank: number;
  participantId: string;
  participantName: string;
  teamName: string;
  score: number;
  answeredCount: number;
  correctCount: number;
  submittedAt: string | null;
}

interface OverallEntry {
  rank: number;
  teamName: string;
  participantName: string;
  round1Score: number;
  round2Score: number;
  totalScore: number;
}

export default function LeaderboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overall' | 'round1' | 'round2'>('overall');
  const [round1List, setRound1List] = useState<Round1Entry[]>([]);
  const [round2List, setRound2List] = useState<Round2Entry[]>([]);
  const [overallList, setOverallList] = useState<OverallEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLeaderboards = async () => {
    try {
      const res = await fetch('/api/v1/leaderboard/all');
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.round1)) setRound1List(data.round1);
        if (Array.isArray(data.round2)) setRound2List(data.round2);
        if (Array.isArray(data.overall)) setOverallList(data.overall);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboards:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeaderboards();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-lg bg-amber-400 text-amber-950 font-bold flex items-center justify-center shadow-xs">
          1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-lg bg-stone-300 text-stone-900 font-bold flex items-center justify-center shadow-xs">
          2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-lg bg-amber-700/80 text-white font-bold flex items-center justify-center shadow-xs">
          3
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-lg bg-stone-100 text-[#7A4232] font-semibold flex items-center justify-center border border-stone-200">
        {rank}
      </div>
    );
  };

  const currentListLength =
    activeTab === 'overall' ? overallList.length : activeTab === 'round1' ? round1List.length : round2List.length;

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-between bg-[#FFF8EA] text-[#4A211C] select-none"
      style={{
        backgroundImage: "url('/assets/cultural_landing_bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background Soft Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255, 248, 234, 0.85) 0%, rgba(255, 248, 234, 0.5) 65%, transparent 100%)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 w-full">
        <CulturalHeader user={user} onLogout={handleLogout} />
      </div>

      {/* Main Leaderboard Content */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        {/* Title Stack */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#E56A21]/10 border border-[#E56A21]/30 text-[#E56A21] text-xs font-semibold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>Official Competition Standings</span>
          </div>
          <h1 className="font-cormorant text-4xl sm:text-5xl font-bold text-[#54133F] tracking-wide">
            SKP Arena Leaderboard
          </h1>
          <p className="font-cormorant text-base sm:text-lg text-[#7A4232] mt-1 max-w-xl mx-auto">
            Live official rankings across Round 1 (Cultural Quiz), Round 2 (Logo Flip Arena), and Overall Combined Standings.
          </p>
        </div>

        {/* 3 Leaderboard Tabs Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overall')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 shadow-xs ${
              activeTab === 'overall'
                ? 'bg-gradient-to-r from-[#54133F] to-[#E56A21] text-white shadow-md'
                : 'bg-white/80 text-[#54133F] hover:bg-white border border-[#E8DFD8]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Overall Dashboard (R1 + R2)</span>
          </button>

          <button
            onClick={() => setActiveTab('round1')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 shadow-xs ${
              activeTab === 'round1'
                ? 'bg-gradient-to-r from-[#54133F] to-[#E56A21] text-white shadow-md'
                : 'bg-white/80 text-[#54133F] hover:bg-white border border-[#E8DFD8]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Round 1 Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('round2')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 shadow-xs ${
              activeTab === 'round2'
                ? 'bg-gradient-to-r from-[#54133F] to-[#E56A21] text-white shadow-md'
                : 'bg-white/80 text-[#54133F] hover:bg-white border border-[#E8DFD8]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Round 2 Leaderboard</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/events"
            className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-[#54133F] hover:text-[#E56A21] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Events</span>
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white/80 border border-[#E8DFD8] text-xs sm:text-sm font-semibold text-[#54133F] hover:bg-white hover:border-[#E56A21]/40 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#E56A21]' : 'text-[#7A4232]'}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Standings'}</span>
          </button>
        </div>

        {/* Leaderboard Table Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-4 sm:p-6 md:p-8 border border-white/80 shadow-[0_16px_50px_rgba(84,19,63,0.1)]">
          {isLoading ? (
            <div className="py-16 text-center text-[#54133F]">
              <div className="w-3 h-3 bg-[#E56A21] rounded-full animate-ping mx-auto mb-3" />
              <p className="font-cormorant text-lg text-[#7A4232]">Loading Standings...</p>
            </div>
          ) : currentListLength === 0 ? (
            <div className="py-16 text-center text-[#7A4232]">
              <Trophy className="w-12 h-12 text-[#E56A21]/40 mx-auto mb-3" />
              <h3 className="font-cormorant text-2xl font-bold text-[#54133F] mb-1">
                No Submissions Recorded Yet
              </h3>
              <p className="text-xs sm:text-sm max-w-md mx-auto text-[#8A6D65] mb-6">
                {activeTab === 'round1'
                  ? 'Complete and submit Round 1 (Cultural Quiz) to view team marks here.'
                  : activeTab === 'round2'
                  ? 'Complete and submit Round 2 (Logo Flip Arena) to view team marks here.'
                  : 'Submit attempts across Round 1 and Round 2 to populate the Overall Leaderboard.'}
              </p>
              <Link
                to="/events"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E56A21] to-[#54133F] text-white text-xs font-semibold uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
              >
                <span>Go to Event Selector</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Tab 1: Overall Dashboard */}
              {activeTab === 'overall' && (
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#E8DFD8] text-[#8A6D65] uppercase text-[11px] font-semibold tracking-wider">
                      <th className="py-3 px-3">Rank</th>
                      <th className="py-3 px-4">Team &amp; Contestant</th>
                      <th className="py-3 px-4 text-center">Round 1 (Cultural)</th>
                      <th className="py-3 px-4 text-center">Round 2 (Logos)</th>
                      <th className="py-3 px-4 text-right">Overall Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E6DE]">
                    {overallList.map((entry) => {
                      const isUserTeam =
                        user?.teamName && entry.teamName.toLowerCase() === user.teamName.toLowerCase();

                      return (
                        <tr
                          key={entry.teamName}
                          className={`transition-colors ${
                            isUserTeam ? 'bg-[#FFF8EA]/80 font-medium' : 'hover:bg-[#FFFDF9]'
                          }`}
                        >
                          <td className="py-3.5 px-3">{renderRankBadge(entry.rank)}</td>
                          <td className="py-3.5 px-4">
                            <div>
                              <div className="flex items-center space-x-1.5 text-[#54133F] font-bold text-sm sm:text-base">
                                <Users className="w-3.5 h-3.5 text-[#E56A21]" />
                                <span>{entry.teamName}</span>
                                {isUserTeam && (
                                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#E56A21]/15 text-[#E56A21] border border-[#E56A21]/30">
                                    Your Team
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#7A4232]">{entry.participantName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-semibold text-[#54133F]">
                            {entry.round1Score}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-semibold text-[#E56A21]">
                            {entry.round2Score}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-mono text-base sm:text-lg font-bold text-[#54133F] bg-[#54133F]/5 px-3 py-1 rounded-xl border border-[#54133F]/15">
                              {entry.totalScore}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Tab 2: Round 1 Leaderboard */}
              {activeTab === 'round1' && (
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#E8DFD8] text-[#8A6D65] uppercase text-[11px] font-semibold tracking-wider">
                      <th className="py-3 px-3">Rank</th>
                      <th className="py-3 px-4">Team &amp; Participant</th>
                      <th className="py-3 px-4 text-center">Accuracy</th>
                      <th className="py-3 px-4 text-right">Round 1 Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E6DE]">
                    {round1List.map((entry) => {
                      const isUserTeam =
                        user?.teamName && entry.teamName.toLowerCase() === user.teamName.toLowerCase();

                      return (
                        <tr
                          key={entry.participantId}
                          className={`transition-colors ${
                            isUserTeam ? 'bg-[#FFF8EA]/80 font-medium' : 'hover:bg-[#FFFDF9]'
                          }`}
                        >
                          <td className="py-3.5 px-3">{renderRankBadge(entry.rank)}</td>
                          <td className="py-3.5 px-4">
                            <div>
                              <div className="flex items-center space-x-1.5 text-[#54133F] font-bold text-sm sm:text-base">
                                <Users className="w-3.5 h-3.5 text-[#E56A21]" />
                                <span>{entry.teamName}</span>
                                {isUserTeam && (
                                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#E56A21]/15 text-[#E56A21] border border-[#E56A21]/30">
                                    Your Team
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#7A4232]">{entry.participantName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-xs">
                              {entry.accuracyPercentage}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-mono text-base sm:text-lg font-bold text-[#54133F]">
                              {entry.score}{' '}
                              <span className="text-xs text-[#8A6D65] font-normal">/ 100</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Tab 3: Round 2 Leaderboard */}
              {activeTab === 'round2' && (
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#E8DFD8] text-[#8A6D65] uppercase text-[11px] font-semibold tracking-wider">
                      <th className="py-3 px-3">Rank</th>
                      <th className="py-3 px-4">Team &amp; Participant</th>
                      <th className="py-3 px-4 text-center">Answered</th>
                      <th className="py-3 px-4 text-center">Correct Logos</th>
                      <th className="py-3 px-4 text-right">Round 2 Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E6DE]">
                    {round2List.map((entry) => {
                      const isUserTeam =
                        user?.teamName && entry.teamName.toLowerCase() === user.teamName.toLowerCase();

                      return (
                        <tr
                          key={entry.participantId}
                          className={`transition-colors ${
                            isUserTeam ? 'bg-[#FFF8EA]/80 font-medium' : 'hover:bg-[#FFFDF9]'
                          }`}
                        >
                          <td className="py-3.5 px-3">{renderRankBadge(entry.rank)}</td>
                          <td className="py-3.5 px-4">
                            <div>
                              <div className="flex items-center space-x-1.5 text-[#54133F] font-bold text-sm sm:text-base">
                                <Users className="w-3.5 h-3.5 text-[#E56A21]" />
                                <span>{entry.teamName}</span>
                                {isUserTeam && (
                                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#E56A21]/15 text-[#E56A21] border border-[#E56A21]/30">
                                    Your Team
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#7A4232]">{entry.participantName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-medium text-[#7A4232]">
                            {entry.answeredCount} / 50
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-xs">
                              {entry.correctCount} correct
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-mono text-base sm:text-lg font-bold text-[#E56A21]">
                              {entry.score}{' '}
                              <span className="text-xs text-[#8A6D65] font-normal">/ 50</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>

      <div className="h-6" />
    </div>
  );
}
