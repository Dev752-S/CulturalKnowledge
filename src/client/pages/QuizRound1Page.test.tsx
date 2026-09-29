import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import QuizRound1Page from './QuizRound1Page';

const mockQuestions = Array.from({ length: 100 }, (_, i) => ({
  id: `Q${String(i + 1).padStart(3, '0')}`,
  number: i + 1,
  category: i < 15 ? 'INDIAN TRADITIONAL CULTURE' : 'GENERAL KNOWLEDGE',
  text: i === 0 ? 'Which dance is called the mother of all classical dances?' : `Quiz Question ${i + 1}`,
  options: [
    { key: 'A', text: 'Option A Text' },
    { key: 'B', text: i === 0 ? 'Bharatanatyam' : 'Option B Text' },
    { key: 'C', text: 'Option C Text' },
    { key: 'D', text: 'Option D Text' },
  ],
}));

describe('QuizRound1Page Reference UI & Interaction Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Renders preflight screen initially, then starts quiz and displays exact 3-column reference layout', async () => {
    let hasStarted = false;
    const answersMap: Record<string, any> = {};

    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url === '/api/v1/auth/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            user: {
              id: 'u-quiz-1',
              fullName: 'Aroha Lead',
              teamName: 'Team Aroha',
              role: 'participant',
            },
            hasTeamName: true,
          }),
        });
      }

      if (url === '/api/v1/quiz/round-1/attempt') {
        if (!hasStarted) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, attempt: null }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            attempt: {
              id: 'att-123',
              totalQuestions: 100,
              remainingSeconds: 3590,
              isSubmitted: false,
              answers: answersMap,
            },
          }),
        });
      }

      if (url === '/api/v1/quiz/round-1/start') {
        hasStarted = true;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            attempt: {
              id: 'att-123',
              totalQuestions: 100,
              remainingSeconds: 3600,
              isSubmitted: false,
            },
            questions: mockQuestions,
          }),
        });
      }

      if (url.startsWith('/api/v1/quiz/round-1/answers/')) {
        const body = JSON.parse(options.body);
        const qId = url.split('/').pop()!;
        answersMap[qId] = { selectedOption: body.selectedOption, isMarkedForReview: false };
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, questionId: qId, selectedOption: body.selectedOption }),
        });
      }

      if (url.startsWith('/api/v1/quiz/round-1/review/')) {
        const body = JSON.parse(options.body);
        const qId = url.split('/').pop()!;
        answersMap[qId] = { ...(answersMap[qId] || {}), isMarkedForReview: body.isMarkedForReview };
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, questionId: qId, isMarkedForReview: body.isMarkedForReview }),
        });
      }

      return Promise.reject(new Error('Unknown url: ' + url));
    });

    render(
      <AuthProvider>
        <BrowserRouter>
          <QuizRound1Page />
        </BrowserRouter>
      </AuthProvider>
    );

    // 1. Verify Preflight Screen appears (Section 6 & 7)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start quiz/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/Round 1 — Cultural Quiz/i)).toBeInTheDocument();
    expect(screen.getByText(/100 Questions/i)).toBeInTheDocument();
    expect(screen.getByText(/60 Minutes/i)).toBeInTheDocument();

    // 2. Click Start Quiz
    const startBtn = screen.getByRole('button', { name: /start quiz/i });
    fireEvent.click(startBtn);

    // 3. Verify Active Quiz Screen Loads with 3-Column Layout (Section 22 & 97)
    await waitFor(() => {
      expect(screen.getByText('Kala Sangamam')).toBeInTheDocument();
    });

    // Header (Section 24–27)
    expect(screen.getByText('Cultural Knowledge')).toBeInTheDocument();
    expect(screen.getByText('Team Aroha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end quiz/i })).toBeInTheDocument();

    // Left Sidebar (Section 28–33)
    expect(screen.getByText('Question Paper')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /instructions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rules/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument();

    // Center Question Card (Section 34–36, 41)
    expect(screen.getByText('Question 1 of 100')).toBeInTheDocument();
    expect(screen.getByText('Which dance is called the mother of all classical dances?')).toBeInTheDocument();
    expect(screen.getByText('Bharatanatyam')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark for review/i })).toBeInTheDocument();

    // Right Sidebar: Timer & Navigator (Section 46–48, 53)
    expect(screen.getByText('Time Remaining')).toBeInTheDocument();
    expect(screen.getByText('Question Navigator')).toBeInTheDocument();
    expect(screen.getByTitle('Question 1')).toBeInTheDocument();
    expect(screen.getByTitle('Question 100')).toBeInTheDocument();

    // 4. Test selecting an option (Section 41 & 42)
    const optionB = screen.getByText('Bharatanatyam');
    fireEvent.click(optionB);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/quiz/round-1/answers/Q001',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    // 5. Test Mark for Review (Section 37)
    const reviewBtn = screen.getByRole('button', { name: /mark for review/i });
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/quiz/round-1/review/Q001',
        expect.objectContaining({ method: 'POST' })
      );
    });

    // 6. Test Next Question Navigation
    const nextBtn = screen.getByRole('button', { name: /next question/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('Question 2 of 100')).toBeInTheDocument();
    });

    // 7. Test Question Navigator Jump to Question 10 (Section 48)
    const q10Btn = screen.getByTitle('Question 10');
    fireEvent.click(q10Btn);

    await waitFor(() => {
      expect(screen.getByText('Question 10 of 100')).toBeInTheDocument();
    });

    // 8. Test End Quiz button triggers confirmation dialog (Section 27 & 114)
    const endQuizBtn = screen.getByRole('button', { name: /end quiz/i });
    fireEvent.click(endQuizBtn);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to leave the quiz/i)).toBeInTheDocument();
    });
  });
});
