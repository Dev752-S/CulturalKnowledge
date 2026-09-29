import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import QuizRound2Page from './QuizRound2Page';

const mockRound2Questions = Array.from({ length: 50 }, (_, i) => ({
  questionId: `R2Q${String(i + 1).padStart(3, '0')}`,
  questionNumber: i + 1,
  questionText: i === 0 ? 'Which logo belongs to the company behind the iPhone?' : `Identify this brand emblem ${i + 1}`,
  category: 'Technology',
  difficulty: 'Easy',
  logoSvgUrl: `/logos/${String(i + 1).padStart(3, '0')}.svg`,
  logoPngUrl: `/logos/${String(i + 1).padStart(3, '0')}.png`,
  logoImageUrl: `/logos/${String(i + 1).padStart(3, '0')}.svg`,
  options: [
    {
      optionId: `opt_${i + 1}_A`,
      key: 'A' as const,
      text: i === 0 ? 'Apple' : `Brand ${i + 1} A`,
      brandName: i === 0 ? 'Apple' : `Brand ${i + 1} A`,
      logoId: 'L001',
    },
    {
      optionId: `opt_${i + 1}_B`,
      key: 'B' as const,
      text: i === 0 ? 'Microsoft' : `Brand ${i + 1} B`,
      brandName: i === 0 ? 'Microsoft' : `Brand ${i + 1} B`,
      logoId: 'L003',
    },
    {
      optionId: `opt_${i + 1}_C`,
      key: 'C' as const,
      text: i === 0 ? 'Google' : `Brand ${i + 1} C`,
      brandName: i === 0 ? 'Google' : `Brand ${i + 1} C`,
      logoId: 'L002',
    },
    {
      optionId: `opt_${i + 1}_D`,
      key: 'D' as const,
      text: i === 0 ? 'Cloudflare' : `Brand ${i + 1} D`,
      brandName: i === 0 ? 'Cloudflare' : `Brand ${i + 1} D`,
      logoId: 'L051',
    },
  ],
}));

describe('QuizRound2Page Flip-Card Logo Identification Game UI & Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Renders preflight screen, starts Flip-Card game, reveals logo for 5s, locks card, chooses text option, navigates, and submits explicitly', async () => {
    let hasStarted = false;
    const answersMap: Record<string, any> = {};
    const revealsMap: Record<string, any> = {};

    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url === '/api/v1/auth/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            user: {
              id: 'u-logo-1',
              fullName: 'Flip Contestant',
              teamName: 'Flip Explorers',
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
              reveals: revealsMap,
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

      if (url.startsWith('/api/v1/round2/reveal/')) {
        const qId = url.split('/').pop()!;
        revealsMap[qId] = { isLocked: false, remainingMs: 5000, revealStartedAt: new Date().toISOString() };
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            questionId: qId,
            isLocked: false,
            remainingMs: 5000,
            revealStartedAt: revealsMap[qId].revealStartedAt,
          }),
        });
      }

      if (url.startsWith('/api/v1/round2/answers/')) {
        const body = JSON.parse(options.body);
        const qId = url.split('/').pop()!;
        answersMap[qId] = {
          selectedOptionId: body.selectedOptionId,
          selectedBrandName: body.selectedBrandName,
          isMarkedForReview: false,
        };
        revealsMap[qId] = { isLocked: true, remainingMs: 0 };
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            questionId: qId,
            selectedOptionId: body.selectedOptionId,
            selectedBrandName: body.selectedBrandName,
          }),
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

    // 1. Verify Preflight Screen appears with Flip-Card info
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start round 2/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/Round 2 — Logo Quiz/i)).toBeInTheDocument();
    expect(screen.getAllByText(/50 Questions/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Untimed Examination/i)).toBeInTheDocument();
    expect(screen.getByText(/Flip-Card Identification/i)).toBeInTheDocument();

    // 2. Click Start Round 2
    fireEvent.click(screen.getByRole('button', { name: /start round 2/i }));

    // 3. Verify Active Examination UI loads
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Question 1 of 50/i })).toBeInTheDocument();
    });

    // Check Question Clue
    expect(screen.getByText('Which logo belongs to the company behind the iPhone?')).toBeInTheDocument();

    // CRITICAL: Flip Card starts in Mystery/Unrevealed State
    expect(screen.getByText(/Mystery Logo Card/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reveal logo/i })).toBeInTheDocument();

    // Answer options are hidden before reveal
    expect(screen.getByText(/Answer Options Are Hidden During Initial State/i)).toBeInTheDocument();

    // CRITICAL: Ensure NO countdown timer or points/marks exist
    expect(screen.queryByText(/Time Remaining/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/80 Minutes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Total Points/i)).not.toBeInTheDocument();

    // 4. Reveal the card!
    fireEvent.click(screen.getByRole('button', { name: /reveal logo/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/round2/reveal/R2Q001',
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Verify Active Reveal Back-Face is rendered (shows remaining countdown, e.g. 5s Left)
    await waitFor(() => {
      expect(screen.getByText(/5s Left/i)).toBeInTheDocument();
      expect(screen.getByText(/Memorize this emblem/i)).toBeInTheDocument();
    });

    // 5. Fast-forward timer to end of 5-second reveal window
    await vi.advanceTimersByTimeAsync(6000);

    // 6. After 5 seconds, card locks permanently!
    // Card displays "Card Locked"
    await waitFor(() => {
      expect(screen.getByText(/Card Locked/i)).toBeInTheDocument();
    });

    // Now the 4 TEXT answer options appear: Apple, Microsoft, Google, Cloudflare
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Microsoft')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Cloudflare')).toBeInTheDocument();
    });

    // 7. Select Option A (Apple)
    const appleBtn = screen.getByText('Apple').closest('button');
    expect(appleBtn).toBeInTheDocument();
    fireEvent.click(appleBtn!);

    // Verify answer submission was called with text option
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/round2/answers/R2Q001',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ selectedOptionId: 'opt_1_A', selectedBrandName: 'Apple' }),
        })
      );
    });

    // 8. Test Mark for Review
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

    // 9. Verify Question Navigator has 50 questions
    expect(screen.getByTitle('Question 1')).toBeInTheDocument();
    expect(screen.getByTitle('Question 50')).toBeInTheDocument();

    // 10. CRITICAL: Moving to Next Question advances to Question 2 (attempt remains active!)
    const nextBtn = screen.getByRole('button', { name: /next question/i });
    expect(nextBtn).toBeInTheDocument();
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Question 2 of 50/i })).toBeInTheDocument();
    });

    // 11. Jump to Question 50
    const q50Btn = screen.getByTitle('Question 50');
    fireEvent.click(q50Btn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Question 50 of 50/i })).toBeInTheDocument();
    });

    // 12. Review & Submit opens modal
    const reviewSubmitBtn = screen.getByRole('button', { name: /review & submit/i });
    expect(reviewSubmitBtn).toBeInTheDocument();
    fireEvent.click(reviewSubmitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Round 2 Review/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/50 Questions/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Points/i)).not.toBeInTheDocument();
  });
});
