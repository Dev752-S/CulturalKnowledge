import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import TeamNamePage from './TeamNamePage';

describe('TeamNamePage Flow and UI', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('Renders NEXT PAGE header, Team Name input and CONTINUE button', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/v1/auth/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            user: { role: 'participant', email: 'test@example.com', fullName: 'Tester', teamName: null },
            hasTeamName: false,
          }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <BrowserRouter>
        <TeamNamePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /next page/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 2, name: /team name/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your team name...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('Submits team name to backend endpoint and initiates navigation', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/v1/auth/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            user: { role: 'participant', email: 'test@example.com', fullName: 'Tester', teamName: null },
            hasTeamName: false,
          }),
        });
      }
      if (url === '/api/v1/participant/team') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            teamName: 'Cyber Warriors',
          }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <BrowserRouter>
        <TeamNamePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your team name...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Enter your team name...');
    fireEvent.change(input, { target: { value: 'Cyber Warriors' } });

    const continueBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/participant/team',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ teamName: 'Cyber Warriors' }),
        })
      );
    });
  });
});
