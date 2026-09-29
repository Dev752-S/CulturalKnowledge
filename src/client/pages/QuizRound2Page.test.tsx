import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import QuizRound2Page from './QuizRound2Page';

const mockRound2Questions = Array.from({ length: 50 }, (_, i) => ({
  questionId: `R2Q${String(i + 1).padStart(3, '0')}`,
  questionNumber: i + 1,
  questionText: i === 0 ? 'Which logo belongs to the company behind the iPhone?' : `Logo Question ${i + 1}`,
  options: [
    {
      optionId: `opt_${i + 1}_A`,
      logoId: 'L001',
      key: 'A' as const,
      svgUrl: '/logos/001.svg',
      pngUrl: '/logos/001.png',
    },
    {
      optionId: `opt_${i + 1}_B`,
      logoId: 'L003',
      key: 'B' as const,
      svgUrl: '/logos/003.svg',
      pngUrl: '/logos/003.png',
    },
    {
      optionId: `opt_${i + 1}_C`,
      logoId: 'L002',
      key: 'C' as const,
      svgUrl: '/logos/002.svg',
      pngUrl: '/logos/002.png',
    },
    {
      optionId: `opt_${i + 1}_D`,
      logoId: 'L051',
      key: 'D' as const,
      svgUrl: '/logos/051.svg',
      pngUrl: '/logos/051.png',
    },
  ],
}));

describe('QuizRound2Page UI & Interaction Tests (Untimed & Unscored)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Renders preflight screen initially, then starts Round 2 and displays 3-column layout without timer', async () => {
    let hasStarted = false;
    const answersMap: Record<string, any> = {};

    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url === '/api/v1/auth/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            user: {
              id: 'u-logo-1',
              fullName: 'Logo Contestant',
              teamName: 'Visual Explorers',
              role: 'participant',
            },
            hasTeamName: true,
          }),
        });
      }

      if (url === '/api/v1/round2/attempt') {
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
              id: 'r2-att-123',
              totalQuestions: 50,
              isSubmitted: false,
              answers: answersMap,
            },
          }),
        });
      }

      if (url === '/api/v1/round2/start') {
        hasStarted = true;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            attempt: {
              id: 'r2-att-123',
              totalQuestions: 50,
              isSubmitted: false,
            },
            questions: mockRound2Questions,
          }),
        });
      }

      if (url.startsWith('/api/v1/round2/answers/')) {
        const body = JSON.parse(options.body);
        const qId = url.split('/').pop()!;
        answersMap[qId] = { selectedLogoId: body.selectedLogoId, isMarkedForReview: false };
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, questionId: qId, selectedLogoId: body.selectedLogoId }),
        });
      }

      if (url.startsWith('/api/v1/round2/review/')) {
        const body = JSON.parse(options.body);
        const qId = url.split('/').pop()!;
        answersMap[qId] = { ...(answersMap[qId] || {}), isMarkedForReview: body.isMarkedForReview };
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, questionId: qId, isMarkedForReview: body.isMarkedForReview }),
        });
      }

      if (url === '/api/v1/round2/submit') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            result: {
              attemptId: 'r2-att-123',
              totalQuestions: 50,
              answeredCount: Object.keys(answersMap).length,
              unansweredCount: 50 - Object.keys(answersMap).length,
              submittedAt: new Date().toISOString(),
            },
          }),
        });
      }

      return Promise.reject(new Error('Unknown url: ' + url));
    });

    render(
      <AuthProvider>
        <BrowserRouter>
          <QuizRound2Page />
        </BrowserRouter>
      </AuthProvider>
    );

    // 1. Verify Preflight Screen appears
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start round 2/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/Round 2 — Logo Quiz/i)).toBeInTheDocument();
    expect(screen.getByText(/50 Questions/i)).toBeInTheDocument();
    expect(screen.getByText(/Untimed Examination/i)).toBeInTheDocument();

    // 2. Click Start Round 2
    fireEvent.click(screen.getByRole('button', { name: /start round 2/i }));

    // 3. Verify Active Examination UI loads
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Question 1 of 50/i })).toBeInTheDocument();
    });

    // Check Clue Question Text
    expect(screen.getByText('Which logo belongs to the company behind the iPhone?')).toBeInTheDocument();

    // Check that there are exactly 4 option letter badges
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();

    // CRITICAL: Ensure NO countdown / timer exists in Round 2
    expect(screen.queryByText(/Time Remaining/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/80 Minutes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/60 Minutes/i)).not.toBeInTheDocument();

    // CRITICAL: Ensure NO score / points exists in Round 2
    expect(screen.queryByText(/Total Points/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Score:/i)).not.toBeInTheDocument();

    // 4. Test selecting Option A
    const optionAButton = screen.getByText('A').closest('button');
    expect(optionAButton).toBeInTheDocument();
    fireEvent.click(optionAButton!);

    // Verify option A selection was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/round2/answers/R2Q001',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ selectedLogoId: 'L001', selectedOptionId: 'opt_1_A' }),
        })
      );
    });

    // 5. Test Mark for Review
    const reviewBtn = screen.getByRole('button', { name: /mark for review/i });
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/round2/review/R2Q001',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ isMarkedForReview: true }),
        })
      );
    });

    // 6. Test Navigator displays 50 questions
    expect(screen.getByTitle('Question 1')).toBeInTheDocument();
    expect(screen.getByTitle('Question 50')).toBeInTheDocument();
    expect(screen.queryByTitle('Question 51')).not.toBeInTheDocument();

    // 7. CRITICAL TEST: Answering Question 1 does NOT finish the quiz (must advance to Question 2)
    const nextBtn = screen.getByRole('button', { name: /next question/i });
    expect(nextBtn).toBeInTheDocument();
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Question 2 of 50/i })).toBeInTheDocument();
    });

    // 8. Test Random Jump to Question 50
    const q50Btn = screen.getByTitle('Question 50');
    fireEvent.click(q50Btn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Question 50 of 50/i })).toBeInTheDocument();
    });

    // At Question 50, the button should be Review & Submit
    const reviewSubmitBtn = screen.getByRole('button', { name: /review & submit/i });
    expect(reviewSubmitBtn).toBeInTheDocument();
    fireEvent.click(reviewSubmitBtn);

    // 9. Verify Submission Modal
    await waitFor(() => {
      expect(screen.getByText(/Round 2 Review/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/50 Questions/i)).toBeInTheDocument();
    // Modal must NOT show score/marks
    expect(screen.queryByText(/Points/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Marks/i)).not.toBeInTheDocument();
  });
});
