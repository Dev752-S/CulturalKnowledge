import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
  Users,
  HelpCircle,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Search,
  LogOut,
  ExternalLink,
  RotateCcw,
  Sliders,
  Clock,
  Trophy,
  Award,
  UserX,
} from 'lucide-react';

// Types
interface AdminStats {
  events: { total: number; active: number; primaryEvent: any };
  quizzes: { round1TotalQuestions: number; round2TotalQuestions: number; round1CategoriesCount: number };
  members: { total: number; participants: number; admins: number; qualifiedForRound2: number };
  activity: { submittedAttempts: number; inProgressAttempts: number; totalAttempts: number };
  serverTime: string;
}

interface EventItem {
  id: string;
  name: string;
  round1DurationMinutes: number;
  round1TotalQuestions: number;
  round1IsActive: boolean;
  round2IsActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface QuestionItem {
  question_id: string;
  source_question_number: number;
  category: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  difficulty?: string;
  explanation?: string;
}

interface MemberItem {
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

export interface TeamMarkItem {
  teamName: string;
  participantNames: string[];
  round1BaseScore: number;
  round1Adjustment: number;
  round1TotalScore: number;
  round2BaseScore: number;
  round2Adjustment: number;
  round2TotalScore: number;
  overallTotalScore: number;
}

export interface ActiveParticipantItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  teamName: string | null;
  round1Status: string;
  round1Score: number;
  round2Status: string;
  round2Answered: number;
  isDisqualified: boolean;
  lastActive: string;
}

export interface Round2Config {
  cardFlipDurationSeconds: number;
  overallDurationMinutes: number;
}

type TabType =
  | 'events'
  | 'team-marks'
  | 'active-participants'
  | 'leaderboards'
  | 'quiz'
  | 'members'
  | 'quick-actions';

export default function AdminPage() {
  // Auth State
  const [isAdminAuth, setIsAdminAuth] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<{ email: string; fullName: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('darkdev257@gmail.com');
  const [loginPasskey, setLoginPasskey] = useState('dev7.$25#@%9');
  const [showPasskey, setShowPasskey] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('events');

  // Stats State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // -------------------------------------------------------------
  // EVENTS STATE & HANDLERS
  // -------------------------------------------------------------
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [eventForm, setEventForm] = useState({
    name: '',
    round1DurationMinutes: 60,
    round1TotalQuestions: 100,
    round1IsActive: true,
    round2IsActive: true,
  });

  // -------------------------------------------------------------
  // QUIZ QUESTIONS STATE & HANDLERS
  // -------------------------------------------------------------
  const [questionsList, setQuestionsList] = useState<QuestionItem[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    category: 'INDIAN TRADITIONAL CULTURE',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    difficulty: 'Medium',
    explanation: '',
  });

  // -------------------------------------------------------------
  // MEMBERS STATE & HANDLERS
  // -------------------------------------------------------------
  const [membersList, setMembersList] = useState<MemberItem[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');
  const [memberQualifiedFilter, setMemberQualifiedFilter] = useState('all');
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberItem | null>(null);
  const [memberForm, setMemberForm] = useState({
    fullName: '',
    email: '',
    role: 'participant' as 'participant' | 'proctor' | 'host' | 'admin',
    registrationNumber: '',
    collegeName: 'SKP Engineering College',
    department: 'Computer Science & Engineering',
    yearOfStudy: 'III',
    phone: '+91 98765 43210',
    teamName: '',
    isQualifiedForRound2: false,
  });

  // -------------------------------------------------------------
  // ROUND 2 TIMER CONFIG STATE
  // -------------------------------------------------------------
  const [round2Config, setRound2Config] = useState<Round2Config>({
    cardFlipDurationSeconds: 5,
    overallDurationMinutes: 30,
  });
  const [flipDurationInput, setFlipDurationInput] = useState<number>(5);
  const [overallDurationInput, setOverallDurationInput] = useState<number>(30);
  const [r2ConfigLoading, setR2ConfigLoading] = useState(false);

  // -------------------------------------------------------------
  // TEAM MARKS MANAGEMENT STATE
  // -------------------------------------------------------------
  const [teamMarksList, setTeamMarksList] = useState<TeamMarkItem[]>([]);
  const [teamMarksLoading, setTeamMarksLoading] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [customDeltaInput, setCustomDeltaInput] = useState<Record<string, number>>({});

  // -------------------------------------------------------------
  // ACTIVE PARTICIPANTS MANAGEMENT STATE
  // -------------------------------------------------------------
  const [activeParticipantsList, setActiveParticipantsList] = useState<ActiveParticipantItem[]>([]);
  const [activeParticipantsLoading, setActiveParticipantsLoading] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');

  // -------------------------------------------------------------
  // 3 LEADERBOARDS STATE
  // -------------------------------------------------------------
  const [leaderboardTab, setLeaderboardTab] = useState<'overall' | 'round1' | 'round2'>('overall');
  const [adminRound1Leaderboard, setAdminRound1Leaderboard] = useState<any[]>([]);
  const [adminRound2Leaderboard, setAdminRound2Leaderboard] = useState<any[]>([]);
  const [adminOverallLeaderboard, setAdminOverallLeaderboard] = useState<any[]>([]);
  const [leaderboardsLoading, setLeaderboardsLoading] = useState(false);

  // -------------------------------------------------------------
  // CHECK AUTH ON MOUNT
  // -------------------------------------------------------------
  const checkAdminAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user && (data.user.role === 'admin' || data.user.role === 'super_admin')) {
          setIsAdminAuth(true);
          setAdminUser(data.user);
          return true;
        }
      }
    } catch {
      // not logged in
    }
    setIsAdminAuth(false);
    return false;
  }, []);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  // -------------------------------------------------------------
  // DATA FETCHING
  // -------------------------------------------------------------
  const fetchStats = useCallback(async () => {
    if (!isAdminAuth) return;
    setStatsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [isAdminAuth]);

  const fetchEvents = useCallback(async () => {
    if (!isAdminAuth) return;
    setEventsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/events');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setEventsList(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setEventsLoading(false);
    }
  }, [isAdminAuth]);

  const fetchQuestions = useCallback(async () => {
    if (!isAdminAuth) return;
    setQuestionsLoading(true);
    try {
      const params = new URLSearchParams();
      if (questionSearch.trim()) params.set('search', questionSearch.trim());
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedDifficulty !== 'all') params.set('difficulty', selectedDifficulty);
      params.set('limit', '100');

      const res = await fetch(`/api/v1/admin/questions/round-1?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setQuestionsList(data.items || []);
          if (data.categories) setCategories(data.categories);
        }
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setQuestionsLoading(false);
    }
  }, [isAdminAuth, questionSearch, selectedCategory, selectedDifficulty]);

  const fetchMembers = useCallback(async () => {
    if (!isAdminAuth) return;
    setMembersLoading(true);
    try {
      const params = new URLSearchParams();
      if (memberSearch.trim()) params.set('search', memberSearch.trim());
      if (memberRoleFilter !== 'all') params.set('role', memberRoleFilter);
      if (memberQualifiedFilter !== 'all') params.set('qualified', memberQualifiedFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/v1/admin/members?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setMembersList(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setMembersLoading(false);
    }
  }, [isAdminAuth, memberSearch, memberRoleFilter, memberQualifiedFilter]);

  // -------------------------------------------------------------
  // AUTH ACTIONS
  // -------------------------------------------------------------
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/v1/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), passkey: loginPasskey.trim() }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setIsAdminAuth(true);
        setAdminUser(data.user);
        showToast('Administrative authorization granted. Welcome back!');
      } else {
        setAuthError(data.error?.message || 'Invalid admin credentials or passkey.');
      }
    } catch (err: any) {
      setAuthError('Connection error. Please ensure the backend server is running.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/v1/admin/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setIsAdminAuth(false);
    setAdminUser(null);
    showToast('Admin logged out successfully.');
  };

  const handleQuickFill = () => {
    setLoginEmail('darkdev257@gmail.com');
    setLoginPasskey('dev7.$25#@%9');
  };

  // -------------------------------------------------------------
  // EVENT CRUD ACTIONS
  // -------------------------------------------------------------
  const openCreateEventModal = () => {
    setEditingEvent(null);
    setEventForm({
      name: '',
      round1DurationMinutes: 60,
      round1TotalQuestions: 100,
      round1IsActive: true,
      round2IsActive: true,
    });
    setEventModalOpen(true);
  };

  const openEditEventModal = (event: EventItem) => {
    setEditingEvent(event);
    setEventForm({
      name: event.name,
      round1DurationMinutes: event.round1DurationMinutes,
      round1TotalQuestions: event.round1TotalQuestions,
      round1IsActive: event.round1IsActive,
      round2IsActive: event.round2IsActive,
    });
    setEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.name.trim()) {
      showToast('Event name is required', 'error');
      return;
    }

    try {
      if (editingEvent) {
        // Update / Alter
        const res = await fetch(`/api/v1/admin/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventForm),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Event "${eventForm.name}" updated successfully.`);
          setEventModalOpen(false);
          fetchEvents();
          fetchStats();
        } else {
          showToast(data.error?.message || 'Failed to update event', 'error');
        }
      } else {
        // Create / Add
        const res = await fetch('/api/v1/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventForm),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`New event "${eventForm.name}" created successfully.`);
          setEventModalOpen(false);
          fetchEvents();
          fetchStats();
        } else {
          showToast(data.error?.message || 'Failed to create event', 'error');
        }
      }
    } catch {
      showToast('Network error while saving event', 'error');
    }
  };

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!window.confirm(`Are you sure you want to delete event "${eventName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/events/${eventId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Event "${eventName}" deleted successfully.`);
        fetchEvents();
        fetchStats();
      } else {
        showToast(data.error?.message || 'Failed to delete event', 'error');
      }
    } catch {
      showToast('Network error while deleting event', 'error');
    }
  };

  const handleToggleEventRound = async (eventId: string, round: 'round1' | 'round2', currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/admin/events/${eventId}/toggle-round`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round, active: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Round status updated.');
        fetchEvents();
        fetchStats();
      } else {
        showToast(data.error?.message || 'Failed to toggle round', 'error');
      }
    } catch {
      showToast('Network error while toggling round status', 'error');
    }
  };

  const handleToggleRoundGlobal = async (round: 'round1' | 'round2', currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      const res = await fetch('/api/v1/admin/rounds/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round, active: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          data.message ||
            `${round === 'round1' ? 'Round 1' : 'Round 2'} is now ${newStatus ? 'ENABLED' : 'DISABLED'} for competitors!`
        );
        fetchEvents();
        fetchStats();
      } else {
        showToast(data.error?.message || 'Failed to toggle round', 'error');
      }
    } catch {
      showToast('Network error while updating round status', 'error');
    }
  };

  // -------------------------------------------------------------
  // ROUND 2 TIMER CONFIG ACTIONS
  // -------------------------------------------------------------
  const fetchRound2Config = useCallback(async () => {
    try {
      setR2ConfigLoading(true);
      const res = await fetch('/api/v1/admin/round2-config');
      const data = await res.json();
      if (data.success && data.config) {
        setRound2Config(data.config);
        setFlipDurationInput(data.config.cardFlipDurationSeconds || 5);
        setOverallDurationInput(data.config.overallDurationMinutes || 30);
      }
    } catch (err) {
      console.error('Failed to fetch Round 2 config:', err);
    } finally {
      setR2ConfigLoading(false);
    }
  }, []);

  const handleUpdateRound2Timer = async (cardFlipSeconds: number, overallMinutes: number) => {
    try {
      setR2ConfigLoading(true);
      const res = await fetch('/api/v1/admin/round2-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardFlipDurationSeconds: cardFlipSeconds,
          overallDurationMinutes: overallMinutes,
        }),
      });
      const data = await res.json();
      if (data.success && data.config) {
        setRound2Config(data.config);
        setFlipDurationInput(data.config.cardFlipDurationSeconds);
        setOverallDurationInput(data.config.overallDurationMinutes);
        showToast(data.message || 'Round 2 timers updated successfully!');
      } else {
        showToast(data.error?.message || 'Failed to update Round 2 timers', 'error');
      }
    } catch {
      showToast('Network error while saving Round 2 timers', 'error');
    } finally {
      setR2ConfigLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TEAM MARKS MANAGEMENT ACTIONS
  // -------------------------------------------------------------
  const fetchTeamMarks = useCallback(async () => {
    try {
      setTeamMarksLoading(true);
      const res = await fetch('/api/v1/admin/team-marks');
      const data = await res.json();
      if (data.success && Array.isArray(data.teams)) {
        setTeamMarksList(data.teams);
      }
    } catch (err) {
      console.error('Failed to fetch team marks:', err);
    } finally {
      setTeamMarksLoading(false);
    }
  }, []);

  const handleAdjustMarks = async (teamName: string, round: 'round1' | 'round2', delta: number) => {
    try {
      const res = await fetch('/api/v1/admin/team-marks/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, round, delta }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Marks updated for ${teamName}!`);
        fetchTeamMarks();
        fetchAdminLeaderboards();
      } else {
        showToast(data.error?.message || 'Failed to adjust team marks', 'error');
      }
    } catch {
      showToast('Network error adjusting team marks', 'error');
    }
  };

  // -------------------------------------------------------------
  // ACTIVE PARTICIPANTS MANAGEMENT ACTIONS
  // -------------------------------------------------------------
  const fetchActiveParticipants = useCallback(async () => {
    try {
      setActiveParticipantsLoading(true);
      const res = await fetch('/api/v1/admin/active-participants');
      const data = await res.json();
      if (data.success && Array.isArray(data.participants)) {
        setActiveParticipantsList(data.participants);
      }
    } catch (err) {
      console.error('Failed to fetch active participants:', err);
    } finally {
      setActiveParticipantsLoading(false);
    }
  }, []);

  const handleRemoveActiveParticipant = async (participantId: string, participantName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove and disqualify ${participantName}? This will immediately kick them from the arena.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/participants/${participantId}/remove`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `${participantName} was removed from active competition.`);
        fetchActiveParticipants();
        fetchTeamMarks();
        fetchStats();
      } else {
        showToast(data.error?.message || 'Failed to remove active participant', 'error');
      }
    } catch {
      showToast('Network error removing active participant', 'error');
    }
  };

  // -------------------------------------------------------------
  // 3 LEADERBOARDS ACTIONS
  // -------------------------------------------------------------
  const fetchAdminLeaderboards = useCallback(async () => {
    try {
      setLeaderboardsLoading(true);
      const res = await fetch('/api/v1/leaderboard/all');
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.round1)) setAdminRound1Leaderboard(data.round1);
        if (Array.isArray(data.round2)) setAdminRound2Leaderboard(data.round2);
        if (Array.isArray(data.overall)) setAdminOverallLeaderboard(data.overall);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboards:', err);
    } finally {
      setLeaderboardsLoading(false);
    }
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (isAdminAuth) {
      fetchStats();
      fetchEvents();
      fetchQuestions();
      fetchMembers();
      fetchRound2Config();
      fetchTeamMarks();
      fetchActiveParticipants();
      fetchAdminLeaderboards();
    }
  }, [
    isAdminAuth,
    fetchStats,
    fetchEvents,
    fetchQuestions,
    fetchMembers,
    fetchRound2Config,
    fetchTeamMarks,
    fetchActiveParticipants,
    fetchAdminLeaderboards,
  ]);

  // -------------------------------------------------------------
  // QUESTION CRUD ACTIONS
  // -------------------------------------------------------------
  const openCreateQuestionModal = () => {
    setEditingQuestion(null);
    setQuestionForm({
      question_text: '',
      category: categories[0] || 'INDIAN TRADITIONAL CULTURE',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'A',
      difficulty: 'Medium',
      explanation: '',
    });
    setQuestionModalOpen(true);
  };

  const openEditQuestionModal = (q: QuestionItem) => {
    setEditingQuestion(q);
    setQuestionForm({
      question_text: q.question_text,
      category: q.category,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      difficulty: q.difficulty || 'Medium',
      explanation: q.explanation || '',
    });
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.question_text.trim()) {
      showToast('Question text is required', 'error');
      return;
    }
    if (!questionForm.option_a.trim() || !questionForm.option_b.trim()) {
      showToast('Option A and Option B are required', 'error');
      return;
    }

    try {
      if (editingQuestion) {
        // Alter
        const res = await fetch(`/api/v1/admin/questions/round-1/${editingQuestion.question_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionForm),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Question ${editingQuestion.question_id} updated.`);
          setQuestionModalOpen(false);
          fetchQuestions();
          fetchStats();
        } else {
          showToast(data.error?.message || 'Failed to update question', 'error');
        }
      } else {
        // Add
        const res = await fetch('/api/v1/admin/questions/round-1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionForm),
        });
        const data = await res.json();
        if (data.success) {
          showToast('New question added to Round 1.');
          setQuestionModalOpen(false);
          fetchQuestions();
          fetchStats();
        } else {
          showToast(data.error?.message || 'Failed to add question', 'error');
        }
      }
    } catch {
      showToast('Network error while saving question', 'error');
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm(`Delete question ${qId}?`)) return;

    try {
      const res = await fetch(`/api/v1/admin/questions/round-1/${qId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Question ${qId} deleted.`);
        fetchQuestions();
        fetchStats();
      } else {
        showToast(data.error?.message || 'Failed to delete question', 'error');
      }
    } catch {
      showToast('Network error while deleting question', 'error');
    }
  };

  // -------------------------------------------------------------
  // MEMBER CRUD ACTIONS
  // -------------------------------------------------------------
  const openCreateMemberModal = () => {
    setEditingMember(null);
    setMemberForm({
      fullName: '',
      email: '',
      role: 'participant',
      registrationNumber: `SKP-${Math.floor(100000 + Math.random() * 900000)}`,
      collegeName: 'SKP Engineering College',
      department: 'Computer Science & Engineering',
      yearOfStudy: 'III',
      phone: '+91 98765 43210',
      teamName: '',
      isQualifiedForRound2: false,
    });
    setMemberModalOpen(true);
  };

  const openEditMemberModal = (member: MemberItem) => {
    setEditingMember(member);
    setMemberForm({
      fullName: member.fullName,
      email: member.email,
      role: member.role as any,
      registrationNumber: member.registrationNumber,
      collegeName: member.collegeName,
      department: member.department,
      yearOfStudy: member.yearOfStudy,
      phone: member.phone,
      teamName: member.teamName || '',
      isQualifiedForRound2: member.isQualifiedForRound2,
    });
    setMemberModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.fullName.trim() || !memberForm.email.trim()) {
      showToast('Full name and email are required', 'error');
      return;
    }

    try {
      if (editingMember) {
        // Alter
        const res = await fetch(`/api/v1/admin/members/${editingMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memberForm),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Member "${memberForm.fullName}" updated successfully.`);
          setMemberModalOpen(false);
          fetchMembers();
          fetchStats();
        } else {
          showToast(data.error?.message || 'Failed to update member', 'error');
        }
      } else {
        // Add
        const res = await fetch('/api/v1/admin/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memberForm),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Member "${memberForm.fullName}" registered.`);
          setMemberModalOpen(false);
          fetchMembers();
          fetchStats();
        } else {
          showToast(data.error?.message || 'Failed to create member', 'error');
        }
      }
    } catch {
      showToast('Network error while saving member', 'error');
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove member "${memberName}"? All participant records will be purged.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/members/${memberId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Member "${memberName}" removed.`);
        fetchMembers();
        fetchStats();
      } else {
        showToast(data.error?.message || 'Failed to delete member', 'error');
      }
    } catch {
      showToast('Network error while deleting member', 'error');
    }
  };

  const handleToggleQualification = async (member: MemberItem) => {
    const newStatus = !member.isQualifiedForRound2;
    try {
      const res = await fetch(`/api/v1/admin/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isQualifiedForRound2: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          `${member.fullName} is now ${newStatus ? 'QUALIFIED' : 'UNQUALIFIED'} for Round 2.`
        );
        fetchMembers();
        fetchStats();
      } else {
        showToast('Failed to update qualification status', 'error');
      }
    } catch {
      showToast('Network error while updating qualification', 'error');
    }
  };

  const handleResetAttempt = async (member: MemberItem) => {
    if (!window.confirm(`Reset quiz attempt for "${member.fullName}"? This allows them to retake Round 1.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/members/${member.id}/reset-attempt`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Quiz attempt reset for ${member.fullName}.`);
        fetchMembers();
        fetchStats();
      } else {
        showToast(data.error?.message || 'Failed to reset attempt', 'error');
      }
    } catch {
      showToast('Network error while resetting attempt', 'error');
    }
  };

  // -------------------------------------------------------------
  // VIEW: AUTHENTICATION GATE (IF NOT LOGGED IN AS ADMIN)
  // -------------------------------------------------------------
  if (isAdminAuth === false) {
    return (
      <div className="admin-white-theme min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between relative overflow-hidden select-none font-sans">
        {/* Ambient Light Gradient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Minimal Bar */}
        <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-wider uppercase text-amber-400">SKP Skill Arena</span>
              <span className="text-xs text-slate-400 ml-2">Command Center</span>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors py-1.5 px-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </header>

        {/* Center Admin Login Portal Card */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Master Admin Portal</h1>
              <p className="text-xs text-slate-400 mt-1">Authoritative Web &amp; Event Control Room</p>
            </div>

            {authError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Admin Identifier / ID
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="darkdev257@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm text-white placeholder-slate-500 transition-all outline-none"
                  />
                  <Shield className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Admin Passkey
                </label>
                <div className="relative">
                  <input
                    type={showPasskey ? 'text' : 'password'}
                    required
                    value={loginPasskey}
                    onChange={(e) => setLoginPasskey(e.target.value)}
                    placeholder="Enter admin passkey"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm text-white placeholder-slate-500 transition-all outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasskey(!showPasskey)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Fill Button */}
              <button
                type="button"
                onClick={handleQuickFill}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Fill Admin Credentials (darkdev257)</span>
              </button>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-sm tracking-wide uppercase transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Verifying Passkey...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Authorize &amp; Enter Console</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <span className="text-[11px] text-slate-500 flex items-center justify-center space-x-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Authoritative Role Enforcement · 256-bit Verified Session</span>
              </span>
            </div>
          </div>
        </main>

        <footer className="relative z-10 py-3 text-center text-xs text-slate-600 border-t border-slate-900 bg-slate-950/80">
          SKP Cultural Fest 2026 · Built for Master Administrators
        </footer>
      </div>
    );
  }

  const filteredTeams = teamMarksList.filter(
    (t) =>
      t.teamName.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.participantNames.some((p) => p.toLowerCase().includes(teamSearch.toLowerCase()))
  );

  const filteredParticipants = activeParticipantsList.filter(
    (p) =>
      p.fullName.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(participantSearch.toLowerCase()) ||
      (p.teamName && p.teamName.toLowerCase().includes(participantSearch.toLowerCase()))
  );

  // Loading State
  if (isAdminAuth === null) {
    return (
      <div className="admin-white-theme min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping" />
          <span className="text-sm font-medium tracking-wider uppercase text-amber-400">
            Checking Master Admin Credentials...
          </span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: MAIN ADMIN DASHBOARD CONSOLE (LOGGED IN)
  // -------------------------------------------------------------
  return (
    <div className="admin-white-theme min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans select-none">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium flex items-center space-x-2 backdrop-blur-xl animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-white tracking-wide">Admin Control Room</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Active</span>
              </span>
            </div>
            <span className="text-xs text-slate-400">SKP Cultural Fest 2026 · Master Web Console</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Admin Identity Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-300 font-medium">{adminUser?.email || 'darkdev257@gmail.com'}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold">
              SUPER ADMIN
            </span>
          </div>

          <button
            onClick={() => {
              fetchStats();
              fetchEvents();
              fetchQuestions();
              fetchMembers();
              showToast('Data refreshed.');
            }}
            title="Refresh All Data"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/"
            className="hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleAdminLogout}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6">
        {/* KPI Metric Cards Banner */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Events KPI */}
          <div className="rounded-2xl p-5 bg-slate-900/70 border border-slate-800/90 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Events &amp; Rounds</span>
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {stats?.events.total || eventsList.length || 1}
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-emerald-400 font-medium">
                {eventsList.some((e) => e.round1IsActive) ? 'R1 Active' : 'R1 Inactive'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-medium">
                {eventsList.some((e) => e.round2IsActive) ? 'R2 Active' : 'R2 Inactive'}
              </span>
            </div>
          </div>

          {/* 2. Round 1 Questions KPI */}
          <div className="rounded-2xl p-5 bg-slate-900/70 border border-slate-800/90 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Round 1 Questions</span>
              <HelpCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {stats?.quizzes.round1TotalQuestions || questionsList.length || 100}
            </div>
            <div className="text-xs text-slate-400">
              {stats?.quizzes.round1CategoriesCount || 5} Categories Loaded
            </div>
          </div>

          {/* 3. Round 2 Logo Bank KPI */}
          <div className="rounded-2xl p-5 bg-slate-900/70 border border-slate-800/90 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Round 2 Logo Bank</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {stats?.quizzes.round2TotalQuestions || 50}
            </div>
            <div className="text-xs text-slate-400">Visual Logo MCQ Arena</div>
          </div>

          {/* 4. Registered Members KPI */}
          <div className="rounded-2xl p-5 bg-slate-900/70 border border-slate-800/90 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Members &amp; Contenders</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {stats?.members.total || membersList.length || 6}
            </div>
            <div className="text-xs text-emerald-400 font-medium">
              {stats?.members.qualifiedForRound2 || membersList.filter((m) => m.isQualifiedForRound2).length} Qualified for R2
            </div>
          </div>
        </section>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'events'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Events &amp; Rounds</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-950/20 text-[10px]">
              {eventsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('team-marks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'team-marks'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Team Marks Control</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-950/20 text-[10px]">
              {teamMarksList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('active-participants')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'active-participants'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <UserX className="w-4 h-4" />
            <span>Active Participants</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-950/20 text-[10px]">
              {activeParticipantsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'leaderboards'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>3 Leaderboards</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Quiz Questions</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-950/20 text-[10px]">
              {questionsList.length || 100}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'members'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members &amp; Contenders</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-950/20 text-[10px]">
              {membersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('quick-actions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'quick-actions'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>System Master Controls</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: EVENTS MANAGEMENT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* COMPETITOR ROUND ACTIVATION SWITCHBOARD */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">Competitor Round Access Switchboard</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        LIVE ENFORCEMENT
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enable or disable rounds here. <strong>Only rounds in the ENABLED state can be attended or started by competitors.</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Round 1 Controller */}
                <div
                  className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                    eventsList.some((e) => e.round1IsActive)
                      ? 'bg-emerald-950/25 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Round 1 Examination
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 ${
                          eventsList.some((e) => e.round1IsActive)
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            eventsList.some((e) => e.round1IsActive) ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                          }`}
                        />
                        <span>
                          {eventsList.some((e) => e.round1IsActive) ? 'ENABLED (OPEN)' : 'DISABLED (LOCKED)'}
                        </span>
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white">Cultural Quiz (100 MCQ)</h4>
                    <p className="text-xs text-slate-400">
                      60 Minutes timer · 100 Questions · Anti-cheat Proctored
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">
                      Competitors:{' '}
                      <strong
                        className={
                          eventsList.some((e) => e.round1IsActive) ? 'text-emerald-400' : 'text-rose-400'
                        }
                      >
                        {eventsList.some((e) => e.round1IsActive) ? 'Can Attend & Start Quiz' : 'Locked Out'}
                      </strong>
                    </span>

                    <button
                      onClick={() =>
                        handleToggleRoundGlobal('round1', eventsList.some((e) => e.round1IsActive))
                      }
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md cursor-pointer ${
                        eventsList.some((e) => e.round1IsActive)
                          ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/25'
                      }`}
                    >
                      {eventsList.some((e) => e.round1IsActive) ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Lock Round 1</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Enable Round 1</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Round 2 Controller */}
                <div
                  className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                    eventsList.some((e) => e.round2IsActive)
                      ? 'bg-amber-950/25 border-amber-500/40 shadow-lg shadow-amber-950/20'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Round 2 Arena
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 ${
                          eventsList.some((e) => e.round2IsActive)
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            eventsList.some((e) => e.round2IsActive) ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'
                          }`}
                        />
                        <span>
                          {eventsList.some((e) => e.round2IsActive) ? 'ENABLED (OPEN)' : 'DISABLED (LOCKED)'}
                        </span>
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white">Flip-Card Logo Identification Game (50 Qs)</h4>
                    <p className="text-xs text-slate-400">
                      Card Flip {round2Config.cardFlipDurationSeconds}s · Overall Duration {round2Config.overallDurationMinutes}m · Zero-Tolerance Anomaly Security
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">
                      Competitors:{' '}
                      <strong
                        className={
                          eventsList.some((e) => e.round2IsActive) ? 'text-amber-400' : 'text-rose-400'
                        }
                      >
                        {eventsList.some((e) => e.round2IsActive) ? 'Can Attend & Start Quiz' : 'Locked Out'}
                      </strong>
                    </span>

                    <button
                      onClick={() =>
                        handleToggleRoundGlobal('round2', eventsList.some((e) => e.round2IsActive))
                      }
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md cursor-pointer ${
                        eventsList.some((e) => e.round2IsActive)
                          ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25'
                      }`}
                    >
                      {eventsList.some((e) => e.round2IsActive) ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Lock Round 2</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Enable Round 2</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ROUND 2 CUSTOM TIMER ADJUSTER */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">Round 2 Flip-Card Arena Custom Timers</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        TIME ADJUSTER
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure the card flip exposure duration (default: 5 seconds) and the overall Round 2 countdown duration (default: 30 minutes).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchRound2Config}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Timers</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Card Flip Duration */}
                <div className="rounded-2xl p-5 bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Card Flip Duration
                      </span>
                      <h4 className="text-sm font-semibold text-white mt-0.5">Time Card Remains Face-Up</h4>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-base font-bold">
                      {round2Config.cardFlipDurationSeconds}s
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={flipDurationInput}
                      onChange={(e) => setFlipDurationInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">seconds per card</span>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-500 self-center">Presets:</span>
                    {[3, 5, 7, 10].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          setFlipDurationInput(sec);
                          handleUpdateRound2Timer(sec, round2Config.overallDurationMinutes);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          round2Config.cardFlipDurationSeconds === sec
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateRound2Timer(flipDurationInput, round2Config.overallDurationMinutes)}
                    disabled={r2ConfigLoading}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {r2ConfigLoading ? 'Saving...' : 'Apply Flip Duration'}
                  </button>
                </div>

                {/* 2. Overall Round 2 Duration */}
                <div className="rounded-2xl p-5 bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Overall Arena Timer
                      </span>
                      <h4 className="text-sm font-semibold text-white mt-0.5">Round 2 Total Exam Duration</h4>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-base font-bold">
                      {round2Config.overallDurationMinutes}m
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={overallDurationInput}
                      onChange={(e) => setOverallDurationInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">minutes total</span>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-500 self-center">Presets:</span>
                    {[15, 20, 30, 45, 60].map((min) => (
                      <button
                        key={min}
                        type="button"
                        onClick={() => {
                          setOverallDurationInput(min);
                          handleUpdateRound2Timer(round2Config.cardFlipDurationSeconds, min);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          round2Config.overallDurationMinutes === min
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {min}m
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateRound2Timer(round2Config.cardFlipDurationSeconds, overallDurationInput)}
                    disabled={r2ConfigLoading}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {r2ConfigLoading ? 'Saving...' : 'Apply Overall Duration'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Competition Events Management</h2>
                <p className="text-xs text-slate-400">
                  Add, alter, delete events and control Round 1 and Round 2 live access
                </p>
              </div>
              <button
                onClick={openCreateEventModal}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Event</span>
              </button>
            </div>

            {/* Events List Cards */}
            {eventsLoading ? (
              <div className="flex items-center justify-center p-12 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-500" />
                <span>Loading events...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {eventsList.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-white">{event.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {event.id}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                        <span className="flex items-center space-x-1 text-slate-400">
                          <span>Duration:</span>
                          <strong className="text-white">{event.round1DurationMinutes} Mins</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1 text-slate-400">
                          <span>Questions:</span>
                          <strong className="text-white">{event.round1TotalQuestions}</strong>
                        </span>
                        <span>•</span>
                        <span className="text-slate-500 text-[11px]">
                          Updated: {new Date(event.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Quick Round Status Badges & Toggles */}
                      <div className="flex items-center space-x-3 pt-1">
                        <button
                          onClick={() => handleToggleEventRound(event.id, 'round1', event.round1IsActive)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                            event.round1IsActive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${event.round1IsActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}
                          />
                          <span>Round 1: {event.round1IsActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        </button>

                        <button
                          onClick={() => handleToggleEventRound(event.id, 'round2', event.round2IsActive)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                            event.round2IsActive
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${event.round2IsActive ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`}
                          />
                          <span>Round 2: {event.round2IsActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Event Action Buttons */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => openEditEventModal(event)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Alter Event</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id, event.name)}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: QUIZ QUESTIONS MANAGEMENT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Quiz Question Bank</h2>
                <p className="text-xs text-slate-400">
                  Search, add, edit, or delete questions. Correct answers are visible only to Admins.
                </p>
              </div>
              <button
                onClick={openCreateQuestionModal}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search question text or options..."
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="all">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Questions Table */}
            {questionsLoading ? (
              <div className="flex items-center justify-center p-12 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-500" />
                <span>Loading question bank...</span>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Q# / ID</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 min-w-[280px]">Question Text</th>
                        <th className="py-3 px-4 min-w-[200px]">Options &amp; Correct Answer</th>
                        <th className="py-3 px-4">Difficulty</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {questionsList.map((q) => (
                        <tr key={q.question_id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                            #{q.source_question_number} <span className="text-[10px] text-slate-500 font-normal">({q.question_id})</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              {q.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-200 leading-relaxed">
                            {q.question_text}
                          </td>
                          <td className="py-3.5 px-4 space-y-1">
                            <div
                              className={`px-2 py-0.5 rounded text-[11px] flex items-center space-x-1 ${
                                q.correct_option === 'A'
                                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                                  : 'text-slate-400'
                              }`}
                            >
                              <span>A: {q.option_a}</span>
                              {q.correct_option === 'A' && <Check className="w-3 h-3 text-emerald-400 shrink-0 ml-auto" />}
                            </div>
                            <div
                              className={`px-2 py-0.5 rounded text-[11px] flex items-center space-x-1 ${
                                q.correct_option === 'B'
                                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                                  : 'text-slate-400'
                              }`}
                            >
                              <span>B: {q.option_b}</span>
                              {q.correct_option === 'B' && <Check className="w-3 h-3 text-emerald-400 shrink-0 ml-auto" />}
                            </div>
                            {q.option_c && (
                              <div
                                className={`px-2 py-0.5 rounded text-[11px] flex items-center space-x-1 ${
                                  q.correct_option === 'C'
                                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                                    : 'text-slate-400'
                                }`}
                              >
                                <span>C: {q.option_c}</span>
                                {q.correct_option === 'C' && <Check className="w-3 h-3 text-emerald-400 shrink-0 ml-auto" />}
                              </div>
                            )}
                            {q.option_d && (
                              <div
                                className={`px-2 py-0.5 rounded text-[11px] flex items-center space-x-1 ${
                                  q.correct_option === 'D'
                                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                                    : 'text-slate-400'
                                }`}
                              >
                                <span>D: {q.option_d}</span>
                                {q.correct_option === 'D' && <Check className="w-3 h-3 text-emerald-400 shrink-0 ml-auto" />}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                q.difficulty === 'Easy'
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : q.difficulty === 'Hard'
                                  ? 'text-rose-400 bg-rose-500/10'
                                  : 'text-amber-400 bg-amber-500/10'
                              }`}
                            >
                              {q.difficulty || 'Medium'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => openEditQuestionModal(q)}
                                title="Alter Question"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q.question_id)}
                                title="Delete Question"
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: MEMBERS & PARTICIPANTS MANAGEMENT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Registered Members &amp; Contenders</h2>
                <p className="text-xs text-slate-400">
                  Manage participants, alter roles, toggle Round 2 qualification, and reset quiz attempts
                </p>
              </div>
              <button
                onClick={openCreateMemberModal}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, email, reg number, or team..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto">
                <select
                  value={memberRoleFilter}
                  onChange={(e) => setMemberRoleFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="all">All Roles</option>
                  <option value="participant">Participants</option>
                  <option value="admin">Administrators</option>
                  <option value="proctor">Proctors</option>
                  <option value="host">Hosts</option>
                </select>

                <select
                  value={memberQualifiedFilter}
                  onChange={(e) => setMemberQualifiedFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="all">All Qualification</option>
                  <option value="true">Qualified for R2</option>
                  <option value="false">Not Qualified</option>
                </select>
              </div>
            </div>

            {/* Members Table */}
            {membersLoading ? (
              <div className="flex items-center justify-center p-12 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-500" />
                <span>Loading members and contenders...</span>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Member Name &amp; Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Registration # / College</th>
                        <th className="py-3 px-4">Team</th>
                        <th className="py-3 px-4">Quiz Status &amp; Score</th>
                        <th className="py-3 px-4">Round 2 Qualification</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {membersList.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">{m.fullName}</div>
                            <div className="text-slate-400 text-xs">{m.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                m.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : m.role === 'proctor'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              }`}
                            >
                              {m.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-slate-200">{m.registrationNumber}</div>
                            <div className="text-[11px] text-slate-500">{m.collegeName}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            {m.teamName ? (
                              <span className="font-medium text-amber-300">{m.teamName}</span>
                            ) : (
                              <span className="text-slate-500 italic">No Team</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  m.quizStatus === 'SUBMITTED'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : m.quizStatus === 'IN_PROGRESS'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {m.quizStatus}
                              </span>
                              {m.quizScore !== undefined && (
                                <span className="font-bold text-white font-mono">{m.quizScore}/100</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleQualification(m)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                                m.isQualifiedForRound2
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${m.isQualifiedForRound2 ? 'bg-emerald-400' : 'bg-slate-500'}`}
                              />
                              <span>{m.isQualifiedForRound2 ? 'QUALIFIED' : 'NOT QUALIFIED'}</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => handleResetAttempt(m)}
                                title="Reset Quiz Attempt"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditMemberModal(m)}
                                title="Alter Member"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(m.id, m.fullName)}
                                title="Delete Member"
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: TEAM MARKS MANAGEMENT & ADJUSTMENTS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'team-marks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Team Marks Control &amp; Adjustments</h2>
                <p className="text-xs text-slate-400">
                  Add and remove marks for each and every team across Round 1 (Cultural) and Round 2 (Logos).
                </p>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by team name..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-amber-500 focus:outline-none placeholder-slate-500"
                  />
                </div>
                <button
                  onClick={fetchTeamMarks}
                  disabled={teamMarksLoading}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50"
                  title="Refresh Team Marks"
                >
                  <RefreshCw className={`w-4 h-4 ${teamMarksLoading ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            {teamMarksLoading ? (
              <div className="flex items-center justify-center p-12 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-500" />
                <span>Loading team marks...</span>
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800">
                <Award className="w-10 h-10 text-amber-500/40 mx-auto mb-2" />
                <p className="text-sm">No teams found matching search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                      <th className="py-3 px-4">Team &amp; Contestants</th>
                      <th className="py-3 px-4 text-center">Round 1 (Cultural)</th>
                      <th className="py-3 px-4 text-center">Round 1 Marks Control</th>
                      <th className="py-3 px-4 text-center">Round 2 (Logos)</th>
                      <th className="py-3 px-4 text-center">Round 2 Marks Control</th>
                      <th className="py-3 px-4 text-right">Overall Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredTeams.map((t) => {
                      const deltaKeyR1 = `${t.teamName}_r1`;
                      const deltaKeyR2 = `${t.teamName}_r2`;

                      return (
                        <tr key={t.teamName} className="hover:bg-slate-800/30 transition-colors">
                          {/* Team Name */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-amber-400 text-sm">{t.teamName}</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              {t.participantNames.length > 0
                                ? t.participantNames.join(', ')
                                : 'Active Contenders'}
                            </div>
                          </td>

                          {/* Round 1 Score Info */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="font-mono text-white font-bold text-sm">
                              {t.round1TotalScore}{' '}
                              <span className="text-[10px] text-slate-500 font-normal">/ 100</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Base: {t.round1BaseScore} · Adj:{' '}
                              <span
                                className={
                                  t.round1Adjustment > 0
                                    ? 'text-emerald-400 font-bold'
                                    : t.round1Adjustment < 0
                                    ? 'text-rose-400 font-bold'
                                    : 'text-slate-500'
                                }
                              >
                                {t.round1Adjustment > 0 ? `+${t.round1Adjustment}` : t.round1Adjustment}
                              </span>
                            </div>
                          </td>

                          {/* Round 1 Adjuster Controls */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center space-x-1 mb-1.5">
                              <button
                                type="button"
                                onClick={() => handleAdjustMarks(t.teamName, 'round1', 1)}
                                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/40 cursor-pointer"
                                title="Add 1 mark"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustMarks(t.teamName, 'round1', 5)}
                                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/40 cursor-pointer"
                                title="Add 5 marks"
                              >
                                +5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustMarks(t.teamName, 'round1', -1)}
                                className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] border border-rose-500/40 cursor-pointer"
                                title="Remove 1 mark"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustMarks(t.teamName, 'round1', -5)}
                                className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] border border-rose-500/40 cursor-pointer"
                                title="Remove 5 marks"
                              >
                                -5
                              </button>
                            </div>
                            <div className="flex items-center justify-center space-x-1">
                              <input
                                type="number"
                                placeholder="±"
                                value={customDeltaInput[deltaKeyR1] ?? ''}
                                onChange={(e) =>
                                  setCustomDeltaInput((prev) => ({
                                    ...prev,
                                    [deltaKeyR1]: parseInt(e.target.value) || 0,
                                  }))
                                }
                                className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-white font-mono text-[11px] text-center"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const delta = customDeltaInput[deltaKeyR1] || 0;
                                  if (delta !== 0) handleAdjustMarks(t.teamName, 'round1', delta);
                                }}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-semibold cursor-pointer border border-slate-700"
                              >
                                Apply
                              </button>
                            </div>
                          </td>

                          {/* Round 2 Score Info */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="font-mono text-white font-bold text-sm">
                              {t.round2TotalScore}{' '}
                              <span className="text-[10px] text-slate-500 font-normal">/ 50</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Base: {t.round2BaseScore} · Adj:{' '}
                              <span
                                className={
                                  t.round2Adjustment > 0
                                    ? 'text-emerald-400 font-bold'
                                    : t.round2Adjustment < 0
                                    ? 'text-rose-400 font-bold'
                                    : 'text-slate-500'
                                }
                              >
                                {t.round2Adjustment > 0 ? `+${t.round2Adjustment}` : t.round2Adjustment}
                              </span>
                            </div>
                          </td>

                          {/* Round 2 Adjuster Controls */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center space-x-1 mb-1.5">
                              <button
                                type="button"
                                onClick={() => handleAdjustMarks(t.teamName, 'round2', 1)}
                                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/40 cursor-pointer"
                                title="Add 1 mark"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustMarks(t.teamName, 'round2', 5)}
                                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/40 cursor-pointer"
                                title="Add 5 marks"
                              >
                                +5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustMarks(t.teamName, 'round2', -1)}
                                className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] border border-rose-500/40 cursor-pointer"
                                title="Remove 1 mark"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustMarks(t.teamName, 'round2', -5)}
                                className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] border border-rose-500/40 cursor-pointer"
                                title="Remove 5 marks"
                              >
                                -5
                              </button>
                            </div>
                            <div className="flex items-center justify-center space-x-1">
                              <input
                                type="number"
                                placeholder="±"
                                value={customDeltaInput[deltaKeyR2] ?? ''}
                                onChange={(e) =>
                                  setCustomDeltaInput((prev) => ({
                                    ...prev,
                                    [deltaKeyR2]: parseInt(e.target.value) || 0,
                                  }))
                                }
                                className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-white font-mono text-[11px] text-center"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const delta = customDeltaInput[deltaKeyR2] || 0;
                                  if (delta !== 0) handleAdjustMarks(t.teamName, 'round2', delta);
                                }}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-semibold cursor-pointer border border-slate-700"
                              >
                                Apply
                              </button>
                            </div>
                          </td>

                          {/* Overall Total Score */}
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-mono text-base font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
                              {t.overallTotalScore}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: ACTIVE PARTICIPANTS MANAGEMENT & REMOVAL */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'active-participants' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Active Participants &amp; Live Elimination Control</h2>
                <p className="text-xs text-slate-400">
                  Inspect currently active contenders and permanently remove/disqualify non-compliant participants.
                </p>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search participant, email or team..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-amber-500 focus:outline-none placeholder-slate-500"
                  />
                </div>
                <button
                  onClick={fetchActiveParticipants}
                  disabled={activeParticipantsLoading}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50"
                  title="Refresh Active Participants"
                >
                  <RefreshCw className={`w-4 h-4 ${activeParticipantsLoading ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            {activeParticipantsLoading ? (
              <div className="flex items-center justify-center p-12 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-500" />
                <span>Loading active participants...</span>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800">
                <UserX className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm">No active participants currently logged into the arena.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                      <th className="py-3 px-4">Participant Details</th>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-4 text-center">Round 1 Status</th>
                      <th className="py-3 px-4 text-center">Round 2 Status</th>
                      <th className="py-3 px-4 text-center">Security Integrity</th>
                      <th className="py-3 px-4 text-right">Emergency Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        {/* Name and Email */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{p.fullName}</div>
                          <div className="text-slate-400 text-xs font-mono">{p.email}</div>
                        </td>

                        {/* Team */}
                        <td className="py-3.5 px-4">
                          {p.teamName ? (
                            <span className="font-semibold text-amber-300">{p.teamName}</span>
                          ) : (
                            <span className="text-slate-500 italic">No Team</span>
                          )}
                        </td>

                        {/* Round 1 Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.round1Status === 'SUBMITTED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : p.round1Status === 'IN_PROGRESS'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                : p.round1Status === 'ELIMINATED'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {p.round1Status} ({p.round1Score}/100)
                          </span>
                        </td>

                        {/* Round 2 Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.round2Status === 'SUBMITTED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : p.round2Status === 'IN_PROGRESS'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                : p.round2Status === 'ELIMINATED'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {p.round2Status} ({p.round2Answered}/50)
                          </span>
                        </td>

                        {/* Security Integrity */}
                        <td className="py-3.5 px-4 text-center">
                          {p.isDisqualified ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              <span>DISQUALIFIED</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>CLEAN RECORD</span>
                            </span>
                          )}
                        </td>

                        {/* Action: Remove Active Participant */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveActiveParticipant(p.id, p.fullName)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Participant</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: 3 LEADERBOARDS DASHBOARD */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'leaderboards' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Competition 3-Tier Leaderboards</h2>
                <p className="text-xs text-slate-400">
                  Real-time authoritative scores for Round 1 (Cultural Quiz), Round 2 (Logo Quiz), and Overall Dashboard.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchAdminLeaderboards}
                  disabled={leaderboardsLoading}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${leaderboardsLoading ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Refresh Standings</span>
                </button>
              </div>
            </div>

            {/* Sub-Tabs: Overall, Round 1, Round 2 */}
            <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
              <button
                type="button"
                onClick={() => setLeaderboardTab('overall')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
                  leaderboardTab === 'overall'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Overall Dashboard (R1 + R2)</span>
              </button>

              <button
                type="button"
                onClick={() => setLeaderboardTab('round1')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
                  leaderboardTab === 'round1'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Round 1 Leaderboard</span>
              </button>

              <button
                type="button"
                onClick={() => setLeaderboardTab('round2')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
                  leaderboardTab === 'round2'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Round 2 Leaderboard</span>
              </button>
            </div>

            {/* Tables for each subtab */}
            {leaderboardsLoading ? (
              <div className="flex items-center justify-center p-12 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-500" />
                <span>Loading official rankings...</span>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
                {leaderboardTab === 'overall' && (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Team &amp; Contestant</th>
                        <th className="py-3 px-4 text-center">Round 1 Score</th>
                        <th className="py-3 px-4 text-center">Round 2 Score</th>
                        <th className="py-3 px-4 text-right">Combined Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {adminOverallLeaderboard.map((item) => (
                        <tr key={item.teamName} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">#{item.rank}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">{item.teamName}</div>
                            <div className="text-slate-400 text-xs">{item.participantName}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-200">
                            {item.round1Score} / 100
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-amber-400">
                            {item.round2Score} / 50
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-mono text-base font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
                              {item.totalScore}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {leaderboardTab === 'round1' && (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Team &amp; Contestant</th>
                        <th className="py-3 px-4 text-center">Accuracy</th>
                        <th className="py-3 px-4 text-right">Round 1 Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {adminRound1Leaderboard.map((item) => (
                        <tr key={item.participantId} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">#{item.rank}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">{item.teamName}</div>
                            <div className="text-slate-400 text-xs">{item.participantName}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-emerald-400">
                            {item.accuracyPercentage}%
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                            {item.score} / 100
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {leaderboardTab === 'round2' && (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Team &amp; Contestant</th>
                        <th className="py-3 px-4 text-center">Answered</th>
                        <th className="py-3 px-4 text-center">Correct Logos</th>
                        <th className="py-3 px-4 text-right">Round 2 Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {adminRound2Leaderboard.map((item) => (
                        <tr key={item.participantId} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">#{item.rank}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">{item.teamName}</div>
                            <div className="text-slate-400 text-xs">{item.participantName}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                            {item.answeredCount} / 50
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-emerald-400">
                            {item.correctCount} correct
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400 text-sm">
                            {item.score} / 50
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: QUICK SYSTEM ACTIONS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'quick-actions' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-lg font-bold text-white">System Master Controls &amp; Real-Time Overrides</h2>
              <p className="text-xs text-slate-400">
                Instant controls for examination locks, emergency toggles, and live diagnostics
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Round 1 Global Switch</h3>
                    <p className="text-xs text-slate-400">Turn Round 1 Cultural Exam ON or OFF</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-300">
                    Competitor Access:{' '}
                    <strong className={eventsList.some((e) => e.round1IsActive) ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {eventsList.some((e) => e.round1IsActive) ? 'ENABLED (OPEN)' : 'DISABLED (LOCKED)'}
                    </strong>
                  </span>
                  <button
                    onClick={() =>
                      handleToggleRoundGlobal('round1', eventsList.some((e) => e.round1IsActive))
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      eventsList.some((e) => e.round1IsActive)
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                        : 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400'
                    }`}
                  >
                    {eventsList.some((e) => e.round1IsActive) ? 'Deactivate Round 1' : 'Activate Round 1'}
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Round 2 Global Switch</h3>
                    <p className="text-xs text-slate-400">Turn Round 2 Logo Quiz ON or OFF</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-300">
                    Competitor Access:{' '}
                    <strong className={eventsList.some((e) => e.round2IsActive) ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
                      {eventsList.some((e) => e.round2IsActive) ? 'ENABLED (OPEN)' : 'DISABLED (LOCKED)'}
                    </strong>
                  </span>
                  <button
                    onClick={() =>
                      handleToggleRoundGlobal('round2', eventsList.some((e) => e.round2IsActive))
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      eventsList.some((e) => e.round2IsActive)
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                        : 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400'
                    }`}
                  >
                    {eventsList.some((e) => e.round2IsActive) ? 'Deactivate Round 2' : 'Activate Round 2'}
                  </button>
                </div>
              </div>
            </div>

            {/* Diagnostic Card */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Live Platform Environment Status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Super Admin ID</span>
                  <span className="font-mono text-amber-400 font-bold">darkdev257@gmail.com</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Session Security</span>
                  <span className="text-emerald-400 font-medium">HttpOnly · Lax Cookie</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Server Clock</span>
                  <span className="font-mono text-slate-300">{stats?.serverTime ? new Date(stats.serverTime).toLocaleTimeString() : 'Live'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-500 block mb-1">Total Submissions</span>
                  <span className="font-bold text-white font-mono">{stats?.activity.submittedAttempts || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: ADD / ALTER EVENT */}
      {/* ------------------------------------------------------------- */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingEvent ? 'Alter Event' : 'Add New Event'}
              </h3>
              <button
                onClick={() => setEventModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Name</label>
                <input
                  type="text"
                  required
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  placeholder="e.g. SKP Cultural Fest 2026 - Skill Arena"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={eventForm.round1DurationMinutes}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, round1DurationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Questions</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={eventForm.round1TotalQuestions}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, round1TotalQuestions: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventForm.round1IsActive}
                    onChange={(e) => setEventForm({ ...eventForm, round1IsActive: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-950 border-slate-700"
                  />
                  <span>Round 1 Active</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventForm.round2IsActive}
                    onChange={(e) => setEventForm({ ...eventForm, round2IsActive: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-950 border-slate-700"
                  />
                  <span>Round 2 Active</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: ADD / ALTER QUESTION */}
      {/* ------------------------------------------------------------- */}
      {questionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingQuestion ? `Alter Question (${editingQuestion.question_id})` : 'Add New Question'}
              </h3>
              <button
                onClick={() => setQuestionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Question Text</label>
                <textarea
                  required
                  rows={3}
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  placeholder="Enter the question text..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={questionForm.category}
                    onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                    placeholder="e.g. INDIAN TRADITIONAL CULTURE"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={questionForm.difficulty}
                    onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* 4 Options */}
              <div className="space-y-2 pt-2">
                <span className="block text-xs font-semibold text-slate-300 mb-1">
                  Options (Select radio for Correct Answer)
                </span>

                {(['A', 'B', 'C', 'D'] as const).map((key) => {
                  const formKey = `option_${key.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c' | 'option_d';
                  const isCorrect = questionForm.correct_option === key;

                  return (
                    <div
                      key={key}
                      className={`flex items-center space-x-2.5 p-2 rounded-xl border transition-all ${
                        isCorrect
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'border-slate-800 bg-slate-950'
                      }`}
                    >
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={isCorrect}
                          onChange={() => setQuestionForm({ ...questionForm, correct_option: key })}
                          className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className={`text-xs font-bold ${isCorrect ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {key}
                        </span>
                      </label>
                      <input
                        type="text"
                        required={key === 'A' || key === 'B'}
                        value={questionForm[formKey]}
                        onChange={(e) => setQuestionForm({ ...questionForm, [formKey]: e.target.value })}
                        placeholder={`Option ${key} text`}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-transparent border-0 text-xs text-white outline-none focus:ring-0"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuestionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {editingQuestion ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: ADD / ALTER MEMBER */}
      {/* ------------------------------------------------------------- */}
      {memberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingMember ? `Alter Member (${editingMember.fullName})` : 'Add New Member'}
              </h3>
              <button
                onClick={() => setMemberModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={memberForm.fullName}
                  onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    placeholder="student@skp.edu.in"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                  <select
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="participant">Participant</option>
                    <option value="admin">Administrator</option>
                    <option value="proctor">Proctor</option>
                    <option value="host">Host</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Team Name</label>
                  <input
                    type="text"
                    value={memberForm.teamName}
                    onChange={(e) => setMemberForm({ ...memberForm, teamName: e.target.value })}
                    placeholder="e.g. Quantum Coders"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">College</label>
                  <input
                    type="text"
                    value={memberForm.collegeName}
                    onChange={(e) => setMemberForm({ ...memberForm, collegeName: e.target.value })}
                    placeholder="SKP Engineering College"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={memberForm.department}
                    onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
                    placeholder="CSE / ECE / IT"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Year of Study</label>
                  <input
                    type="text"
                    value={memberForm.yearOfStudy}
                    onChange={(e) => setMemberForm({ ...memberForm, yearOfStudy: e.target.value })}
                    placeholder="I / II / III / IV"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={memberForm.isQualifiedForRound2}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, isQualifiedForRound2: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                  />
                  <span>Qualified for Round 2 (Auditorium Finalist)</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {editingMember ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
