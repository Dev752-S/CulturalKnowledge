import { getDatabase } from '../../db/client';
import { events, users, participants } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import rawQuestions from './quiz_questions_100.json';
import rawRound2Questions from './round2_questions_50.json';
import { memoryAttempts } from '../routes/quiz';
import { memorySessions } from '../middleware/auth';

// -------------------------------------------------------------
// EVENT MODELS & IN-MEMORY STORE
// -------------------------------------------------------------
export interface AdminEventItem {
  id: string;
  name: string;
  round1DurationMinutes: number;
  round1TotalQuestions: number;
  round1IsActive: boolean;
  round2IsActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export let memoryEvents: AdminEventItem[] = [
  {
    id: 'evt-skp-2026-main',
    name: 'SKP Cultural Fest 2026 - Kala Sangamam Skill Arena',
    round1DurationMinutes: 10,
    round1TotalQuestions: 20,
    round1IsActive: true,
    round2IsActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function getEvents(): Promise<AdminEventItem[]> {
  const activeDb = getDatabase();
  if (activeDb) {
    try {
      const dbEvents = await activeDb.select().from(events).orderBy(desc(events.createdAt));
      if (dbEvents && dbEvents.length > 0) {
        return dbEvents.map((e: any) => ({
          id: e.id,
          name: e.name,
          round1DurationMinutes: e.round1DurationMinutes,
          round1TotalQuestions: e.round1TotalQuestions,
          round1IsActive: e.round1IsActive,
          round2IsActive: e.round2IsActive,
          createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: e.updatedAt ? new Date(e.updatedAt).toISOString() : new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('Database error while fetching events, falling back to memory store:', err);
    }
  }
  return memoryEvents;
}

export async function createEvent(data: {
  name: string;
  round1DurationMinutes?: number;
  round1TotalQuestions?: number;
  round1IsActive?: boolean;
  round2IsActive?: boolean;
}): Promise<AdminEventItem> {
  const activeDb = getDatabase();
  const newEvent: AdminEventItem = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: data.name,
    round1DurationMinutes: Number(data.round1DurationMinutes) || 60,
    round1TotalQuestions: Number(data.round1TotalQuestions) || 100,
    round1IsActive: data.round1IsActive !== undefined ? Boolean(data.round1IsActive) : true,
    round2IsActive: data.round2IsActive !== undefined ? Boolean(data.round2IsActive) : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (activeDb) {
    try {
      const [inserted] = await activeDb
        .insert(events)
        .values({
          name: newEvent.name,
          round1DurationMinutes: newEvent.round1DurationMinutes,
          round1TotalQuestions: newEvent.round1TotalQuestions,
          round1IsActive: newEvent.round1IsActive,
          round2IsActive: newEvent.round2IsActive,
        })
        .returning();
      if (inserted) {
        newEvent.id = inserted.id;
      }
    } catch (err) {
      console.warn('Database error inserting event, saving to memory store:', err);
    }
  }

  memoryEvents.unshift(newEvent);
  return newEvent;
}

export async function updateEvent(
  id: string,
  data: Partial<AdminEventItem>
): Promise<AdminEventItem | null> {
  const activeDb = getDatabase();
  let updatedItem: AdminEventItem | null = null;

  // Update in memory
  const idx = memoryEvents.findIndex((e) => e.id === id);
  if (idx !== -1) {
    memoryEvents[idx] = {
      ...memoryEvents[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    updatedItem = memoryEvents[idx];
  }

  if (activeDb) {
    try {
      const [res] = await activeDb
        .update(events)
        .set({
          ...(data.name ? { name: data.name } : {}),
          ...(data.round1DurationMinutes !== undefined ? { round1DurationMinutes: Number(data.round1DurationMinutes) } : {}),
          ...(data.round1TotalQuestions !== undefined ? { round1TotalQuestions: Number(data.round1TotalQuestions) } : {}),
          ...(data.round1IsActive !== undefined ? { round1IsActive: Boolean(data.round1IsActive) } : {}),
          ...(data.round2IsActive !== undefined ? { round2IsActive: Boolean(data.round2IsActive) } : {}),
          updatedAt: new Date(),
        })
        .where(eq(events.id, id))
        .returning();

      if (res) {
        updatedItem = {
          id: res.id,
          name: res.name,
          round1DurationMinutes: res.round1DurationMinutes,
          round1TotalQuestions: res.round1TotalQuestions,
          round1IsActive: res.round1IsActive,
          round2IsActive: res.round2IsActive,
          createdAt: res.createdAt ? new Date(res.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: res.updatedAt ? new Date(res.updatedAt).toISOString() : new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('Database error updating event:', err);
    }
  }

  return updatedItem;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const activeDb = getDatabase();
  const initialLen = memoryEvents.length;
  memoryEvents = memoryEvents.filter((e) => e.id !== id);

  if (activeDb) {
    try {
      await activeDb.delete(events).where(eq(events.id, id));
      return true;
    } catch (err) {
      console.warn('Database error deleting event:', err);
    }
  }

  return memoryEvents.length < initialLen;
}

// -------------------------------------------------------------
// QUIZ & QUESTIONS STORE (ROUND 1 & ROUND 2)
// -------------------------------------------------------------
export interface Round1QuestionItem {
  question_id: string;
  source_question_number: number;
  category: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string; // 'A' | 'B' | 'C' | 'D'
  correct_answer?: string;
  difficulty?: string;
  explanation?: string;
}

export interface Round2QuestionItem {
  questionId: string;
  questionNumber: number;
  questionText: string;
  correctLogoId: string;
  correctTileNumber?: number;
  correctBrandName?: string;
  options: Array<{
    optionId: string;
    logoId: string;
    tileNumber?: number;
    brandName?: string;
    category?: string;
    difficulty?: string;
    recommendedPoints?: number;
    svgUrl?: string;
    pngUrl?: string;
  }>;
}

// Mutable in-memory stores initialized from canonical manifests
export let currentRound1Questions: Round1QuestionItem[] = (rawQuestions as any[]).map((q, idx) => ({
  question_id: q.question_id || `Q${String(idx + 1).padStart(3, '0')}`,
  source_question_number: q.source_question_number || idx + 1,
  category: q.category || 'General Knowledge',
  question_text: q.question_text || '',
  option_a: q.option_a || '',
  option_b: q.option_b || '',
  option_c: q.option_c || '',
  option_d: q.option_d || '',
  correct_option: q.correct_option || 'A',
  correct_answer: q.correct_answer || '',
  difficulty: q.difficulty || 'Medium',
  explanation: q.explanation || '',
}));

export let currentRound2Questions: Round2QuestionItem[] = (rawRound2Questions as any[]).map((q, idx) => ({
  questionId: q.questionId || `R2Q${String(idx + 1).padStart(3, '0')}`,
  questionNumber: q.questionNumber || idx + 1,
  questionText: q.questionText || '',
  correctLogoId: q.correctLogoId || 'L001',
  correctTileNumber: q.correctTileNumber,
  correctBrandName: q.correctBrandName,
  options: q.options || [],
}));

export function getRound1Questions(filters?: {
  search?: string;
  category?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}) {
  let list = [...currentRound1Questions];

  if (filters?.category && filters.category !== 'all') {
    list = list.filter((q) => q.category.toLowerCase() === filters.category!.toLowerCase());
  }

  if (filters?.difficulty && filters.difficulty !== 'all') {
    list = list.filter((q) => (q.difficulty || 'Medium').toLowerCase() === filters.difficulty!.toLowerCase());
  }

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (q) =>
        q.question_text.toLowerCase().includes(s) ||
        q.category.toLowerCase().includes(s) ||
        q.option_a.toLowerCase().includes(s) ||
        q.option_b.toLowerCase().includes(s) ||
        q.option_c.toLowerCase().includes(s) ||
        q.option_d.toLowerCase().includes(s)
    );
  }

  const total = list.length;
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const startIndex = (page - 1) * limit;
  const items = list.slice(startIndex, startIndex + limit);

  // Extract all unique categories
  const categories = Array.from(new Set(currentRound1Questions.map((q) => q.category))).sort();

  return { items, total, page, limit, totalPages: Math.ceil(total / limit), categories };
}

export function addRound1Question(data: {
  question_text: string;
  category: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  difficulty?: string;
  explanation?: string;
}): Round1QuestionItem {
  const nextNum = currentRound1Questions.length > 0
    ? Math.max(...currentRound1Questions.map((q) => q.source_question_number)) + 1
    : 1;
  const nextId = `Q${String(nextNum).padStart(3, '0')}`;

  const correctLetter = (data.correct_option || 'A').toUpperCase();
  let correct_answer = data.option_a;
  if (correctLetter === 'B') correct_answer = data.option_b;
  else if (correctLetter === 'C') correct_answer = data.option_c;
  else if (correctLetter === 'D') correct_answer = data.option_d;

  const newQ: Round1QuestionItem = {
    question_id: nextId,
    source_question_number: nextNum,
    category: data.category || 'Cultural Knowledge',
    question_text: data.question_text,
    option_a: data.option_a,
    option_b: data.option_b,
    option_c: data.option_c,
    option_d: data.option_d,
    correct_option: correctLetter,
    correct_answer,
    difficulty: data.difficulty || 'Medium',
    explanation: data.explanation || '',
  };

  currentRound1Questions.push(newQ);
  return newQ;
}

export function updateRound1Question(
  id: string,
  data: Partial<Round1QuestionItem>
): Round1QuestionItem | null {
  const idx = currentRound1Questions.findIndex((q) => q.question_id === id);
  if (idx === -1) return null;

  const current = currentRound1Questions[idx];
  const updated: Round1QuestionItem = {
    ...current,
    ...data,
  };

  if (data.correct_option || data.option_a || data.option_b || data.option_c || data.option_d) {
    const correctLetter = (updated.correct_option || 'A').toUpperCase();
    if (correctLetter === 'A') updated.correct_answer = updated.option_a;
    else if (correctLetter === 'B') updated.correct_answer = updated.option_b;
    else if (correctLetter === 'C') updated.correct_answer = updated.option_c;
    else if (correctLetter === 'D') updated.correct_answer = updated.option_d;
  }

  currentRound1Questions[idx] = updated;
  return updated;
}

export function deleteRound1Question(id: string): boolean {
  const initialLen = currentRound1Questions.length;
  currentRound1Questions = currentRound1Questions.filter((q) => q.question_id !== id);
  return currentRound1Questions.length < initialLen;
}

// Round 2 Handlers
export function getRound2QuestionsList(filters?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  let list = [...currentRound2Questions];

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (q) =>
        q.questionText.toLowerCase().includes(s) ||
        (q.correctBrandName && q.correctBrandName.toLowerCase().includes(s))
    );
  }

  const total = list.length;
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const startIndex = (page - 1) * limit;
  const items = list.slice(startIndex, startIndex + limit);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export function addRound2Question(data: {
  questionText: string;
  correctBrandName: string;
  correctLogoId?: string;
  options: any[];
}): Round2QuestionItem {
  const nextNum = currentRound2Questions.length > 0
    ? Math.max(...currentRound2Questions.map((q) => q.questionNumber)) + 1
    : 1;
  const nextId = `R2Q${String(nextNum).padStart(3, '0')}`;

  const newQ: Round2QuestionItem = {
    questionId: nextId,
    questionNumber: nextNum,
    questionText: data.questionText,
    correctLogoId: data.correctLogoId || 'L001',
    correctBrandName: data.correctBrandName,
    options: data.options || [],
  };

  currentRound2Questions.push(newQ);
  return newQ;
}

export function updateRound2Question(
  id: string,
  data: Partial<Round2QuestionItem>
): Round2QuestionItem | null {
  const idx = currentRound2Questions.findIndex((q) => q.questionId === id);
  if (idx === -1) return null;

  currentRound2Questions[idx] = {
    ...currentRound2Questions[idx],
    ...data,
  };
  return currentRound2Questions[idx];
}

export function deleteRound2Question(id: string): boolean {
  const initialLen = currentRound2Questions.length;
  currentRound2Questions = currentRound2Questions.filter((q) => q.questionId !== id);
  return currentRound2Questions.length < initialLen;
}

// -------------------------------------------------------------
// MEMBERS / USERS MANAGEMENT
// -------------------------------------------------------------
export interface AdminMemberItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: 'participant' | 'proctor' | 'host' | 'admin' | 'super_admin';
  registrationNumber: string;
  collegeName: string;
  department: string;
  yearOfStudy: string;
  phone: string;
  teamName: string | null;
  isQualifiedForRound2: boolean;
  isActive: boolean;
  quizStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'DISQUALIFIED';
  quizScore?: number;
  accuracy?: string;
  createdAt: string;
}

export let memoryMembers: AdminMemberItem[] = [
  {
    id: 'mem-admin-01',
    userId: 'usr-admin-darkdev',
    fullName: 'Super Administrator',
    email: 'darkdev257@gmail.com',
    role: 'admin',
    registrationNumber: 'SKP-ADMIN-001',
    collegeName: 'SKP Engineering College',
    department: 'Platform Administration',
    yearOfStudy: 'Faculty/Admin',
    phone: '+91 99999 88888',
    teamName: 'Admin Core',
    isQualifiedForRound2: true,
    isActive: true,
    quizStatus: 'NOT_STARTED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mem-part-01',
    userId: 'usr-aarav-sharma',
    fullName: 'Aarav Sharma',
    email: 'aarav.sharma@skp.edu.in',
    role: 'participant',
    registrationNumber: 'SKP-100201',
    collegeName: 'SKP Engineering College',
    department: 'Computer Science & Engineering',
    yearOfStudy: 'III',
    phone: '+91 98401 23456',
    teamName: 'Quantum Coders',
    isQualifiedForRound2: true,
    isActive: true,
    quizStatus: 'SUBMITTED',
    quizScore: 84,
    accuracy: '84.00%',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'mem-part-02',
    userId: 'usr-priya-patel',
    fullName: 'Priya Patel',
    email: 'priya.patel@skp.edu.in',
    role: 'participant',
    registrationNumber: 'SKP-100202',
    collegeName: 'SKP Institute of Technology',
    department: 'Electronics & Communication',
    yearOfStudy: 'II',
    phone: '+91 98402 34567',
    teamName: 'Aroha Strikers',
    isQualifiedForRound2: true,
    isActive: true,
    quizStatus: 'SUBMITTED',
    quizScore: 78,
    accuracy: '78.00%',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'mem-part-03',
    userId: 'usr-karthik-raja',
    fullName: 'Karthik Raja',
    email: 'karthik.raja@skp.edu.in',
    role: 'participant',
    registrationNumber: 'SKP-100203',
    collegeName: 'SKP Engineering College',
    department: 'Information Technology',
    yearOfStudy: 'IV',
    phone: '+91 98403 45678',
    teamName: 'Cyber Titans',
    isQualifiedForRound2: false,
    isActive: true,
    quizStatus: 'SUBMITTED',
    quizScore: 62,
    accuracy: '62.00%',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'mem-part-04',
    userId: 'usr-deepa-n',
    fullName: 'Deepa Natarajan',
    email: 'deepa.n@skp.edu.in',
    role: 'participant',
    registrationNumber: 'SKP-100204',
    collegeName: 'SKP Engineering College',
    department: 'Artificial Intelligence & Data Science',
    yearOfStudy: 'III',
    phone: '+91 98404 56789',
    teamName: 'AI Innovators',
    isQualifiedForRound2: true,
    isActive: true,
    quizStatus: 'SUBMITTED',
    quizScore: 91,
    accuracy: '91.00%',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'mem-part-05',
    userId: 'usr-rahul-verma',
    fullName: 'Rahul Verma',
    email: 'rahul.v@skp.edu.in',
    role: 'participant',
    registrationNumber: 'SKP-100205',
    collegeName: 'SKP Polytechnic College',
    department: 'Mechanical Engineering',
    yearOfStudy: 'II',
    phone: '+91 98405 67890',
    teamName: 'Tech Mavericks',
    isQualifiedForRound2: false,
    isActive: true,
    quizStatus: 'IN_PROGRESS',
    quizScore: 0,
    accuracy: '0.00%',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export async function getMembers(filters?: {
  search?: string;
  role?: string;
  qualified?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: AdminMemberItem[]; total: number; page: number; limit: number; totalPages: number }> {
  // Sync any active sessions that logged in during this server lifecycle
  for (const s of memorySessions.values()) {
    if (s.email && !memoryMembers.some((m) => m.email.toLowerCase() === s.email.toLowerCase())) {
      memoryMembers.push({
        id: `mem-${s.userId}`,
        userId: s.userId,
        fullName: s.fullName,
        email: s.email,
        role: s.role as any,
        registrationNumber: `SKP-${Math.floor(100000 + Math.random() * 900000)}`,
        collegeName: 'SKP Engineering College',
        department: 'Engineering',
        yearOfStudy: 'III',
        phone: '+91 90000 00000',
        teamName: s.teamName || null,
        isQualifiedForRound2: false,
        isActive: true,
        quizStatus: 'NOT_STARTED',
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Sync quiz attempts
  for (const [pId, attempt] of memoryAttempts.entries()) {
    const mem = memoryMembers.find((m) => m.userId === pId || m.id === pId);
    if (mem) {
      mem.quizStatus = attempt.isSubmitted ? 'SUBMITTED' : 'IN_PROGRESS';
      mem.quizScore = attempt.score;
      mem.accuracy = attempt.accuracyPercentage;
    }
  }

  let list = [...memoryMembers];

  if (filters?.role && filters.role !== 'all') {
    list = list.filter((m) => m.role === filters.role);
  }

  if (filters?.qualified && filters.qualified !== 'all') {
    const isQ = filters.qualified === 'true' || filters.qualified === 'yes';
    list = list.filter((m) => m.isQualifiedForRound2 === isQ);
  }

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (m) =>
        m.fullName.toLowerCase().includes(s) ||
        m.email.toLowerCase().includes(s) ||
        (m.teamName && m.teamName.toLowerCase().includes(s)) ||
        m.registrationNumber.toLowerCase().includes(s) ||
        m.collegeName.toLowerCase().includes(s)
    );
  }

  const total = list.length;
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const startIndex = (page - 1) * limit;
  const items = list.slice(startIndex, startIndex + limit);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function addMember(data: {
  fullName: string;
  email: string;
  role: 'participant' | 'proctor' | 'host' | 'admin' | 'super_admin';
  registrationNumber?: string;
  collegeName?: string;
  department?: string;
  yearOfStudy?: string;
  phone?: string;
  teamName?: string;
  isQualifiedForRound2?: boolean;
}): Promise<AdminMemberItem> {
  const activeDb = getDatabase();
  const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const regNum = data.registrationNumber || `SKP-${Math.floor(100000 + Math.random() * 900000)}`;

  const newMember: AdminMemberItem = {
    id: `mem-${Date.now()}`,
    userId,
    fullName: data.fullName,
    email: data.email,
    role: data.role || 'participant',
    registrationNumber: regNum,
    collegeName: data.collegeName || 'SKP Engineering College',
    department: data.department || 'Computer Science & Engineering',
    yearOfStudy: data.yearOfStudy || 'III',
    phone: data.phone || '+91 98765 43210',
    teamName: data.teamName || null,
    isQualifiedForRound2: Boolean(data.isQualifiedForRound2),
    isActive: true,
    quizStatus: 'NOT_STARTED',
    createdAt: new Date().toISOString(),
  };

  if (activeDb) {
    try {
      const [u] = await activeDb
        .insert(users)
        .values({
          email: newMember.email,
          username: newMember.email.split('@')[0] + '_' + Math.floor(Math.random() * 1000),
          fullName: newMember.fullName,
          passwordHash: 'admin_provisioned',
          role: newMember.role,
        })
        .returning();

      if (u) {
        newMember.userId = u.id;
        if (newMember.role === 'participant') {
          const [p] = await activeDb
            .insert(participants)
            .values({
              userId: u.id,
              registrationNumber: newMember.registrationNumber,
              collegeName: newMember.collegeName,
              department: newMember.department,
              yearOfStudy: newMember.yearOfStudy,
              phone: newMember.phone,
              teamName: newMember.teamName,
              isQualifiedForRound2: newMember.isQualifiedForRound2,
            })
            .returning();
          if (p) newMember.id = p.id;
        }
      }
    } catch (err) {
      console.warn('Database error creating member:', err);
    }
  }

  memoryMembers.unshift(newMember);
  return newMember;
}

export async function updateMember(
  id: string,
  data: Partial<AdminMemberItem>
): Promise<AdminMemberItem | null> {
  const activeDb = getDatabase();
  const idx = memoryMembers.findIndex((m) => m.id === id || m.userId === id);
  if (idx === -1) return null;

  memoryMembers[idx] = {
    ...memoryMembers[idx],
    ...data,
  };

  const updated = memoryMembers[idx];

  if (activeDb) {
    try {
      await activeDb
        .update(users)
        .set({
          ...(data.fullName ? { fullName: data.fullName } : {}),
          ...(data.email ? { email: data.email } : {}),
          ...(data.role ? { role: data.role } : {}),
          ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, updated.userId));

      if (updated.role === 'participant') {
        await activeDb
          .update(participants)
          .set({
            ...(data.teamName !== undefined ? { teamName: data.teamName } : {}),
            ...(data.collegeName ? { collegeName: data.collegeName } : {}),
            ...(data.department ? { department: data.department } : {}),
            ...(data.yearOfStudy ? { yearOfStudy: data.yearOfStudy } : {}),
            ...(data.phone ? { phone: data.phone } : {}),
            ...(data.isQualifiedForRound2 !== undefined
              ? { isQualifiedForRound2: Boolean(data.isQualifiedForRound2) }
              : {}),
            updatedAt: new Date(),
          })
          .where(eq(participants.userId, updated.userId));
      }
    } catch (err) {
      console.warn('Database error updating member:', err);
    }
  }

  return updated;
}

export async function deleteMember(id: string): Promise<boolean> {
  const activeDb = getDatabase();
  const member = memoryMembers.find((m) => m.id === id || m.userId === id);
  if (!member) return false;

  memoryMembers = memoryMembers.filter((m) => m.id !== id && m.userId !== id);
  memoryAttempts.delete(member.userId);
  memoryAttempts.delete(member.id);

  if (activeDb) {
    try {
      await activeDb.delete(users).where(eq(users.id, member.userId));
      return true;
    } catch (err) {
      console.warn('Database error deleting member:', err);
    }
  }

  return true;
}

export function resetMemberAttempt(userIdOrMemberId: string): boolean {
  const member = memoryMembers.find((m) => m.id === userIdOrMemberId || m.userId === userIdOrMemberId);
  if (!member) return false;

  memoryAttempts.delete(member.userId);
  memoryAttempts.delete(member.id);
  member.quizStatus = 'NOT_STARTED';
  member.quizScore = undefined;
  member.accuracy = undefined;
  return true;
}

// -------------------------------------------------------------
// OVERVIEW STATS
// -------------------------------------------------------------
export async function getAdminStats() {
  const evts = await getEvents();
  const activeEventsCount = evts.filter((e) => e.round1IsActive || e.round2IsActive).length;

  const totalMembers = memoryMembers.length;
  const qualifiedForR2 = memoryMembers.filter((m) => m.isQualifiedForRound2).length;
  const submittedAttempts = memoryMembers.filter((m) => m.quizStatus === 'SUBMITTED').length;
  const inProgressAttempts = memoryMembers.filter((m) => m.quizStatus === 'IN_PROGRESS').length;

  return {
    events: {
      total: evts.length,
      active: activeEventsCount,
      primaryEvent: evts[0] || null,
    },
    quizzes: {
      round1TotalQuestions: currentRound1Questions.length,
      round2TotalQuestions: currentRound2Questions.length,
      round1CategoriesCount: new Set(currentRound1Questions.map((q) => q.category)).size,
    },
    members: {
      total: totalMembers,
      participants: memoryMembers.filter((m) => m.role === 'participant').length,
      admins: memoryMembers.filter((m) => m.role === 'admin' || m.role === 'super_admin').length,
      qualifiedForRound2: qualifiedForR2,
    },
    activity: {
      submittedAttempts,
      inProgressAttempts,
      totalAttempts: submittedAttempts + inProgressAttempts,
    },
    serverTime: new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// ROUND ACTIVATION GUARDS & PUBLIC STATUS
// -------------------------------------------------------------
export async function isRoundActive(round: 'round1' | 'round2'): Promise<boolean> {
  const evts = await getEvents();
  if (evts.length === 0) return true;
  const primary = evts[0];
  return round === 'round1' ? primary.round1IsActive : primary.round2IsActive;
}

export async function setRoundActive(round: 'round1' | 'round2', active: boolean): Promise<AdminEventItem | null> {
  const evts = await getEvents();
  if (evts.length === 0) {
    const newEvt = await createEvent({
      name: 'SKP Cultural Fest 2026 - Kala Sangamam Skill Arena',
      round1IsActive: round === 'round1' ? active : true,
      round2IsActive: round === 'round2' ? active : true,
    });
    return newEvt;
  }
  const primary = evts[0];
  const updateData = round === 'round1' ? { round1IsActive: active } : { round2IsActive: active };
  return updateEvent(primary.id, updateData);
}

// -------------------------------------------------------------
// ROUND 2 CUSTOM TIMER SETTINGS (CARD FLIP + OVERALL DURATION)
// -------------------------------------------------------------
export interface Round2Config {
  cardFlipDurationSeconds: number; // default: 5
  overallDurationMinutes: number;  // default: 30
}

export let round2Config: Round2Config = {
  cardFlipDurationSeconds: 2,
  overallDurationMinutes: 25,
};

export function getRound2Config(): Round2Config {
  return round2Config;
}

export function updateRound2Config(data: Partial<Round2Config>): Round2Config {
  if (data.cardFlipDurationSeconds !== undefined) {
    round2Config.cardFlipDurationSeconds = Math.max(1, Math.min(60, Number(data.cardFlipDurationSeconds) || 5));
  }
  if (data.overallDurationMinutes !== undefined) {
    round2Config.overallDurationMinutes = Math.max(1, Math.min(180, Number(data.overallDurationMinutes) || 30));
  }
  return round2Config;
}

// -------------------------------------------------------------
// TEAM MARKS MANAGEMENT & ADJUSTMENTS
// -------------------------------------------------------------
export interface TeamMarkAdjustment {
  teamName: string;
  round1Adjustment: number;
  round2Adjustment: number;
  updatedAt: string;
}

export const teamMarkAdjustments = new Map<string, TeamMarkAdjustment>();

export function getTeamMarkAdjustments(): TeamMarkAdjustment[] {
  return Array.from(teamMarkAdjustments.values());
}

export function adjustTeamMarks(teamName: string, round: 'round1' | 'round2', delta: number): TeamMarkAdjustment {
  const cleanName = (teamName || 'Unknown Team').trim();
  const existing = teamMarkAdjustments.get(cleanName) || {
    teamName: cleanName,
    round1Adjustment: 0,
    round2Adjustment: 0,
    updatedAt: new Date().toISOString(),
  };

  if (round === 'round1') {
    existing.round1Adjustment += delta;
  } else {
    existing.round2Adjustment += delta;
  }
  existing.updatedAt = new Date().toISOString();
  teamMarkAdjustments.set(cleanName, existing);
  return existing;
}

// -------------------------------------------------------------
// ACTIVE PARTICIPANT REMOVAL
// -------------------------------------------------------------
export function removeActiveParticipant(idOrUserIdOrEmail: string): boolean {
  // 1. Terminate matching active sessions
  for (const [sId, sess] of memorySessions.entries()) {
    if (
      sess.userId === idOrUserIdOrEmail ||
      sess.email.toLowerCase() === idOrUserIdOrEmail.toLowerCase()
    ) {
      memorySessions.delete(sId);
    }
  }

  // 2. Mark Round 1 attempt as eliminated / disqualified
  for (const [pId, attempt] of memoryAttempts.entries()) {
    if (pId === idOrUserIdOrEmail) {
      attempt.isSubmitted = true;
      attempt.isDisqualified = true;
      attempt.disqualificationReason = 'Removed by Competition Administrator';
    }
  }

  // 3. Mark member record as removed/inactive
  const mem = memoryMembers.find(
    (m) =>
      m.id === idOrUserIdOrEmail ||
      m.userId === idOrUserIdOrEmail ||
      m.email.toLowerCase() === idOrUserIdOrEmail.toLowerCase()
  );
  if (mem) {
    mem.isActive = false;
    mem.quizStatus = 'SUBMITTED';
  }

  return true;
}

export async function getRoundsStatus() {
  const evts = await getEvents();
  const primary = evts[0] || {
    id: 'default',
    name: 'SKP Cultural Fest 2026 - Kala Sangamam Skill Arena',
    round1DurationMinutes: 60,
    round1TotalQuestions: 100,
    round1IsActive: true,
    round2IsActive: true,
  };

  return {
    eventId: primary.id,
    eventName: primary.name,
    round1: {
      name: 'Round 1 Cultural Quiz',
      isActive: Boolean(primary.round1IsActive),
      durationMinutes: primary.round1DurationMinutes || 60,
      totalQuestions: primary.round1TotalQuestions || 100,
    },
    round2: {
      name: 'Round 2 Logo Quiz',
      isActive: Boolean(primary.round2IsActive),
      totalQuestions: 50,
      cardFlipDurationSeconds: round2Config.cardFlipDurationSeconds,
      durationMinutes: round2Config.overallDurationMinutes,
    },
  };
}


