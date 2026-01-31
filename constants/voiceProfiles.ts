export type VoiceGender = 'female' | 'male';
export type VoiceAge = 'young' | 'middle' | 'elderly';
export type EmotionalState = 'neutral' | 'anxious' | 'pain' | 'confused' | 'frustrated' | 'relieved';

export interface VoiceProfile {
  id: string;
  name: string;
  gender: VoiceGender;
  age: VoiceAge;
  openAiVoice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  pitch: number;
  rate: number;
  description: string;
}

export interface SpeechModifiers {
  hesitations: string[];
  fillers: string[];
  painExpressions: string[];
  anxiousMarkers: string[];
  confusedMarkers: string[];
  pauseMarker: string;
}

export const VOICE_PROFILES: VoiceProfile[] = [
  // Female voices - 'shimmer' is the most naturally feminine voice
  {
    id: 'female_young',
    name: 'Anna',
    gender: 'female',
    age: 'young',
    openAiVoice: 'shimmer',
    pitch: 1.0,
    rate: 1.0,
    description: 'Young woman, bright feminine voice',
  },
  {
    id: 'female_middle',
    name: 'Sabine',
    gender: 'female',
    age: 'middle',
    openAiVoice: 'nova',
    pitch: 1.0,
    rate: 1.0,
    description: 'Middle-aged woman, warm feminine voice',
  },
  {
    id: 'female_elderly',
    name: 'Helga',
    gender: 'female',
    age: 'elderly',
    openAiVoice: 'shimmer',
    pitch: 1.0,
    rate: 0.95,
    description: 'Elderly woman, gentle feminine voice',
  },
  // Male voices - 'echo' for younger, 'onyx' for deep masculine
  {
    id: 'male_young',
    name: 'Markus',
    gender: 'male',
    age: 'young',
    openAiVoice: 'echo',
    pitch: 1.0,
    rate: 1.0,
    description: 'Young man, clear masculine voice',
  },
  {
    id: 'male_middle',
    name: 'Stefan',
    gender: 'male',
    age: 'middle',
    openAiVoice: 'onyx',
    pitch: 1.0,
    rate: 1.0,
    description: 'Middle-aged man, deep masculine voice',
  },
  {
    id: 'male_elderly',
    name: 'Heinrich',
    gender: 'male',
    age: 'elderly',
    openAiVoice: 'onyx',
    pitch: 1.0,
    rate: 0.92,
    description: 'Elderly man, deep authoritative voice',
  },
];

export const SPEECH_MODIFIERS: SpeechModifiers = {
  hesitations: [],
  fillers: [],
  painExpressions: [],
  anxiousMarkers: [],
  confusedMarkers: [],
  pauseMarker: ', ',
};

export const EMOTIONAL_SPEECH_PATTERNS: Record<EmotionalState, {
  rateModifier: number;
  pitchModifier: number;
  insertPauses: boolean;
  useHesitations: boolean;
  usePainExpressions: boolean;
  breathingPauses: boolean;
  sentenceVariation: number;
}> = {
  neutral: {
    rateModifier: 0.95,
    pitchModifier: 1.0,
    insertPauses: true,
    useHesitations: false,
    usePainExpressions: false,
    breathingPauses: true,
    sentenceVariation: 0.05,
  },
  anxious: {
    rateModifier: 1.02,
    pitchModifier: 1.05,
    insertPauses: true,
    useHesitations: true,
    usePainExpressions: false,
    breathingPauses: true,
    sentenceVariation: 0.1,
  },
  pain: {
    rateModifier: 0.78,
    pitchModifier: 0.92,
    insertPauses: true,
    useHesitations: true,
    usePainExpressions: true,
    breathingPauses: true,
    sentenceVariation: 0.15,
  },
  confused: {
    rateModifier: 0.82,
    pitchModifier: 0.98,
    insertPauses: true,
    useHesitations: true,
    usePainExpressions: false,
    breathingPauses: true,
    sentenceVariation: 0.12,
  },
  frustrated: {
    rateModifier: 1.0,
    pitchModifier: 1.02,
    insertPauses: false,
    useHesitations: false,
    usePainExpressions: false,
    breathingPauses: false,
    sentenceVariation: 0.08,
  },
  relieved: {
    rateModifier: 0.88,
    pitchModifier: 0.98,
    insertPauses: true,
    useHesitations: false,
    usePainExpressions: false,
    breathingPauses: true,
    sentenceVariation: 0.05,
  },
};

export function getRandomVoice(): VoiceProfile {
  const randomIndex = Math.floor(Math.random() * VOICE_PROFILES.length);
  return VOICE_PROFILES[randomIndex];
}

