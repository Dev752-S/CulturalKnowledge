import { describe, it, expect, beforeEach } from 'vitest';
import app from '../app';

describe('Round 2 Visual Logo Quiz Backend APIs', () => {
  let sessionCookie: string;

  beforeEach(async () => {
    // 1. Authenticate dev participant to get session cookie
    const authRes = await app.request('/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'logo.contestant@example.com',
        name: 'Logo Master',
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
      body: JSON.stringify({ teamName: 'Visual Explorers' }),
    });
  });

  it('POST /api/v1/round2/start initiates untimed, unscored attempt and returns 50 sanitized questions (ZERO answer keys, ZERO company names)', async () => {
    const res = await app.request('/api/v1/round2/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);

    // Attempt verification (Untimed & Unscored)
    expect(data.attempt).toBeDefined();
    expect(data.attempt.totalQuestions).toBe(50);
    expect(data.attempt.isSubmitted).toBe(false);
    expect(data.attempt.durationMinutes).toBeUndefined();
    expect(data.attempt.remainingSeconds).toBeUndefined();
    expect(data.attempt.endsAt).toBeUndefined();
    expect(data.attempt.score).toBeUndefined();

    // Exactly 50 sanitized questions
    expect(data.questions.length).toBe(50);
    const firstQ = data.questions[0];
    expect(firstQ.questionId).toBe('R2Q001');
    expect(firstQ.questionNumber).toBe(1);
    expect(firstQ.questionText).toBe('Which logo belongs to the company behind the iPhone?');
    expect(firstQ.options.length).toBe(4);

    // Verify option structure and labels A, B, C, D
    const keys = firstQ.options.map((o: any) => o.key);
    expect(keys.sort()).toEqual(['A', 'B', 'C', 'D']);

    // CRITICAL: Ensure NO answer key, correct_logo, points, or brand names are exposed in API response
    for (const q of data.questions) {
      expect((q as any).correctLogoId).toBeUndefined();
      expect((q as any).correctTileNumber).toBeUndefined();
      expect((q as any).correctBrandName).toBeUndefined();
      expect((q as any).points).toBeUndefined();
      expect((q as any).difficulty).toBeUndefined();

      for (const opt of q.options) {
        expect((opt as any).brandName).toBeUndefined();
        expect((opt as any).answer).toBeUndefined();
        expect((opt as any).companyName).toBeUndefined();
        expect((opt as any).isCorrect).toBeUndefined();
        expect((opt as any).points).toBeUndefined();
        expect(opt.svgUrl).toBeDefined();
        expect(opt.pngUrl).toBeDefined();
      }
    }
  });

  it('GET /api/v1/quiz/round-2/start also works via forwarded subroute', async () => {
    const res = await app.request('/api/v1/quiz/round-2/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.attempt.totalQuestions).toBe(50);
  });

  it('GET /api/v1/round2/attempt returns active attempt without timer or score', async () => {
    await app.request('/api/v1/round2/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    const res = await app.request('/api/v1/round2/attempt', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.attempt.totalQuestions).toBe(50);
    expect(data.attempt.remainingSeconds).toBeUndefined();
    expect(data.attempt.score).toBeUndefined();
  });

  it('PUT /api/v1/round2/answers/:questionId autosaves answer and POST /review toggles review', async () => {
    await app.request('/api/v1/round2/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    // 1. Autosave answer
    const ansRes = await app.request('/api/v1/round2/answers/R2Q001', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ selectedLogoId: 'L001', selectedOptionId: 'opt_1_A' }),
    });

    expect(ansRes.status).toBe(200);
    const ansData = (await ansRes.json()) as any;
    expect(ansData.success).toBe(true);
    expect(ansData.selectedLogoId).toBe('L001');

    // 2. Toggle review
    const revRes = await app.request('/api/v1/round2/review/R2Q001', {
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
    const attRes = await app.request('/api/v1/round2/attempt', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const attData = (await attRes.json()) as any;
    expect(attData.attempt.answers['R2Q001'].selectedLogoId).toBe('L001');
    expect(attData.attempt.answers['R2Q001'].isMarkedForReview).toBe(true);
  });

  it('POST /api/v1/round2/security-events logs proctor signals (TAB_SWITCH, FULLSCREEN_EXIT)', async () => {
    const secRes = await app.request('/api/v1/round2/security-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        eventType: 'TAB_SWITCH',
        metadata: { durationMs: 1800 },
      }),
    });

    expect(secRes.status).toBe(200);
    const secData = (await secRes.json()) as any;
    expect(secData.success).toBe(true);
    expect(secData.eventRecorded).toBe(true);
  });

  it('POST /api/v1/round2/submit submits without score/marks and protects against duplicate submissions', async () => {
    await app.request('/api/v1/round2/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    // Answer Q1 and Q2
    await app.request('/api/v1/round2/answers/R2Q001', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ selectedLogoId: 'L001' }),
    });

    await app.request('/api/v1/round2/answers/R2Q002', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ selectedLogoId: 'L002' }),
    });

    // Submit
    const subRes = await app.request('/api/v1/round2/submit', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    expect(subRes.status).toBe(200);
    const subData = (await subRes.json()) as any;
    expect(subData.success).toBe(true);
    expect(subData.result.totalQuestions).toBe(50);
    expect(subData.result.answeredCount).toBe(2);
    expect(subData.result.unansweredCount).toBe(48);

    // CRITICAL: NO score, NO marks, NO points in result
    expect(subData.result.score).toBeUndefined();
    expect(subData.result.points).toBeUndefined();
    expect(subData.result.marks).toBeUndefined();

    // Idempotency: Second submit returns existing result without error
    const subRes2 = await app.request('/api/v1/round2/submit', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    expect(subRes2.status).toBe(200);
    const subData2 = (await subRes2.json()) as any;
    expect(subData2.alreadySubmitted).toBe(true);
    expect(subData2.result.score).toBeUndefined();

    // Verify GET /result
    const resGet = await app.request('/api/v1/round2/result', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    expect(resGet.status).toBe(200);
    const resGetData = (await resGet.json()) as any;
    expect(resGetData.result.totalQuestions).toBe(50);
    expect(resGetData.result.answeredCount).toBe(2);
    expect(resGetData.result.score).toBeUndefined();
    expect(resGetData.result.points).toBeUndefined();
    expect(resGetData.result.teamName).toBe('Visual Explorers');
  });

  it('Verifies Round 2 submission does NOT alter participant leaderboard score (Section 52 regression test)', async () => {
    // 1. Submit Round 1 to get a score on the leaderboard
    await app.request('/api/v1/quiz/round-1/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    await app.request('/api/v1/quiz/round-1/answers/Q001', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ selectedOption: 'B' }),
    });
    await app.request('/api/v1/quiz/round-1/submit', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    const lbBefore = await app.request('/api/v1/leaderboard', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const lbDataBefore = (await lbBefore.json()) as any;
    const teamBefore = lbDataBefore.leaderboard.find((e: any) => e.teamName === 'Visual Explorers');
    expect(teamBefore).toBeDefined();
    const scoreBefore = teamBefore.score;
    expect(scoreBefore).toBe(1);

    // 2. Start and submit Round 2
    await app.request('/api/v1/round2/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    await app.request('/api/v1/round2/answers/R2Q001', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ selectedLogoId: 'L001' }),
    });
    await app.request('/api/v1/round2/submit', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    // 3. Reload leaderboard and verify score is strictly unchanged
    const lbAfter = await app.request('/api/v1/leaderboard', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const lbDataAfter = (await lbAfter.json()) as any;
    const teamAfter = lbDataAfter.leaderboard.find((e: any) => e.teamName === 'Visual Explorers');
    expect(teamAfter).toBeDefined();
    expect(teamAfter.score).toBe(scoreBefore);
  });
});
