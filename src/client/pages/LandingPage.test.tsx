import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LandingPage from './LandingPage';

describe('Cultural Knowledge Landing Page Reference UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Renders exact reference Cultural Knowledge landing page and header structure', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/v1/auth/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            user: {
              id: 'u-1',
              fullName: 'Dinesh K',
              teamName: 'Team Vibes',
              email: 'dinesh.k@example.com',
              role: 'participant',
              photoUrl: 'https://example.com/dinesh.jpg',
            },
            hasTeamName: true,
          }),
        });
      }
      return Promise.reject(new Error('Unknown url ' + url));
    });

    render(
      <AuthProvider>
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      </AuthProvider>
    );

    // 1. Top Navigation Bar (Section 7–15)
    await waitFor(() => {
      expect(screen.getByText('college cultural event')).toBeInTheDocument();
    });

    // Brand titles
    const brandTitles = screen.getAllByText('Cultural Knowledge');
    expect(brandTitles.length).toBeGreaterThanOrEqual(2); // One in navbar, one as hero heading

    // Nav links and separator
    expect(screen.getByRole('link', { name: 'Events' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leaderboard' })).toBeInTheDocument();

    // Dynamic Team Area (Section 12)
    expect(screen.getByText('Team Vibes')).toBeInTheDocument();
    expect(screen.getByText('Dinesh K')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Dinesh K' })).toBeInTheDocument();

    // Notification bell & Logout (Section 14 & 61)
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();

    // 2. Central Hero Content (Section 24–30)
    expect(screen.getByRole('heading', { level: 2, name: /‘Welcome to/i })).toBeInTheDocument();
    expect(screen.getByText('Where Campus Culture Comes Alive')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Discover college events, showcase your talent, join competitions, connect with student communities, and celebrate the creativity of our campus.'
      )
    ).toBeInTheDocument();

    // 3. Event Rules & Instructions (Section 31–37)
    expect(
      screen.getByRole('heading', { level: 3, name: /Event Rules & Instructions/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Mobile phones used by team members only\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Maximum of four members per team\./i)
    ).toBeInTheDocument();

    // 4. Subtle Quiz Transition (Section 42 & 70)
    expect(screen.getByRole('link', { name: /proceed to quiz/i })).toBeInTheDocument();

    // 5. Verification of ABSENCE of dashboard components (Section 39 & 40)
    expect(screen.queryByText(/Explore Events/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/View Calendar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Participant Competition Arena/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Security Checklist/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/General & Technical MCQ Arena/i)).not.toBeInTheDocument();
  });
});