export function getVoiceByCharacteristics(gender?: VoiceGender, age?: VoiceAge): VoiceProfile {
  let filtered = [...VOICE_PROFILES];
  
  if (gender) {
    filtered = filtered.filter(v => v.gender === gender);
  }
  
  if (age) {
    filtered = filtered.filter(v => v.age === age);
  }
  
  if (filtered.length === 0) {
    return getRandomVoice();
  }
  
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}

export function processTextForNaturalSpeech(
  text: string,
  _emotionalState: EmotionalState,
  _personality: 'anxious' | 'talkative' | 'brief'
): string {
  // Keep text natural - OpenAI TTS handles natural delivery
  // Don't inject artificial hesitations that sound robotic when read
  return text;
}

export function prepareTextForTTS(text: string, emotionalState: EmotionalState): string {
  let ttsText = text;
  
  // Remove any bracketed markers
  ttsText = ttsText.replace(/\[.*?\]/g, '');
  
  // Keep ellipsis as natural pauses - just normalize them
  ttsText = ttsText.replace(/\.\.\.+/g, '...');
  
  // Ensure questions have proper question marks for rising intonation
  // Common German question patterns that might be missing ?
  const questionStarters = ['ob', 'was', 'wie', 'wo', 'wann', 'warum', 'wer', 'können', 'könnten', 'haben', 'ist', 'sind', 'sehen', 'verstehen', 'meinen', 'glauben', 'denken'];
  const sentences = ttsText.split(/(?<=[.!?])\s+/);
  
  ttsText = sentences.map(sentence => {
    const trimmed = sentence.trim();
    const lowerTrimmed = trimmed.toLowerCase();
    
    // Check if it's a question without question mark
    const endsWithPunctuation = /[.!?]$/.test(trimmed);
    const startsWithQuestionWord = questionStarters.some(q => lowerTrimmed.startsWith(q + ' ') || lowerTrimmed.startsWith(q + ','));
    const hasQuestionPattern = /\b(oder|nicht wahr|stimmt's|ja|ne|gell)\s*[.!]?$/i.test(trimmed);
    
    if (!endsWithPunctuation || (trimmed.endsWith('.') && (startsWithQuestionWord || hasQuestionPattern))) {
      if (startsWithQuestionWord || hasQuestionPattern) {
        return trimmed.replace(/[.!]?$/, '?');
      }
    }
    return trimmed;
  }).join(' ');
  
  // Add subtle emphasis markers for natural speech
  // German emphasis on "hier", "da", "so", "sehr" etc.
  ttsText = ttsText.replace(/\b(hier|da|so|sehr|wirklich|total|ganz)\b/gi, (match) => match);
  
  // Clean up multiple spaces
  ttsText = ttsText.replace(/\s+/g, ' ');
  ttsText = ttsText.trim();
  
  return ttsText;
}

export function calculateDynamicSpeed(baseRate: number, emotionalState: EmotionalState): number {
  // Return 1.0 for natural speed - let the TTS model handle prosody
  // Artificial speed modifications make it sound robotic
  return 1.0;
}

export function detectEmotionalState(text: string, personality: 'anxious' | 'talkative' | 'brief'): EmotionalState {
  const lowerText = text.toLowerCase();
  
  // Pain indicators
  const painWords = ['schmerz', 'weh', 'aua', 'tut weh', 'sticht', 'brennt', 'pocht', 'krampf'];
  if (painWords.some(word => lowerText.includes(word))) {
    return 'pain';
  }
  
  // Anxiety indicators
  const anxiousWords = ['angst', 'sorge', 'besorgt', 'nervös', 'panik', 'schlimm', 'gefährlich'];
  if (anxiousWords.some(word => lowerText.includes(word)) || personality === 'anxious') {
    return 'anxious';
  }
  
  // Confusion indicators
  const confusedWords = ['verstehe nicht', 'weiß nicht', 'unklar', 'verwirrt', 'was meinen sie'];
  if (confusedWords.some(word => lowerText.includes(word))) {
    return 'confused';
  }
  
  // Frustration indicators
  const frustratedWords = ['schon wieder', 'immer noch', 'hilft nichts', 'ärgerlich'];
  if (frustratedWords.some(word => lowerText.includes(word))) {
    return 'frustrated';
  }
  
  // Relief indicators
  const relievedWords = ['besser', 'erleichtert', 'gut zu wissen', 'beruhigt'];
  if (relievedWords.some(word => lowerText.includes(word))) {
    return 'relieved';
  }
  
  return 'neutral';
}
