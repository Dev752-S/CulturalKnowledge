import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QuizHeader from '../components/quiz/QuizHeader';
import QuizRound2LeftSidebar from '../components/quiz/QuizRound2LeftSidebar';
import QuizLogoQuestionCard, { type Round2QuestionData } from '../components/quiz/QuizLogoQuestionCard';
import QuizRound2RightSidebar from '../components/quiz/QuizRound2RightSidebar';
import QuizRound2Preflight from '../components/quiz/QuizRound2Preflight';
import QuizSecurityModal from '../components/quiz/QuizSecurityModal';
import QuizRound2SubmitModal from '../components/quiz/QuizRound2SubmitModal';

interface Round2AnswerState {
  selectedOptionId?: string | null;
  selectedBrandName?: string | null;
  selectedLogoId?: string | null;
  isMarkedForReview: boolean;
}

interface Round2RevealState {
  isLocked: boolean;
  remainingMs: number;
  revealStartedAt?: string;
}

export default function QuizRound2Page() {
  const { user, hasTeamName, isLoading } = useAuth();
  const navigate = useNavigate();

  // Quiz Lifecycle State: 'loading' | 'preflight' | 'active' | 'submitting' | 'disqualified'
  const [quizState, setQuizState] = useState<'loading' | 'preflight' | 'active' | 'submitting' | 'disqualified'>('loading');
  const [questions, setQuestions] = useState<Round2QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Round2AnswerState>>({});
  const [reveals, setReveals] = useState<Record<string, Round2RevealState>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Custom Timer States (Configurable by Admin)
  const [cardFlipDurationSeconds, setCardFlipDurationSeconds] = useState<number>(5);
  const [overallDurationMinutes, setOverallDurationMinutes] = useState<number>(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30 * 60);

  // Flip-Card Reveal Timer State
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [activeRevealingQId, setActiveRevealingQId] = useState<string | null>(null);

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
        const res = await fetch('/api/v1/round2/attempt');
        const data = await res.json();

        if (data.success && data.attempt) {
          if (data.attempt.isDisqualified) {
            setQuizState('disqualified');
            setSecurityModalType('TAB_SWITCH');
            return;
          }
          if (data.attempt.isSubmitted) {
            // Already submitted, navigate to result
            navigate('/quiz/round-2/result');
            return;
          }

          // Active attempt exists! Restore state
          setAttemptId(data.attempt.id);
          if (data.attempt.remainingSeconds !== undefined) {
            setRemainingSeconds(data.attempt.remainingSeconds);
          }
          if (data.cardFlipDurationSeconds !== undefined) {
            setCardFlipDurationSeconds(data.cardFlipDurationSeconds);
          }
          if (data.overallDurationMinutes !== undefined) {
            setOverallDurationMinutes(data.overallDurationMinutes);
          }

          // Fetch questions
          const qRes = await fetch('/api/v1/round2/questions');
          const qData = await qRes.json();
          if (qData.success && qData.questions) {
            setQuestions(qData.questions);
          }

          if (data.attempt.answers) {
            const mappedAns: Record<string, Round2AnswerState> = {};
            for (const [k, v] of Object.entries(data.attempt.answers as Record<string, any>)) {
              mappedAns[k] = {
                selectedOptionId: v.selectedOptionId || null,
                selectedBrandName: v.selectedBrandName || null,
                selectedLogoId: v.selectedLogoId || v.selectedOptionId || null,
                isMarkedForReview: v.isMarkedForReview || false,
              };
            }
            setAnswers(mappedAns);
          }

          if (data.attempt.reveals) {
            const mappedRev: Record<string, Round2RevealState> = {};
            for (const [k, v] of Object.entries(data.attempt.reveals as Record<string, any>)) {
              mappedRev[k] = {
                isLocked: Boolean(v.isLocked),
                remainingMs: v.remainingMs || 0,
                revealStartedAt: v.revealStartedAt,
              };
            }
            setReveals(mappedRev);
          }

          setQuizState('active');
        } else {
          // No active attempt, check if round is enabled by admin
          try {
            const statusRes = await fetch('/api/v1/quiz/rounds-status');
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData?.success && statusData.round2) {
                if (statusData.round2.isActive === false && user.role !== 'admin') {
                  setIsRoundLocked(true);
                }
                if (statusData.round2.cardFlipDurationSeconds) {
                  setCardFlipDurationSeconds(statusData.round2.cardFlipDurationSeconds);
                }
                if (statusData.round2.durationMinutes) {
                  setOverallDurationMinutes(statusData.round2.durationMinutes);
                  setRemainingSeconds(statusData.round2.durationMinutes * 60);
                }
              }
            }
          } catch {
            // Non-blocking in offline/test environment
          }
          setQuizState('preflight');
        }
      } catch (err) {
        console.error('Error checking Round 2 attempt:', err);
        setQuizState('preflight');
      }
    }

    if (!isLoading && user) {
      checkExistingAttempt();
    }
  }, [user, isLoading, navigate]);

  // Handle Start Quiz (No camera required)
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
    const res = await fetch('/api/v1/round2/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to start Round 2 attempt');
    }

    setAttemptId(data.attempt.id);
    if (data.cardFlipDurationSeconds) setCardFlipDurationSeconds(data.cardFlipDurationSeconds);
    if (data.overallDurationMinutes) setOverallDurationMinutes(data.overallDurationMinutes);
    if (data.remainingSeconds !== undefined) setRemainingSeconds(data.remainingSeconds);
    setQuestions(data.questions);
    setQuizState('active');
  };

  // Reveal Card (5-Second Visual Preview)
  const handleRevealCard = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const qId = currentQ.questionId;

    // Guard: Prevent re-reveal if locked or already answered
    if (reveals[qId]?.isLocked || answers[qId]?.selectedOptionId) return;

    try {
      const res = await fetch(`/api/v1/round2/reveal/${qId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.success) {
        if (data.isLocked) {
          setReveals((prev) => ({
            ...prev,
            [qId]: { isLocked: true, remainingMs: 0, revealStartedAt: data.revealStartedAt },
          }));
          setActiveRevealingQId(null);
          setCountdownSeconds(0);
        } else {
          const remainingSec = Math.max(1, Math.ceil((data.remainingMs || 5000) / 1000));
          setReveals((prev) => ({
            ...prev,
            [qId]: { isLocked: false, remainingMs: data.remainingMs, revealStartedAt: data.revealStartedAt },
          }));
          setCountdownSeconds(remainingSec);
          setActiveRevealingQId(qId);
        }
        return;
      }
    } catch {
      // Offline/test fallback: run reveal with custom duration
      setReveals((prev) => ({
        ...prev,
        [qId]: { isLocked: false, remainingMs: cardFlipDurationSeconds * 1000 },
      }));
      setCountdownSeconds(cardFlipDurationSeconds);
      setActiveRevealingQId(qId);
    }
  };

  // Overall Round 2 Countdown Timer (Configurable by Admin)
  useEffect(() => {
    if (quizState !== 'active') return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleConfirmSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState]);

  // Active flip countdown timer effect
  useEffect(() => {
    if (!activeRevealingQId) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setReveals((r) => ({
            ...r,
            [activeRevealingQId]: { isLocked: true, remainingMs: 0 },
          }));
          setActiveRevealingQId(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeRevealingQId]);

  // Submit Answer & Autosave
  const handleSelectOption = async (optionId: string, brandName: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const qId = currentQ.questionId;

    // Prevent double answer submission
    if (answers[qId]?.selectedOptionId) return;

    // Immediately update local state for responsive UI
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        selectedOptionId: optionId,
        selectedBrandName: brandName,
        selectedLogoId: optionId, // backwards compatibility alias
        isMarkedForReview: prev[qId]?.isMarkedForReview || false,
      },
    }));

    // Ensure card is permanently locked
    setReveals((prev) => ({
      ...prev,
      [qId]: { isLocked: true, remainingMs: 0 },
    }));
    setActiveRevealingQId(null);
    setCountdownSeconds(0);

    // Server-authoritative autosave
    try {
      await fetch(`/api/v1/round2/answers/${qId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedOptionId: optionId, selectedBrandName: brandName }),
      });
    } catch (err) {
      console.error('Round 2 autosave failed:', err);
    }
  };

  // Toggle Mark for Review
  const handleToggleReview = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const qId = currentQ.questionId;

    const currentMarked = answers[qId]?.isMarkedForReview || false;
    const newMarked = !currentMarked;

    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        selectedOptionId: prev[qId]?.selectedOptionId || null,
        selectedBrandName: prev[qId]?.selectedBrandName || null,
        selectedLogoId: prev[qId]?.selectedLogoId || null,
        isMarkedForReview: newMarked,
      },
    }));

    try {
      await fetch(`/api/v1/round2/review/${qId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMarkedForReview: newMarked }),
      });
    } catch (err) {
      console.error('Toggle review failed:', err);
    }
  };

  // Final Submission
  const handleConfirmSubmit = async () => {
    setQuizState('submitting');
    try {
      const res = await fetch('/api/v1/round2/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId }),
      });
      const data = await res.json();

      if (data.success) {
        navigate('/quiz/round-2/result');
      } else {
        alert(data.error?.message || 'Submission failed. Please try again.');
        setQuizState('active');
        setShowSubmitModal(false);
      }
    } catch (err) {
      console.error('Error submitting Round 2:', err);
      alert('Unable to submit quiz. Please check your connection.');
      setQuizState('active');
      setShowSubmitModal(false);
    }
  };

  // Anti-Cheat & Proctoring Event Listeners
  const reportSecurityEvent = useCallback(async (eventType: string, metadata: Record<string, any> = {}) => {
    try {
      await fetch('/api/v1/round2/security-events', {
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

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerElimination('TAB_SWITCH');
      }
    };

    const handleWindowBlur = () => {
      triggerElimination('WINDOW_BLUR');
    };

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


  if (isLoading || quizState === 'loading') {
    return (
      <div className="min-h-screen bg-[#FFF8EA] flex items-center justify-center text-[#54133F]">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 bg-[#E56A21] rounded-full animate-ping" />
          <span className="font-cormorant text-xl">Loading Round 2 Flip-Card Arena...</span>
        </div>
      </div>
    );
  }

  // Preflight Gate Screen
  if (quizState === 'preflight') {
    return (
      <div
        className="min-h-screen w-full relative flex flex-col justify-between bg-[#FFF8EA] text-[#4A211C] p-4 sm:p-6"
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
              'radial-gradient(ellipse at center, rgba(255, 248, 234, 0.85) 0%, rgba(255, 248, 234, 0.5) 65%, transparent 100%)',
          }}
        />

        <div className="relative z-10 w-full flex justify-between items-center max-w-4xl mx-auto py-2">
          <button
            onClick={() => navigate('/events')}
            className="text-xs sm:text-sm font-semibold text-[#54133F] hover:text-[#E56A21] transition-colors"
          >
            ← Back to Event Selector
          </button>
        </div>

        <div className="relative z-10 w-full flex-1 flex items-center justify-center">
          <QuizRound2Preflight
            onStartQuiz={handleStartQuiz}
            teamName={user?.teamName || 'Team Vibes'}
            participantName={user?.fullName || 'Contestant'}
            isRoundLocked={isRoundLocked}
            cardFlipDurationSeconds={cardFlipDurationSeconds}
            overallDurationMinutes={overallDurationMinutes}
          />
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const questionIds = questions.map((q) => q.questionId);
  const currentQId = currentQuestion?.questionId;
  const currentAnswer = currentQId ? answers[currentQId] : undefined;
  const answeredCount = Object.values(answers).filter(
    (a) => a.selectedOptionId != null || a.selectedLogoId != null
  ).length;
  const markedCount = Object.values(answers).filter((a) => a.isMarkedForReview).length;
  const unansweredCount = questions.length - answeredCount;

  const isCurrentRevealing = currentQId ? activeRevealingQId === currentQId && countdownSeconds > 0 : false;
  const isCurrentLocked = currentQId
    ? Boolean(reveals[currentQId]?.isLocked || currentAnswer?.selectedOptionId)
    : false;

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
      {/* Background Soft Overlay for optimum contrast */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255, 248, 234, 0.82) 0%, rgba(255, 248, 234, 0.45) 60%, transparent 100%)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 w-full">
        <QuizHeader
          teamName={user?.teamName || 'Team Vibes'}
          onEndQuiz={() => setShowSubmitModal(true)}
        />
      </div>

      {/* 3-Column Examination Layout: Left Sidebar + Visual Question Card + Right Navigator */}
      <main className="relative z-10 flex-1 max-w-[1520px] w-full mx-auto px-3 sm:px-5 md:px-6 py-4 flex flex-col md:flex-row gap-4 md:gap-5 lg:gap-6 items-stretch">
        {/* Left Sidebar */}
        <div className="w-full md:w-56 lg:w-64 flex-shrink-0">
          <QuizRound2LeftSidebar
            cardFlipDurationSeconds={cardFlipDurationSeconds}
            overallDurationMinutes={overallDurationMinutes}
          />
        </div>

        {/* Center Visual Question Card */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentQuestion ? (
            <QuizLogoQuestionCard
              question={currentQuestion}
              totalQuestions={questions.length || 50}
              selectedOptionId={currentAnswer?.selectedOptionId || null}
              isMarkedForReview={currentAnswer?.isMarkedForReview || false}
              isRevealing={isCurrentRevealing}
              isLocked={isCurrentLocked}
              countdownSeconds={isCurrentRevealing ? countdownSeconds : 0}
              flipDurationSeconds={cardFlipDurationSeconds}
              onRevealCard={handleRevealCard}
              onSelectOption={handleSelectOption}
              onToggleReview={handleToggleReview}
              onPrevious={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              onNext={() => setCurrentIndex((prev) => Math.min((questions.length || 50) - 1, prev + 1))}
              onSubmitReview={() => setShowSubmitModal(true)}
              isFirstQuestion={currentIndex === 0}
              isLastQuestion={currentIndex === (questions.length || 50) - 1}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-white/80 rounded-3xl p-12">
              <span className="font-cormorant text-xl text-[#7A4232]">No questions loaded.</span>
            </div>
          )}
        </div>

        {/* Right Sidebar (Navigator + Customizable Countdown Timer) */}
        <div className="w-full md:w-64 lg:w-72 flex-shrink-0">
          <QuizRound2RightSidebar
            totalQuestions={questions.length || 50}
            currentIndex={currentIndex}
            answers={answers}
            questionIds={questionIds}
            onSelectQuestion={(idx) => setCurrentIndex(idx)}
            remainingSeconds={remainingSeconds}
          />
        </div>
      </main>

      {/* Security Incident Notice Modal */}
      <QuizSecurityModal
        type={securityModalType}
        onExit={() => navigate('/')}
      />

      {/* Final Submit Confirmation Modal (No marks/score shown) */}
      <QuizRound2SubmitModal
        isOpen={showSubmitModal}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        markedCount={markedCount}
        isSubmitting={quizState === 'submitting'}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowSubmitModal(false)}
      />
    </div>
  );
}
