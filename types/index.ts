export type UserTier = 'free' | 'pro' | 'vip';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  tier: UserTier;
  hasSeenWelcome: boolean;
  createdAt: string;
}

export type DocumentStatus = 'not_started' | 'in_progress' | 'completed';

export interface DocumentItem {
  id: string;
  title: string;
  status: DocumentStatus;
  authorityTip: string;
  commonMistake: string;
}

export interface DocumentCategory {
  id: string;
  title: string;
  items: DocumentItem[];
  isExpanded: boolean;
}

export interface FSPMessage {
  id: string;
  role: 'patient' | 'arzt' | 'system';
  content: string;
  timestamp: number;
}

export type VoiceGenderPreference = 'auto' | 'male' | 'female';

export interface FSPSessionSettings {
  personality: 'anxious' | 'talkative' | 'brief';
  difficulty: 'A2' | 'B2' | 'C1';
  examinerInterruptions: boolean;
  voiceGender: VoiceGenderPreference;
}

export interface ArztbriefResult {
  correctedText: string;
  feedback: string[];
  watermark: string;
}

export interface SampleTemplate {
  id: string;
  title: string;
  category: 'arztbrief' | 'anamnesis' | 'motivation' | 'cv';
  content: string;
  isAvailable: boolean;
  requiredTier: UserTier;
}
