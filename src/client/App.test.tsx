import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from './App';

vi.mock('./lib/firebase', () => ({
  signInWithGooglePopup: vi.fn().mockResolvedValue({
    user: {
      email: 'test.participant@example.com',
      displayName: 'John Doe',
      photoURL: 'https://example.com/avatar.jpg',
    },
    idToken: 'mock-google-id-token',
  }),
  logoutFirebase: vi.fn().mockResolvedValue(undefined),
}));

describe('Login-First Navigation Flow & Router Acceptance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, 'Test', '/');
  });

  it('Test 1: Opening root / unauthenticated displays approved LOGIN PAGE and never old landing page', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/v1/auth/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, user: null, hasTeamName: false }),
        });
      }
      return Promise.reject(new Error('Unexpected fetch url: ' + url));
    });

    render(<App />);

    // Must display approved Login Page elements
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Kala Sangamam' })).toBeInTheDocument();
    });
    expect(screen.getByText('WELCOME TO')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();

    // Must NOT display old landing page components or Phase 0
    expect(screen.queryByText(/Phase 0 — Core Architecture Verification/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Official Competition Portal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Serverless Backend Engine/i)).not.toBeInTheDocument();
  });

  it('Test 2 & 3: Login -> Team Name -> New Landing Page end-to-end participant flow', async () => {
    let authState: { user: any; hasTeamName: boolean } = { user: null, hasTeamName: false };

    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url === '/api/v1/auth/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, ...authState }),
        });
      }
      if (url === '/api/v1/auth/google') {
        authState = {
          user: { id: 'usr-1', email: 'test.participant@example.com', fullName: 'John Doe', role: 'participant', teamName: null },
          hasTeamName: false,
        };
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, hasTeamName: false, user: authState.user }),
        });
      }
      if (url === '/api/v1/participant/team') {
        const body = JSON.parse(options.body);
        authState = {
          user: { ...authState.user, teamName: body.teamName },
          hasTeamName: true,
        };
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, teamName: body.teamName }),
        });
      }
      return Promise.reject(new Error('Unexpected fetch url: ' + url));
    });

    render(<App />);

    // 1. Initial page is Login Page
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    });

    // 2. Click Continue with Google -> Navigates to Team Name Page
    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /cultural knowledge/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/next page/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /team name/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your team name...')).toBeInTheDocument();

    // 3. Submit Team Name -> Navigates to New Landing Page
    const input = screen.getByPlaceholderText('Enter your team name...');
    fireEvent.change(input, { target: { value: 'Quantum Coders' } });

    const continueBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText(/Where Campus Culture Comes Alive/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/‘Welcome to/i)).toBeInTheDocument();
    expect(screen.getByText('Quantum Coders')).toBeInTheDocument();
    expect(screen.getByText(/Event Rules & Instructions/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /proceed to quiz/i })).toBeInTheDocument();
  });

  it('Test 4: Refresh Landing Page preserves New Landing Page when authenticated with team', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/v1/auth/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            user: { id: 'usr-1', email: 'test.participant@example.com', fullName: 'John Doe', role: 'participant', teamName: 'Quantum Coders' },
            hasTeamName: true,
          }),
        });
      }
      return Promise.reject(new Error('Unexpected fetch url: ' + url));
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Where Campus Culture Comes Alive/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Quantum Coders')).toBeInTheDocument();
    expect(screen.getByText(/Event Rules & Instructions/i)).toBeInTheDocument();
    expect(screen.queryByText(/Phase 0 — Core Architecture Verification/i)).not.toBeInTheDocument();
  });

  it('Test 5: Logging out from Landing Page returns to Login Page', async () => {
    let authState: { user: any; hasTeamName: boolean } = {
      user: { id: 'usr-1', email: 'test.participant@example.com', fullName: 'John Doe', role: 'participant', teamName: 'Quantum Coders' },
      hasTeamName: true,
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/v1/auth/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, ...authState }),
        });
      }
      if (url === '/api/v1/auth/logout') {
        authState = { user: null, hasTeamName: false };
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, message: 'Logged out successfully' }),
        });
      }
      return Promise.reject(new Error('Unexpected fetch url: ' + url));
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Where Campus Culture Comes Alive/i)).toBeInTheDocument();
    });

    const logoutBtn = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/Where Campus Culture Comes Alive/i)).not.toBeInTheDocument();
  });

  it('Test 6: Unauthenticated user manually navigating to /team-name is redirected to Login Page', async () => {
    window.history.pushState({}, 'Team Name', '/team-name');

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/v1/auth/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, user: null, hasTeamName: false }),
        });
      }
      return Promise.reject(new Error('Unexpected fetch url: ' + url));
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { level: 1, name: /cultural knowledge/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/next page/i)).not.toBeInTheDocument();
  });

  it('Test 7: Authenticated participant without team name opening root / is redirected to /team-name', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/v1/auth/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            user: { id: 'usr-2', email: 'solo@example.com', fullName: 'Solo Learner', role: 'participant', teamName: null },
            hasTeamName: false,
          }),
        });
      }
      return Promise.reject(new Error('Unexpected fetch url: ' + url));
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /cultural knowledge/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/next page/i)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your team name...')).toBeInTheDocument();
  });

  it('Test 8: Authenticated participant with completed team name opening root / lands on New Landing Page', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/v1/auth/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            user: { id: 'usr-3', email: 'champion@example.com', fullName: 'Champion Lead', role: 'participant', teamName: 'Apex Titans' },
            hasTeamName: true,
          }),
        });
      }
      return Promise.reject(new Error('Unexpected fetch url: ' + url));
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Apex Titans')).toBeInTheDocument();
    });
    expect(screen.getByText(/Where Campus Culture Comes Alive/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /proceed to quiz/i })).toBeInTheDocument();
  });
});
