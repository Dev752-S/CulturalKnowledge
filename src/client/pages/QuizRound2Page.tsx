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
  selectedLogoId: string | null;
  selectedOptionId?: string | null;
  isMarkedForReview: boolean;
}

export default function QuizRound2Page() {
  const { user, hasTeamName, isLoading } = useAuth();
  const navigate = useNavigate();

  // Quiz Lifecycle State: 'loading' | 'preflight' | 'active' | 'submitting'
  const [quizState, setQuizState] = useState<'loading' | 'preflight' | 'active' | 'submitting'>('loading');
  const [questions, setQuestions] = useState<Round2QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Round2AnswerState>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Security & Modal States
  const [securityModalType, setSecurityModalType] = useState<'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

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
          if (data.attempt.isSubmitted) {
            // Already submitted, navigate to result
            navigate('/quiz/round-2/result');
            return;
          }

          // Active attempt exists! Restore state
          setAttemptId(data.attempt.id);

          // Fetch questions
          const qRes = await fetch('/api/v1/round2/questions');
          const qData = await qRes.json();
          if (qData.success && qData.questions) {
            setQuestions(qData.questions);
          }

          if (data.attempt.answers) {
            const mapped: Record<string, Round2AnswerState> = {};
            for (const [k, v] of Object.entries(data.attempt.answers as Record<string, any>)) {
              mapped[k] = {
                selectedLogoId: v.selectedLogoId,
                selectedOptionId: v.selectedOptionId,
                isMarkedForReview: v.isMarkedForReview || false,
              };
            }
            setAnswers(mapped);
          }

          setQuizState('active');
        } else {
          // No active attempt, show preflight start gate
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

  // Handle Start Quiz
  const handleStartQuiz = async (enableCamera: boolean) => {
    // 1. Fullscreen request
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.log('Fullscreen request was declined or unsupported:', err);
    }

    // 2. Camera request if enabled
    if (enableCamera && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
        });
        setCameraStream(stream);
      } catch (err) {
        console.log('Camera permission was declined or unsupported:', err);
      }
    }

    // 3. Initiate attempt on server
    const res = await fetch('/api/v1/round2/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to start Round 2 attempt');
    }

    setAttemptId(data.attempt.id);
    setQuestions(data.questions);
    setQuizState('active');
  };

  // Submit Answer & Autosave
  const handleSelectOption = async (logoId: string, optionId: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    // Immediately update local state for responsive UI
    setAnswers((prev) => ({
      ...prev,
      [currentQ.questionId]: {
        selectedLogoId: logoId,
        selectedOptionId: optionId,
        isMarkedForReview: prev[currentQ.questionId]?.isMarkedForReview || false,
      },
    }));

    // Server-authoritative autosave
    try {
      await fetch(`/api/v1/round2/answers/${currentQ.questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedLogoId: logoId, selectedOptionId: optionId }),
      });
    } catch (err) {
      console.error('Round 2 autosave failed:', err);
    }
  };

  // Toggle Mark for Review
  const handleToggleReview = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const currentMarked = answers[currentQ.questionId]?.isMarkedForReview || false;
    const newMarked = !currentMarked;

    setAnswers((prev) => ({
      ...prev,
      [currentQ.questionId]: {
        selectedLogoId: prev[currentQ.questionId]?.selectedLogoId || null,
        selectedOptionId: prev[currentQ.questionId]?.selectedOptionId || null,
        isMarkedForReview: newMarked,
      },
    }));

    try {
      await fetch(`/api/v1/round2/review/${currentQ.questionId}`, {
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
        // Stop camera tracks if active
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
        }
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

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportSecurityEvent('TAB_SWITCH', { timestamp: new Date().toISOString() });
        setSecurityModalType('TAB_SWITCH');
      }
    };

    const handleWindowBlur = () => {
      reportSecurityEvent('WINDOW_BLUR', { timestamp: new Date().toISOString() });
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        reportSecurityEvent('FULLSCREEN_EXIT', { timestamp: new Date().toISOString() });
        setSecurityModalType('FULLSCREEN_EXIT');
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

  // Clean exit back to event selector
  const handleEndQuiz = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    navigate('/events');
  };

  // Re-request fullscreen from security modal
  const handleAcknowledgeSecurityModal = async () => {
    setSecurityModalType(null);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.log('Fullscreen re-request declined:', err);
    }
  };

  if (isLoading || quizState === 'loading') {
    return (
      <div className="min-h-screen bg-[#FFF8EA] flex items-center justify-center text-[#54133F]">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 bg-[#E56A21] rounded-full animate-ping" />
          <span className="font-cormorant text-xl">Loading Round 2 Logo Arena...</span>
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
          />
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const questionIds = questions.map((q) => q.questionId);
  const currentAnswer = currentQuestion ? answers[currentQuestion.questionId] : undefined;
  const answeredCount = Object.values(answers).filter((a) => a.selectedLogoId !== null).length;
  const markedCount = Object.values(answers).filter((a) => a.isMarkedForReview).length;
  const unansweredCount = questions.length - answeredCount;

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
          <QuizRound2LeftSidebar cameraStream={cameraStream} />
        </div>

        {/* Center Visual Question Card */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentQuestion ? (
            <QuizLogoQuestionCard
              question={currentQuestion}
              totalQuestions={questions.length || 50}
              selectedLogoId={currentAnswer?.selectedLogoId || null}
              isMarkedForReview={currentAnswer?.isMarkedForReview || false}
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

        {/* Right Sidebar (Navigator only - NO TIMER!) */}
        <div className="w-full md:w-64 lg:w-72 flex-shrink-0">
          <QuizRound2RightSidebar
            totalQuestions={questions.length || 50}
            currentIndex={currentIndex}
            answers={answers}
            questionIds={questionIds}
            onSelectQuestion={(idx) => setCurrentIndex(idx)}
          />
        </div>
      </main>

      {/* Security Incident Notice Modal */}
      <QuizSecurityModal
        type={securityModalType}
        onDismiss={() => setSecurityModalType(null)}
        onRequestFullscreen={handleAcknowledgeSecurityModal}
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
