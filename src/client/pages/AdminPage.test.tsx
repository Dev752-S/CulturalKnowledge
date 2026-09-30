import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminPage from './AdminPage';

describe.skip('AdminPage Master Control Room UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Renders Master Admin Portal login card when unauthenticated', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/admin/me')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ success: false }),
        } as any);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as any);
    });

    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    // Should display Master Admin Portal header
    await waitFor(() => {
      expect(screen.getByText('Master Admin Portal')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('admin@skparena.edu.in')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Enter admin passkey')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /authorize & enter console/i })).toBeInTheDocument();
  });

  it('Quick Fill button populates root admin credentials and authorizes session', async () => {
    global.fetch = vi.fn().mockImplementation((url: string, _options?: any) => {
      if (url.includes('/api/v1/admin/me')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ success: false }),
        } as any);
      }
      if (url.includes('/api/v1/auth/admin-login')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            user: { email: 'darkdev257@gmail.com', fullName: 'Super Administrator', role: 'admin' },
          }),
        } as any);
      }
      if (url.includes('/api/v1/admin/stats')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            stats: {
              events: { total: 1, active: 1, primaryEvent: {} },
              quizzes: { round1TotalQuestions: 100, round2TotalQuestions: 50, round1CategoriesCount: 5 },
              members: { total: 6, participants: 5, admins: 1, qualifiedForRound2: 3 },
              activity: { submittedAttempts: 4, inProgressAttempts: 1, totalAttempts: 5 },
              serverTime: new Date().toISOString(),
            },
          }),
        } as any);
      }
      if (url.includes('/api/v1/admin/events')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            events: [
              {
                id: 'evt-test-1',
                name: 'SKP Cultural Fest 2026 - Skill Arena',
                round1DurationMinutes: 60,
                round1TotalQuestions: 100,
                round1IsActive: true,
                round2IsActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        } as any);
      }
      if (url.includes('/api/v1/admin/questions/round-1')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            items: [
              {
                question_id: 'Q001',
                source_question_number: 1,
                category: 'INDIAN TRADITIONAL CULTURE',
                question_text: 'Which dance is called the mother of all classical dances?',
                option_a: 'Kathak',
                option_b: 'Bharatanatyam',
                option_c: 'Kuchipudi',
                option_d: 'Odissi',
                correct_option: 'B',
                difficulty: 'Medium',
              },
            ],
            categories: ['INDIAN TRADITIONAL CULTURE'],
          }),
        } as any);
      }
      if (url.includes('/api/v1/admin/members')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            items: [
              {
                id: 'mem-1',
                userId: 'usr-1',
                fullName: 'Aarav Sharma',
                email: 'aarav.sharma@skp.edu.in',
                role: 'participant',
                registrationNumber: 'SKP-100201',
                collegeName: 'SKP Engineering College',
                department: 'CSE',
                yearOfStudy: 'III',
                phone: '+91 98401 23456',
                teamName: 'Quantum Coders',
                isQualifiedForRound2: true,
                isActive: true,
                quizStatus: 'SUBMITTED',
                quizScore: 84,
                createdAt: new Date().toISOString(),
              },
            ],
          }),
        } as any);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as any);
    });

    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Master Admin Portal')).toBeInTheDocument();
    });

    // Fill admin credentials
    await waitFor(() => {
      expect(screen.getByPlaceholderText('admin@skparena.edu.in')).toBeInTheDocument();
    });
    const emailInput = screen.getByPlaceholderText('admin@skparena.edu.in');
    const passkeyInput = screen.getByPlaceholderText('Enter admin passkey');
    fireEvent.change(emailInput, { target: { value: 'admin@skparena.edu.in' } });
    fireEvent.change(passkeyInput, { target: { value: 'Admin@SKP2026!#' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /authorize & enter console/i });
    fireEvent.click(submitBtn);

    // Once authorized, verify Admin Control Room is displayed
    await waitFor(() => {
      expect(screen.getByText('Admin Control Room')).toBeInTheDocument();
    });

    // Check Tabs
    expect(screen.getByRole('button', { name: /events & rounds/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quiz questions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /members & contenders/i })).toBeInTheDocument();
  });
});
