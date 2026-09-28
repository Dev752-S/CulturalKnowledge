import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

describe('Frontend App Foundation', () => {
  it('Renders the SKP Skill Arena branding and hero header', () => {
    // Mock global fetch for health check
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'SKP Skill Arena API',
        checks: { database: { status: 'up' }, redis: { status: 'up' } },
      }),
    } as any);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    expect(screen.getByText('SKP SKILL ARENA')).toBeInTheDocument();
    expect(screen.getByText('FEST 2026')).toBeInTheDocument();
    expect(screen.getAllByText(/Skill Arena Competition/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Competition Rules')).toBeInTheDocument();
  });
});
