import { describe, it, expect, beforeEach } from 'vitest';
import app from '../app';

describe('Round 1 Cultural Quiz Backend APIs', () => {
  let sessionCookie: string;

  beforeEach(async () => {
    // 1. Authenticate dev participant to get session cookie
    const authRes = await app.request('/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'quiz.contestant@example.com',
        name: 'Cultural Contestant',
      }),
    });
    const setCookie = authRes.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    sessionCookie = setCookie!.split(';')[0];

    // Set team name
    await app.request('/api/v1/participant/team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ teamName: 'Team Aroha' }),
    });
  });

  it('POST /api/v1/quiz/round-1/start initiates 60-min attempt and returns 100 sanitized questions (ZERO answer keys)', async () => {
    const res = await app.request('/api/v1/quiz/round-1/start', {
      method: 'POST',
      headers: {
        Cookie: sessionCookie,
      },
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);

    // Attempt verification (Section 53 & 54)
    expect(data.attempt).toBeDefined();
    expect(data.attempt.totalQuestions).toBe(100);
    expect(data.attempt.durationMinutes).toBe(60);
    expect(data.attempt.remainingSeconds).toBeGreaterThan(3500); // ~3600 seconds (60 mins)
    expect(data.attempt.isSubmitted).toBe(false);

    // Sanitized Questions (Section 44 & 105)
    expect(data.questions.length).toBe(100);
    const firstQ = data.questions[0];
    expect(firstQ.id).toBe('Q001');
    expect(firstQ.number).toBe(1);
    expect(firstQ.text).toBe('Which dance is called the mother of all classical dances?');
    expect(firstQ.options.length).toBe(4);

    // CRITICAL: Ensure NO answer key or correct_option is returned in API response
    for (const q of data.questions) {
      expect((q as any).correct_option).toBeUndefined();
      expect((q as any).correct_answer).toBeUndefined();
      expect((q as any).answerKey).toBeUndefined();
      expect((q as any).explanation).toBeUndefined();
    }
  });

  it('GET /api/v1/quiz/round-1/attempt returns active attempt state and remaining time', async () => {
    // Start attempt first
    await app.request('/api/v1/quiz/round-1/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    const res = await app.request('/api/v1/quiz/round-1/attempt', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.attempt.totalQuestions).toBe(100);
    expect(data.attempt.remainingSeconds).toBeGreaterThan(0);
  });

  it('PUT /api/v1/quiz/round-1/answers/:questionId autosaves answer and POST /review toggles review', async () => {
    await app.request('/api/v1/quiz/round-1/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    // 1. Autosave answer
    const ansRes = await app.request('/api/v1/quiz/round-1/answers/Q001', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ selectedOption: 'B' }),
    });

    expect(ansRes.status).toBe(200);
    const ansData = (await ansRes.json()) as any;
    expect(ansData.success).toBe(true);
    expect(ansData.selectedOption).toBe('B');

    // 2. Toggle review
    const revRes = await app.request('/api/v1/quiz/round-1/review/Q001', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ isMarkedForReview: true }),
    });

    expect(revRes.status).toBe(200);
    const revData = (await revRes.json()) as any;
    expect(revData.success).toBe(true);
    expect(revData.isMarkedForReview).toBe(true);

    // 3. Verify in attempt state
    const attRes = await app.request('/api/v1/quiz/round-1/attempt', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const attData = (await attRes.json()) as any;
    expect(attData.attempt.answers['Q001'].selectedOption).toBe('B');
    expect(attData.attempt.answers['Q001'].isMarkedForReview).toBe(true);
  });


  it('POST /api/v1/quiz/round-1/submit evaluates server-authoritative score and prevents duplicate submissions', async () => {
    await app.request('/api/v1/quiz/round-1/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    // Answer Q1 with 'B' (correct from DOCX) and Q2 with 'B' (correct: Kanchipuram Saree)
    await app.request('/api/v1/quiz/round-1/answers/Q001', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ selectedOption: 'B' }),
    });

    await app.request('/api/v1/quiz/round-1/answers/Q002', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ selectedOption: 'B' }),
    });

    // Submit
    const subRes = await app.request('/api/v1/quiz/round-1/submit', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    expect(subRes.status).toBe(200);
    const subData = (await subRes.json()) as any;
    expect(subData.success).toBe(true);
    expect(subData.result.totalQuestions).toBe(100);
    expect(subData.result.answeredCount).toBe(2);
    expect(subData.result.score).toBe(2); // Q1 and Q2 both correct!

    // Test Idempotency: Second submit returns existing result without error or re-scoring (Section 82)
    const subRes2 = await app.request('/api/v1/quiz/round-1/submit', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    expect(subRes2.status).toBe(200);
    const subData2 = (await subRes2.json()) as any;
    expect(subData2.result.score).toBe(2);

    // Verify GET /result
    const resGet = await app.request('/api/v1/quiz/round-1/result', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    expect(resGet.status).toBe(200);
    const resGetData = (await resGet.json()) as any;
    expect(resGetData.result.score).toBe(2);
    expect(resGetData.result.teamName).toBe('Team Aroha');

    // Verify Leaderboard reflects official Round 1 marks
    const leadRes = await app.request('/api/v1/leaderboard', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    expect(leadRes.status).toBe(200);
    const leadData = (await leadRes.json()) as any;
    expect(leadData.success).toBe(true);
    const teamEntry = leadData.leaderboard.find((entry: any) => entry.teamName === 'Team Aroha');
    expect(teamEntry).toBeDefined();
    expect(teamEntry.score).toBe(2);

    // Verify Notification: Exactly one notification generated idempotently
    const notifRes = await app.request('/api/v1/notifications', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    expect(notifRes.status).toBe(200);
    const notifData = (await notifRes.json()) as any;
    expect(notifData.success).toBe(true);
    const round1Notifs = notifData.notifications.filter(
      (n: any) => n.title.includes('Round 1') || n.type === 'ROUND_1_COMPLETION'
    );
    expect(round1Notifs.length).toBe(1);
    expect(round1Notifs[0].message).toContain('marks are now available on the leaderboard');
  });

  it('POST /api/v1/quiz/round-1/security-events logs proctor signals and eliminates participant on anomaly', async () => {
    const secRes = await app.request('/api/v1/quiz/round-1/security-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        eventType: 'TAB_SWITCH',
        metadata: { durationMs: 2500 },
      }),
    });

    expect(secRes.status).toBe(200);
    const secData = (await secRes.json()) as any;
    expect(secData.success).toBe(true);
    expect(secData.eventRecorded).toBe(true);
    expect(secData.eliminated).toBe(true);
  });
});
