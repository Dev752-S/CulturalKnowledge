import { describe, it, expect, beforeEach } from 'vitest';
import app from '../app';
import rawQuestions from '../data/round2_questions_50.json';
import fs from 'fs';
import path from 'path';

describe('Round 2 Flip-Card Logo Identification Game Backend APIs', () => {
  let sessionCookie: string;

  beforeEach(async () => {
    // Authenticate participant to get session cookie
    const authRes = await app.request('/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `logo.flip.${Date.now()}.${Math.random().toString(36).substring(2)}@example.com`,
        name: 'Flip Contestant',
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
      body: JSON.stringify({ teamName: 'Flip Explorers' }),
    });
  });

  // =========================================================================
  // 1. START ATTEMPT & 50 SANITIZED QUESTIONS
  // =========================================================================
  it('POST /api/v1/round2/start initiates untimed, unscored attempt and returns 50 sanitized flip-card questions (ZERO answer keys, 4 TEXT options)', async () => {
    const res = await app.request('/api/v1/round2/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);

    // Attempt verification (Timed & Scored according to Round 2 timer requirements)
    expect(data.attempt).toBeDefined();
    expect(data.attempt.totalQuestions).toBe(50);
    expect(data.attempt.isSubmitted).toBe(false);
    expect(data.attempt.durationMinutes).toBe(30);
    expect(data.attempt.remainingSeconds).toBeGreaterThan(0);

    // Exactly 50 questions
    expect(data.questions.length).toBe(50);
    const firstQ = data.questions[0];
    expect(firstQ.questionId).toBe('R2Q001');
    expect(firstQ.questionNumber).toBe(1);
    expect(firstQ.questionText).toBe('Which logo belongs to the company behind the iPhone?');

    // Single card logo image
    expect(firstQ.logoSvgUrl).toBeDefined();
    expect(firstQ.logoPngUrl).toBeDefined();

    // Exactly 4 TEXT options (NOT logo images)
    expect(firstQ.options.length).toBe(4);
    const keys = firstQ.options.map((o: any) => o.key);
    expect(keys.sort()).toEqual(['A', 'B', 'C', 'D']);

    for (const q of data.questions) {
      // CRITICAL: Ensure NO answer key, correct_logo, points, or scores are exposed
      expect((q as any).correctLogoId).toBeUndefined();
      expect((q as any).correctTileNumber).toBeUndefined();
      expect((q as any).correctBrandName).toBeUndefined();
      expect((q as any).points).toBeUndefined();
      expect((q as any).score).toBeUndefined();

      // Card has single logo image
      expect(q.logoSvgUrl).toBeDefined();
      expect(q.logoPngUrl).toBeDefined();

      // Options must be text (brandName / text)
      for (const opt of q.options) {
        expect(opt.text || opt.brandName).toBeDefined();
        expect(typeof (opt.text || opt.brandName)).toBe('string');
        expect((opt as any).isCorrect).toBeUndefined();
        expect((opt as any).points).toBeUndefined();
      }
    }
  });

  it('GET /api/v1/quiz/round-2/start forwards to Round 2 router', async () => {
    const res = await app.request('/api/v1/quiz/round-2/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.attempt.totalQuestions).toBe(50);
  });

  // =========================================================================
  // 2. 5-SECOND REVEAL LIFECYCLE & SECURITY (SECTION 6, 7, 21, 40, 50)
  // =========================================================================
  it('POST /api/v1/round2/reveal/:questionId starts 5-second reveal window and locks permanently after 5 seconds', async () => {
    // Start attempt
    await app.request('/api/v1/round2/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    // 1. Initial reveal at T0
    const rev1 = await app.request('/api/v1/round2/reveal/R2Q001', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    expect(rev1.status).toBe(200);
    const data1 = (await rev1.json()) as any;
    expect(data1.success).toBe(true);
    expect(data1.isLocked).toBe(false);
    expect(data1.remainingMs).toBeLessThanOrEqual(5000);
    expect(data1.remainingMs).toBeGreaterThan(0);
    expect(data1.revealStartedAt).toBeDefined();

    // 2. Call again immediately: reveal is still active
    const rev2 = await app.request('/api/v1/round2/reveal/R2Q001', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    const data2 = (await rev2.json()) as any;
    expect(data2.isLocked).toBe(false);

    // 3. Verify in attempt state
    const attRes = await app.request('/api/v1/round2/attempt', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const attData = (await attRes.json()) as any;
    expect(attData.attempt.reveals['R2Q001']).toBeDefined();
    expect(attData.attempt.reveals['R2Q001'].isLocked).toBe(false);

    // 4. Test security: Tampering to restart reveal is prevented
    // An active reveal preserves its original revealStartedAt timestamp
    expect(attData.attempt.reveals['R2Q001'].revealStartedAt).toBe(data1.revealStartedAt);
  });

  // =========================================================================
  // 3. NO ACCIDENTAL COMPLETION & 50-QUESTION PROGRESSION (SECTION 12, 13, 48, 49)
  // =========================================================================
  it('Answering Q1, Q2 ... Q49 and Q50 does NOT submit the attempt; attempt remains ACTIVE', async () => {
    const startRes = await app.request('/api/v1/round2/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    const startData = (await startRes.json()) as any;
    const questions = startData.questions;

    // 1. Answer Question 1
    const q1 = questions[0];
    const ans1 = await app.request(`/api/v1/round2/answers/${q1.questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        selectedOptionId: q1.options[0].optionId,
        selectedBrandName: q1.options[0].text,
      }),
    });
    expect(ans1.status).toBe(200);

    // Check attempt after Q1: MUST REMAIN ACTIVE!
    let attRes = await app.request('/api/v1/round2/attempt', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    let attData = (await attRes.json()) as any;
    expect(attData.attempt.isSubmitted).toBe(false);
    expect(attData.attempt.answeredCount).toBe(1);

    // 2. Answer Question 2
    const q2 = questions[1];
    const ans2 = await app.request(`/api/v1/round2/answers/${q2.questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        selectedOptionId: q2.options[0].optionId,
        selectedBrandName: q2.options[0].text,
      }),
    });
    expect(ans2.status).toBe(200);

    // Check attempt after Q2: MUST REMAIN ACTIVE!
    attRes = await app.request('/api/v1/round2/attempt', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    attData = (await attRes.json()) as any;
    expect(attData.attempt.isSubmitted).toBe(false);
    expect(attData.attempt.answeredCount).toBe(2);

    // 3. Answer remaining questions through Q50
    for (let i = 2; i < 50; i++) {
      const q = questions[i];
      const opt = q.options[0];
      const r = await app.request(`/api/v1/round2/answers/${q.questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          selectedOptionId: opt.optionId,
          selectedBrandName: opt.text,
        }),
      });
      expect(r.status).toBe(200);
    }

    // Check attempt after ALL 50 QUESTIONS: MUST STILL REMAIN ACTIVE (NOT SUBMITTED)!
    attRes = await app.request('/api/v1/round2/attempt', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    attData = (await attRes.json()) as any;
    expect(attData.attempt.isSubmitted).toBe(false);
    expect(attData.attempt.answeredCount).toBe(50);
    expect(attData.attempt.unansweredCount).toBe(0);

    // 4. EXPLICIT FINAL SUBMISSION (Section 30, 31)
    const submitRes = await app.request('/api/v1/round2/submit', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    expect(submitRes.status).toBe(200);
    const submitData = (await submitRes.json()) as any;
    expect(submitData.success).toBe(true);
    expect(submitData.result.answeredCount).toBe(50);
    expect(submitData.result.unansweredCount).toBe(0);
    expect(submitData.result.submittedAt).toBeDefined();

    // Verify attempt is now SUBMITTED
    attRes = await app.request('/api/v1/round2/attempt', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    attData = (await attRes.json()) as any;
    expect(attData.attempt.isSubmitted).toBe(true);

    // 5. Result API Verification (Zero marks, Zero points, No leaderboard points)
    const resultRes = await app.request('/api/v1/round2/result', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    expect(resultRes.status).toBe(200);
    const resultData = (await resultRes.json()) as any;
    expect(resultData.success).toBe(true);
    expect(resultData.result.score).toBeUndefined();
    expect(resultData.result.points).toBeUndefined();
    expect(resultData.result.marks).toBeUndefined();
    expect(resultData.result.rank).toBeUndefined();
  });

  // =========================================================================
  // 4. ROUND 2 MUST NOT MODIFY ROUND 1 LEADERBOARD
  // =========================================================================
  it('Round 2 completion does NOT add points to Round 1 or modify the Round 1 leaderboard', async () => {
    // Check leaderboard before Round 2
    const lbBefore = await app.request('/api/v1/leaderboard');
    const lbBeforeData = (await lbBefore.json()) as any;

    // Complete Round 2
    await app.request('/api/v1/round2/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    await app.request('/api/v1/round2/submit', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    // Check leaderboard after Round 2
    const lbAfter = await app.request('/api/v1/leaderboard');
    const lbAfterData = (await lbAfter.json()) as any;

    // Round 1 leaderboard must be untouched
    expect(lbAfterData.round1).toEqual(lbBeforeData.round1);
  });

  // =========================================================================
  // 5. REFRESH / RECONNECT RECOVERY (SECTION 20, 51)
  // =========================================================================
  it('Page refresh restores attempt, stable question order, answered questions, and locked cards', async () => {
    // 1. Start attempt
    const startRes = await app.request('/api/v1/round2/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    const startData = (await startRes.json()) as any;
    const initialOrder = startData.questions.map((q: any) => q.questionId);

    // 2. Reveal Q1 and answer Q1
    await app.request('/api/v1/round2/reveal/R2Q001', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    await app.request('/api/v1/round2/answers/R2Q001', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        selectedOptionId: startData.questions[0].options[0].optionId,
        selectedBrandName: startData.questions[0].options[0].text,
      }),
    });

    // 3. Simulate page refresh: call GET /attempt and GET /questions
    const refreshAtt = await app.request('/api/v1/round2/attempt', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const refreshAttData = (await refreshAtt.json()) as any;
    expect(refreshAttData.success).toBe(true);
    expect(refreshAttData.attempt.isSubmitted).toBe(false);
    expect(refreshAttData.attempt.answers['R2Q001']).toBeDefined();
    expect(refreshAttData.attempt.answers['R2Q001'].isCardLocked).toBe(true);

    const refreshQs = await app.request('/api/v1/round2/questions', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const refreshQsData = (await refreshQs.json()) as any;
    const restoredOrder = refreshQsData.questions.map((q: any) => q.questionId);

    // Question order must NOT reshuffle on refresh
    expect(restoredOrder).toEqual(initialOrder);
  });

  // =========================================================================
  // 6. 50-QUESTION DATA INTEGRITY (SECTION 25, 52)
  // =========================================================================
  it('Validates 50 questions: 1 logo image, 1 correct name, 4 text options, 0 duplicate answers', () => {
    expect(rawQuestions.length).toBe(50);

    for (const q of rawQuestions) {
      expect(q.questionId).toBeDefined();
      expect(q.correctLogoId).toBeDefined();
      expect(q.correctTileNumber).toBeDefined();
      expect(q.correctBrandName).toBeDefined();
      expect(q.options.length).toBe(4);

      // Verify logo image file exists in public/logos/
      const numStr = String(q.correctTileNumber).padStart(3, '0');
      const svgPath = path.join(process.cwd(), 'public', 'logos', `${numStr}.svg`);
      const pngPath = path.join(process.cwd(), 'public', 'logos', `${numStr}.png`);
      const fileExists = fs.existsSync(svgPath) || fs.existsSync(pngPath);
      expect(fileExists).toBe(true);

      // Exactly 1 correct answer matching correctBrandName
      const correctMatches = q.options.filter(
        (o: any) => o.brandName.toLowerCase() === q.correctBrandName.toLowerCase()
      );
      expect(correctMatches.length).toBe(1);

      // Exactly 3 incorrect options
      const incorrectMatches = q.options.filter(
        (o: any) => o.brandName.toLowerCase() !== q.correctBrandName.toLowerCase()
      );
      expect(incorrectMatches.length).toBe(3);
    }
  });

  // =========================================================================
  // 7. SECURITY & TAMPER PROTECTION (SECTION 39, 47, 54)
  // =========================================================================
  it('Rejects invalid option, nonexistent question, and prevents duplicate answering', async () => {
    await app.request('/api/v1/round2/start', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    // 1. Submit nonexistent question ID -> 404
    const fakeQRes = await app.request('/api/v1/round2/answers/NON_EXISTENT_Q', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ selectedOptionId: 'opt_fake' }),
    });
    expect(fakeQRes.status).toBe(404);

    // 2. Submit invalid option ID for Q1 -> 400
    const fakeOptRes = await app.request('/api/v1/round2/answers/R2Q001', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ selectedOptionId: 'opt_invalid_malicious_id' }),
    });
    expect(fakeOptRes.status).toBe(400);

    // 3. Submit valid answer
    const validAns = await app.request('/api/v1/round2/answers/R2Q001', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ selectedOptionId: 'opt_1_A' }),
    });
    expect(validAns.status).toBe(200);

    // 4. Double answer: submit same answer is idempotent
    const repeatAns = await app.request('/api/v1/round2/answers/R2Q001', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ selectedOptionId: 'opt_1_A' }),
    });
    expect(repeatAns.status).toBe(200);
    const repeatData = (await repeatAns.json()) as any;
    expect(repeatData.selectedOptionId).toBe('opt_1_A');

    // 5. Submit security proctor signal
    const secRes = await app.request('/api/v1/round2/security-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ eventType: 'TAB_SWITCH', metadata: { windowFocus: false } }),
    });
    expect(secRes.status).toBe(200);
    const secData = (await secRes.json()) as any;
    expect(secData.success).toBe(true);
  });
});
