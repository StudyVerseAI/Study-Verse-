
export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  SUMMARY = 'SUMMARY',
  QUIZ = 'QUIZ',
  ESSAY = 'ESSAY',
  TUTOR = 'TUTOR',
  PROFILE = 'PROFILE'
}

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface StudyRequestData {
  subject: string;
  gradeClass: string;
  board: string;
  language: string;
  chapterName: string;
  author?: string;
  questionCount?: number;
  difficulty?: DifficultyLevel;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  type: AppMode;
  title: string;
  subtitle: string;
  timestamp: number;
  content?: any; // string for summary/essay, QuizQuestion[] for quiz
  formData?: StudyRequestData;
  score?: number; // Score achieved if it was a quiz
}

export interface UserProfile {
  displayName: string;
  phoneNumber: string;
  institution: string;
  bio: string;
  photoURL?: string;
  learningGoal?: string;
  learningStyle?: 'Visual' | 'Auditory' | 'Reading/Writing' | 'Kinesthetic';
  credits: number;
}

export const INITIAL_FORM_DATA: StudyRequestData = {
  subject: '',
  gradeClass: '',
  board: '',
  language: 'English',
  chapterName: '',
  author: '',
  questionCount: 5,
  difficulty: 'Medium',
};
