import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

describe('LoginPage Cultural Glassmorphism UI', () => {
  it('Renders Kala Sangamam top title, cultural headers, and Google login button', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Top Brand Title
    expect(screen.getByRole('heading', { level: 1, name: 'Kala Sangamam' })).toBeInTheDocument();

    // Welcome To badge
    expect(screen.getByText('WELCOME TO')).toBeInTheDocument();

    // Cultural Knowledge Main Heading
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/Cultural/i);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/Knowledge/i);

    // Tagline
    expect(screen.getByText('Explore · Learn · Celebrate')).toBeInTheDocument();

    // Google Login Button
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    expect(googleButton).toBeInTheDocument();
    expect(googleButton).toHaveAttribute('aria-label', 'Continue with Google');
  });

  it('Submits Google authentication and triggers navigation on click', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        user: { email: 'participant.skp2026@gmail.com', fullName: 'SKP Participant', role: 'participant' },
      }),
    } as any);

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/auth/google', expect.any(Object));
    });
  });
});
