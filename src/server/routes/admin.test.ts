import { describe, it, expect, beforeEach } from 'vitest';
import app from '../app';

describe('Admin Control Center APIs', () => {
  let adminCookie: string;

  beforeEach(async () => {
    // Authenticate with the user's admin credentials
    const loginRes = await app.request('/api/v1/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'darkdev257@gmail.com',
        passkey: 'dev7.$25#@%9',
      }),
    });

    expect(loginRes.status).toBe(200);
    const setCookie = loginRes.headers.get('set-cookie');
    expect(setCookie).toContain('skp_session=');
    adminCookie = setCookie!.split(';')[0];
  });

  it('Rejects invalid admin passkey with 401', async () => {
    const res = await app.request('/api/v1/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'darkdev257@gmail.com',
        passkey: 'wrong_password',
      }),
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
  });

  it('GET /api/v1/admin/stats returns full system overview metrics', async () => {
    const res = await app.request('/api/v1/admin/stats', {
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.stats).toHaveProperty('events');
    expect(body.stats).toHaveProperty('quizzes');
    expect(body.stats).toHaveProperty('members');
    expect(body.stats.quizzes.round1TotalQuestions).toBeGreaterThanOrEqual(20);
    expect(body.stats.quizzes.round2TotalQuestions).toBeGreaterThanOrEqual(50);
  });

  it('Events CRUD: list, create, alter, toggle, and delete events', async () => {
    // 1. List events
    const listRes = await app.request('/api/v1/admin/events', {
      headers: { Cookie: adminCookie },
    });
    expect(listRes.status).toBe(200);
    const listData = (await listRes.json()) as any;
    expect(listData.events.length).toBeGreaterThanOrEqual(1);

    // 2. Create event
    const createRes = await app.request('/api/v1/admin/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'SKP Hackathon & Cultural Mega Arena 2026',
        round1DurationMinutes: 45,
        round1TotalQuestions: 50,
        round1IsActive: true,
        round2IsActive: false,
      }),
    });
    expect(createRes.status).toBe(200);
    const createData = (await createRes.json()) as any;
    expect(createData.event.name).toBe('SKP Hackathon & Cultural Mega Arena 2026');
    const createdEventId = createData.event.id;

    // 3. Alter event
    const updateRes = await app.request(`/api/v1/admin/events/${createdEventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'SKP Hackathon & Cultural Mega Arena 2026 (Updated)',
        round1DurationMinutes: 50,
      }),
    });
    expect(updateRes.status).toBe(200);
    const updateData = (await updateRes.json()) as any;
    expect(updateData.event.name).toBe('SKP Hackathon & Cultural Mega Arena 2026 (Updated)');
    expect(updateData.event.round1DurationMinutes).toBe(50);

    // 4. Toggle round status
    const toggleRes = await app.request(`/api/v1/admin/events/${createdEventId}/toggle-round`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        round: 'round2',
        active: true,
      }),
    });
    expect(toggleRes.status).toBe(200);
    const toggleData = (await toggleRes.json()) as any;
    expect(toggleData.event.round2IsActive).toBe(true);

    // 5. Delete event
    const delRes = await app.request(`/api/v1/admin/events/${createdEventId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    expect(delRes.status).toBe(200);
  });

  it('Quizzes CRUD: create, alter, and delete questions', async () => {
    // 1. Create a question
    const addRes = await app.request('/api/v1/admin/questions/round-1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        question_text: 'What ancient instrument is considered the precursor to the Veena?',
        category: 'INDIAN TRADITIONAL CULTURE',
        option_a: 'Yazh',
        option_b: 'Sitar',
        option_c: 'Sarod',
        option_d: 'Tanpura',
        correct_option: 'A',
        difficulty: 'Hard',
      }),
    });
    expect(addRes.status).toBe(200);
    const addData = (await addRes.json()) as any;
    expect(addData.question.question_text).toContain('precursor to the Veena');
    expect(addData.question.correct_option).toBe('A');
    const questionId = addData.question.question_id;

    // 2. Alter question
    const updateRes = await app.request(`/api/v1/admin/questions/round-1/${questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        difficulty: 'Medium',
        option_b: 'Modern Sitar',
      }),
    });
    expect(updateRes.status).toBe(200);
    const updateData = (await updateRes.json()) as any;
    expect(updateData.question.difficulty).toBe('Medium');
    expect(updateData.question.option_b).toBe('Modern Sitar');

    // 3. Delete question
    const delRes = await app.request(`/api/v1/admin/questions/round-1/${questionId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    expect(delRes.status).toBe(200);
  });

  it('Members CRUD: list, add, alter, reset attempt, and delete member', async () => {
    // 1. Add new member
    const addRes = await app.request('/api/v1/admin/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Vikramaditya Chola',
        email: 'vikram.chola@skp.edu.in',
        role: 'participant',
        collegeName: 'SKP Engineering College',
        department: 'CSE',
        teamName: 'Chola Dynasty',
        isQualifiedForRound2: false,
      }),
    });
    expect(addRes.status).toBe(200);
    const addData = (await addRes.json()) as any;
    expect(addData.member.fullName).toBe('Vikramaditya Chola');
    const memberId = addData.member.id;

    // 2. Alter member (promote to proctor, qualify for Round 2)
    const updateRes = await app.request(`/api/v1/admin/members/${memberId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        role: 'proctor',
        isQualifiedForRound2: true,
      }),
    });
    expect(updateRes.status).toBe(200);
    const updateData = (await updateRes.json()) as any;
    expect(updateData.member.role).toBe('proctor');
    expect(updateData.member.isQualifiedForRound2).toBe(true);

    // 3. Reset member attempt
    const resetRes = await app.request(`/api/v1/admin/members/${memberId}/reset-attempt`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
    });
    expect(resetRes.status).toBe(200);

    // 4. Delete member
    const delRes = await app.request(`/api/v1/admin/members/${memberId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    expect(delRes.status).toBe(200);
  });

  it('Round Activation Enforcement: only enabled rounds can be attended by competitors', async () => {
    // 1. Create a competitor session
    const compLoginRes = await app.request('/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'competitor.student@skp.edu.in',
        name: 'Competitor Student',
      }),
    });
    expect(compLoginRes.status).toBe(200);
    const compCookie = compLoginRes.headers.get('set-cookie')!.split(';')[0];

    // Set team name for competitor
    await app.request('/api/v1/auth/team-name', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: compCookie,
      },
      body: JSON.stringify({ teamName: 'Agile Warriors' }),
    });

    // 2. Admin explicitly disables Round 1
    const disableR1Res = await app.request('/api/v1/admin/rounds/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ round: 'round1', active: false }),
    });
    expect(disableR1Res.status).toBe(200);
    const disableR1Data = (await disableR1Res.json()) as any;
    expect(disableR1Data.success).toBe(true);
    expect(disableR1Data.active).toBe(false);

    // 3. Competitor tries to attend/start Round 1 -> MUST BE REJECTED with 403 ROUND_INACTIVE
    const compStartBlocked = await app.request('/api/v1/quiz/round-1/start', {
      method: 'POST',
      headers: { Cookie: compCookie },
    });
    expect(compStartBlocked.status).toBe(403);
    const compStartBlockedData = (await compStartBlocked.json()) as any;
    expect(compStartBlockedData.success).toBe(false);
    expect(compStartBlockedData.error.code).toBe('ROUND_INACTIVE');
    expect(compStartBlockedData.error.message).toContain('disabled by the competition administrator');

    // 4. Verify public rounds-status endpoint shows Round 1 as inactive
    const statusRes1 = await app.request('/api/v1/quiz/rounds-status');
    expect(statusRes1.status).toBe(200);
    const statusData1 = (await statusRes1.json()) as any;
    expect(statusData1.round1.isActive).toBe(false);

    // 5. Admin re-enables Round 1
    const enableR1Res = await app.request('/api/v1/admin/rounds/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ round: 'round1', active: true }),
    });
    expect(enableR1Res.status).toBe(200);
    const enableR1Data = (await enableR1Res.json()) as any;
    expect(enableR1Data.success).toBe(true);
    expect(enableR1Data.active).toBe(true);

    // 6. Competitor can now attend/start Round 1!
    const compStartAllowed = await app.request('/api/v1/quiz/round-1/start', {
      method: 'POST',
      headers: { Cookie: compCookie },
    });
    expect(compStartAllowed.status).toBe(200);
    const compStartAllowedData = (await compStartAllowed.json()) as any;
    expect(compStartAllowedData.success).toBe(true);
    expect(compStartAllowedData.attempt).toBeDefined();

    // 7. Test Round 2: Admin disables Round 2
    const disableR2Res = await app.request('/api/v1/admin/rounds/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ round: 'round2', active: false }),
    });
    expect(disableR2Res.status).toBe(200);
    const disableR2Data = (await disableR2Res.json()) as any;
    expect(disableR2Data.active).toBe(false);

    // 8. Competitor tries to attend Round 2 -> MUST BE REJECTED with 403 ROUND_INACTIVE
    const compStartR2Blocked = await app.request('/api/v1/round2/start', {
      method: 'POST',
      headers: { Cookie: compCookie },
    });
    expect(compStartR2Blocked.status).toBe(403);
    const compStartR2BlockedData = (await compStartR2Blocked.json()) as any;
    expect(compStartR2BlockedData.success).toBe(false);
    expect(compStartR2BlockedData.error.code).toBe('ROUND_INACTIVE');

    // 9. Re-enable Round 2
    const enableR2Res = await app.request('/api/v1/admin/rounds/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ round: 'round2', active: true }),
    });
    expect(enableR2Res.status).toBe(200);

    // 10. Admin can start preview even if round were inactive
    await app.request('/api/v1/admin/rounds/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ round: 'round2', active: false }),
    });

    const adminStartRes = await app.request('/api/v1/round2/start', {
      method: 'POST',
      headers: { Cookie: adminCookie },
    });
    // Admin bypasses lock to preview examination
    expect(adminStartRes.status).toBe(200);

    // Restore Round 2 to active
    await app.request('/api/v1/admin/rounds/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ round: 'round2', active: true }),
    });
  });
});
