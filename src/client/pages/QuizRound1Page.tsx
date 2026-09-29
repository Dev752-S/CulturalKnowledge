import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QuizHeader from '../components/quiz/QuizHeader';
import QuizLeftSidebar from '../components/quiz/QuizLeftSidebar';
import QuizQuestionCard, { type QuizQuestionData } from '../components/quiz/QuizQuestionCard';
import QuizRightSidebar from '../components/quiz/QuizRightSidebar';
import QuizPreflight from '../components/quiz/QuizPreflight';
import QuizSecurityModal from '../components/quiz/QuizSecurityModal';
import QuizSubmitModal from '../components/quiz/QuizSubmitModal';

interface QuizAnswerState {
  selectedOption: string | null;
  isMarkedForReview: boolean;
}

export default function QuizRound1Page() {
  const { user, hasTeamName, isLoading } = useAuth();
  const navigate = useNavigate();

  // Quiz Lifecycle State: 'loading' | 'preflight' | 'active' | 'submitting' | 'disqualified'
  const [quizState, setQuizState] = useState<'loading' | 'preflight' | 'active' | 'submitting' | 'disqualified'>('loading');
  const [questions, setQuestions] = useState<QuizQuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerState>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(60 * 60);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Security & Modal States
  const [securityModalType, setSecurityModalType] = useState<'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isRoundLocked, setIsRoundLocked] = useState(false);

  // Participant Route Guard
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/');
      } else if (!hasTeamName) {
        navigate('/team-name');
      }
    }
  }, [user, hasTeamName, isLoading, navigate]);

  // Check if participant already has an active attempt
  useEffect(() => {
    async function checkExistingAttempt() {
      if (!user) return;
      try {
        const res = await fetch('/api/v1/quiz/round-1/attempt');
        const data = await res.json();

        if (data.success && data.attempt) {
          if (data.attempt.isSubmitted) {
            // Already submitted, navigate to result
            navigate('/quiz/round-1/result');
            return;
          }

          // Active attempt exists! Restore state (Section 111)
          setAttemptId(data.attempt.id);
          setRemainingSeconds(data.attempt.remainingSeconds);

          // Fetch questions
          const qRes = await fetch('/api/v1/quiz/round-1/questions');
          const qData = await qRes.json();
          if (qData.success && qData.questions) {
            setQuestions(qData.questions);
          }

          if (data.attempt.answers) {
            const mapped: Record<string, QuizAnswerState> = {};
            for (const [k, v] of Object.entries(data.attempt.answers as Record<string, any>)) {
              mapped[k] = {
                selectedOption: v.selectedOption,
                isMarkedForReview: v.isMarkedForReview || false,
              };
            }
            setAnswers(mapped);
          }

          setQuizState('active');
        } else {
          // No active attempt, check if round is enabled by admin
          try {
            const statusRes = await fetch('/api/v1/quiz/rounds-status');
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData?.success && statusData.round1 && statusData.round1.isActive === false && user.role !== 'admin') {
                setIsRoundLocked(true);
              }
            }
          } catch {
            // Non-blocking in offline/test environment
          }
          setQuizState('preflight');
        }
      } catch (err) {
        console.error('Error checking quiz attempt:', err);
        setQuizState('preflight');
      }
    }

    if (!isLoading && user) {
      checkExistingAttempt();
    }
  }, [user, isLoading, navigate]);

  // Handle Start Quiz (Section 7, 8, 9) - Camera removed
  const handleStartQuiz = async () => {
    // 1. Fullscreen request
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.log('Fullscreen request was declined or unsupported:', err);
    }

    // 2. Initiate attempt on server
    const res = await fetch('/api/v1/quiz/round-1/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to start quiz attempt');
    }

    setAttemptId(data.attempt.id);
    setRemainingSeconds(data.attempt.remainingSeconds);
    setQuestions(data.questions);
    setQuizState('active');
  };

  // Submit Answer & Autosave (Section 58 & 59)
  const handleSelectOption = async (optionKey: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    // Immediately update local state for responsive UI
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selectedOption: optionKey,
        isMarkedForReview: prev[currentQ.id]?.isMarkedForReview || false,
      },
    }));

    // Server-authoritative autosave
    try {
      await fetch(`/api/v1/quiz/round-1/answers/${currentQ.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedOption: optionKey }),
      });
    } catch (err) {
      console.error('Autosave failed:', err);
    }
  };

  // Toggle Mark for Review (Section 37 & 117)
  const handleToggleReview = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const currentMarked = answers[currentQ.id]?.isMarkedForReview || false;
    const newMarked = !currentMarked;

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selectedOption: prev[currentQ.id]?.selectedOption || null,
        isMarkedForReview: newMarked,
      },
    }));

    try {
      await fetch(`/api/v1/quiz/round-1/review/${currentQ.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMarkedForReview: newMarked }),
      });
    } catch (err) {
      console.error('Toggle review failed:', err);
    }
  };

  // Final Submission (Section 81 & 82)
  const handleConfirmSubmit = async () => {
    setQuizState('submitting');
    try {
      const res = await fetch('/api/v1/quiz/round-1/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId }),
      });
      const data = await res.json();

      if (data.success) {
        navigate('/quiz/round-1/result');
      } else {
        alert(data.error?.message || 'Submission failed. Please try again.');
        setQuizState('active');
        setShowSubmitModal(false);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert('Unable to submit quiz. Please check your connection.');
      setQuizState('active');
      setShowSubmitModal(false);
    }
  };

  // Server Countdown Timer (Section 53–57)
  useEffect(() => {
    if (quizState !== 'active') return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time expires (Section 56 & 83)
          handleConfirmSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState]);

  // Anti-Cheat & Proctoring Event Listeners (Section 11–15)
  const reportSecurityEvent = useCallback(async (eventType: string, metadata: Record<string, any> = {}) => {
    try {
      await fetch('/api/v1/quiz/round-1/security-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, metadata }),
      });
    } catch {
      // Ignore network errors on reporting
    }
  }, []);

  useEffect(() => {
    if (quizState !== 'active') return;

    const triggerElimination = (anomalyType: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT') => {
      reportSecurityEvent(anomalyType, { timestamp: new Date().toISOString(), eliminated: true });
      setQuizState('disqualified');
      setSecurityModalType(anomalyType);
    };

    // 1. Tab Switch / Visibility Change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerElimination('TAB_SWITCH');
      }
    };

    // 2. Window Blur (lost focus)
    const handleWindowBlur = () => {
      triggerElimination('WINDOW_BLUR');
    };

    // 3. Fullscreen Exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerElimination('FULLSCREEN_EXIT');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [quizState, reportSecurityEvent]);


  // Calculations for submit modal
  const answeredCount = Object.values(answers).filter((a) => a.selectedOption !== null).length;
  const unansweredCount = (questions.length || 100) - answeredCount;
  const markedCount = Object.values(answers).filter((a) => a.isMarkedForReview).length;

  if (isLoading || !user || quizState === 'loading') {
    return (
      <div className="min-h-screen bg-[#FFF8EA] flex items-center justify-center text-[#54133F]">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 bg-[#C58A3A] rounded-full animate-ping" />
          <span className="font-cormorant text-xl">Loading Quiz Environment...</span>
        </div>
      </div>
    );
  }

  // Preflight Stage
  if (quizState === 'preflight') {
    return (
      <div
        className="min-h-screen w-full relative flex flex-col justify-between bg-[#FFF8EA] p-4 sm:p-6"
        style={{
          backgroundImage: "url('/assets/cultural_landing_bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255, 248, 234, 0.8) 0%, rgba(255, 248, 234, 0.45) 60%, transparent 100%)',
          }}
        />
        <div className="relative z-10 w-full flex-1 flex items-center justify-center">
          <QuizPreflight
            onStartQuiz={handleStartQuiz}
            teamName={user.teamName || 'Team Vibes'}
            participantName={user.fullName || 'Participant'}
            isRoundLocked={isRoundLocked}
          />
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex] || {
    id: 'Q001',
    number: currentIndex + 1,
    category: 'Cultural Knowledge',
    text: 'Loading question content...',
    options: [],
  };

  const currentAnswer = answers[currentQ.id];

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
      {/* Background Soft Translucent Layer */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255, 248, 234, 0.88) 0%, rgba(255, 248, 234, 0.55) 70%, transparent 100%)',
        }}
      />

      {/* 1. Header (Section 24–27) */}
      <div className="relative z-20 w-full">
        <QuizHeader
          teamName={user.teamName || 'Team Vibes'}
          onEndQuiz={() => setShowSubmitModal(true)}
        />
      </div>

      {/* 2. Main 3-Column Examination Arena (Section 22 & 97) */}
      <main className="relative z-10 flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col md:flex-row gap-4 sm:gap-6 w-full items-stretch">
        {/* Left Column: Sidebar with Question Paper active state + Security Badge */}
        <QuizLeftSidebar />

        {/* Center Column: Question Card */}
        <div className="flex-1 flex flex-col min-w-0">
          <QuizQuestionCard
            question={currentQ}
            totalQuestions={questions.length || 100}
            selectedOption={currentAnswer?.selectedOption || null}
            isMarkedForReview={currentAnswer?.isMarkedForReview || false}
            onSelectOption={handleSelectOption}
            onToggleReview={handleToggleReview}
            onPrevious={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            onNext={() => setCurrentIndex((prev) => Math.min((questions.length || 100) - 1, prev + 1))}
            onSubmitReview={() => setShowSubmitModal(true)}
            isFirstQuestion={currentIndex === 0}
            isLastQuestion={currentIndex === (questions.length || 100) - 1}
          />
        </div>

        {/* Right Column: Timer + Question Navigator */}
        <QuizRightSidebar
          remainingSeconds={remainingSeconds}
          totalQuestions={questions.length || 100}
          currentIndex={currentIndex}
          answers={answers}
          questionIds={questions.map((q) => q.id)}
          onSelectQuestion={(idx) => setCurrentIndex(idx)}
        />
      </main>

      {/* Zero Tolerance Immediate Elimination Modal */}
      <QuizSecurityModal
        type={securityModalType}
        onExit={() => navigate('/')}
      />

      {/* Submit Confirmation Modal (Section 80) */}
      <QuizSubmitModal
        isOpen={showSubmitModal}
        totalQuestions={questions.length || 100}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        markedCount={markedCount}
        isSubmitting={quizState === 'submitting'}
        onCancel={() => setShowSubmitModal(false)}
        onConfirmSubmit={handleConfirmSubmit}
      />
    </div>
  );
}
