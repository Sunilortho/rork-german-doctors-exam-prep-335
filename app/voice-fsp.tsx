import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mic,
  MicOff,
  Volume2,
  RefreshCw,
  User,
  Stethoscope,
  Users,
  Shuffle,
  ChevronDown,
  Lightbulb,
  Play,
  Settings,
  Zap,
  Heart,
  Brain,
  Bone,
  Activity,
  Eye,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { FSPMessage, FSPSessionSettings } from '@/types';
import { generateText } from '@rork-ai/toolkit-sdk';
import {
  VoiceProfile,
  EmotionalState,
  EMOTIONAL_SPEECH_PATTERNS,
  getRandomVoice,
  getVoiceByCharacteristics,
  processTextForNaturalSpeech,
  prepareTextForTTS,
  calculateDynamicSpeed,
  detectEmotionalState,
} from '@/constants/voiceProfiles';



interface PatientScenario {
  id: string;
  name: string;
  gender: 'female' | 'male';
  age: 'young' | 'middle' | 'elderly';
  greeting: string;
  complaint: string;
  history: string;
  category: string;
}

// Demo version: Limited to 10 diverse cases for client demonstration
const PATIENT_SCENARIOS: PatientScenario[] = [
  // Female patients (5 cases)
  {
    id: 'headache',
    name: 'Frau Müller',
    gender: 'female',
    age: 'middle',
    greeting: 'Guten Tag, Herr Doktor. Ich bin Frau Müller.',
    complaint: 'Ich habe seit drei Tagen starke Kopfschmerzen und mir ist oft schwindelig.',
    history: 'Migräne in der Familie, keine bekannten Allergien, keine regelmäßige Medikation.',
    category: 'Neurologie',
  },
  {
    id: 'chest',
    name: 'Frau Schmidt',
    gender: 'female',
    age: 'elderly',
    greeting: 'Grüß Gott, Herr Doktor. Schmidt ist mein Name.',
    complaint: 'Also, ich habe seit einer Woche so ein Druckgefühl in der Brust. Das macht mir Sorgen.',
    history: 'Bluthochdruck seit 10 Jahren, nimmt Ramipril, Diabetes Typ 2.',
    category: 'Kardiologie',
  },
  {
    id: 'abdomen',
    name: 'Frau Weber',
    gender: 'female',
    age: 'young',
    greeting: 'Hallo, ich bin Lisa Weber.',
    complaint: 'Ich habe seit gestern starke Bauchschmerzen, hier unten rechts. Mir ist auch ein bisschen übel.',
    history: 'Keine Vorerkrankungen, keine Allergien, nimmt nur die Pille.',
    category: 'Chirurgie',
  },
  {
    id: 'respiratory',
    name: 'Frau Fischer',
    gender: 'female',
    age: 'middle',
    greeting: 'Guten Tag, Fischer mein Name.',
    complaint: 'Ich huste seit zwei Wochen und bekomme schlecht Luft, besonders nachts.',
    history: 'Raucherin seit 20 Jahren, COPD diagnostiziert, nimmt Salbutamol bei Bedarf.',
    category: 'Pneumologie',
  },
  {
    id: 'gastro',
    name: 'Frau Schneider',
    gender: 'female',
    age: 'middle',
    greeting: 'Guten Tag, ich bin Frau Schneider.',
    complaint: 'Ich habe seit zwei Wochen Sodbrennen und Magenschmerzen, besonders nach dem Essen.',
    history: 'Helicobacter pylori vor 5 Jahren behandelt, nimmt gelegentlich Ibuprofen bei Rückenschmerzen.',
    category: 'Gastroenterologie',
  },
  // Male patients (5 cases)
  {
    id: 'male_chest',
    name: 'Herr Müller',
    gender: 'male',
    age: 'middle',
    greeting: 'Guten Tag, Herr Doktor. Müller ist mein Name.',
    complaint: 'Ich habe seit gestern Abend starke Brustschmerzen. Die strahlen auch in den linken Arm aus.',
    history: 'Raucher seit 25 Jahren, Bluthochdruck, erhöhte Cholesterinwerte, nimmt Simvastatin.',
    category: 'Kardiologie',
  },
  {
    id: 'male_back',
    name: 'Herr Schmidt',
    gender: 'male',
    age: 'elderly',
    greeting: 'Grüß Gott, Schmidt mein Name.',
    complaint: 'Mein Rücken macht mir große Probleme. Die Schmerzen ziehen bis ins Bein runter.',
    history: 'Bandscheibenvorfall vor 10 Jahren, Arthrose, nimmt Ibuprofen bei Bedarf.',
    category: 'Orthopädie',
  },
  {
    id: 'male_diabetes',
    name: 'Herr Wagner',
    gender: 'male',
    age: 'middle',
    greeting: 'Hallo, Wagner ist mein Name.',
    complaint: 'Ich bin ständig müde und muss viel trinken. Außerdem habe ich in letzter Zeit stark abgenommen.',
    history: 'Übergewicht, Vater und Großvater hatten Diabetes.',
    category: 'Innere Medizin',
  },
  {
    id: 'male_injury',
    name: 'Herr Klein',
    gender: 'male',
    age: 'young',
    greeting: 'Hallo, ich bin Thomas Klein.',
    complaint: 'Ich bin beim Fußball umgeknickt. Der Knöchel ist stark geschwollen und ich kann kaum auftreten.',
    history: 'Sportler, früher schon mal denselben Knöchel verstaucht.',
    category: 'Unfallchirurgie',
  },
  {
    id: 'male_anxiety',
    name: 'Herr Braun',
    gender: 'male',
    age: 'young',
    greeting: 'Hallo, Braun mein Name.',
    complaint: 'Ich habe plötzlich Herzrasen und Atemnot, obwohl ich nichts mache. Das macht mir Angst.',
    history: 'Viel Stress bei der Arbeit, trinkt viel Kaffee, keine Vorerkrankungen.',
    category: 'Psychiatrie',
  },
];

const CATEGORY_ICONS: Record<string, any> = {
  'Neurologie': Brain,
  'Kardiologie': Heart,
  'Chirurgie': Activity,
  'Orthopädie': Bone,
  'Unfallchirurgie': Bone,
  'Urologie': Activity,
  'Pneumologie': Activity,
  'Innere Medizin': Activity,
  'Gastroenterologie': Activity,
  'Endokrinologie': Activity,
  'Psychiatrie': Brain,
  'Allergologie': Eye,
  'Dermatologie': Eye,
  'Gynäkologie': Heart,
  'Nephrologie': Activity,
  'HNO': Activity,
  'Angiologie': Heart,
  'Hämatologie': Activity,
  'Rheumatologie': Bone,
  'Ophthalmologie': Eye,
  'Infektiologie': Activity,
};

const createPatientPrompt = (scenario: typeof PATIENT_SCENARIOS[0], personality: string, emotionalState: EmotionalState) => {
  const personalityTraits = {
    anxious: 'Du bist besorgt und etwas ängstlich. Du fragst manchmal nach, ob es etwas Schlimmes sein könnte.',
    talkative: 'Du redest gerne und erzählst Details. Du schweifst manchmal ab.',
    brief: 'Du antwortest kurz und knapp. Du sagst nur das Nötigste.',
  };

  const emotionalGuidance = {
    neutral: '',
    anxious: 'Zeige deine Nervosität durch Nachfragen.',
    pain: 'Drücke deine Schmerzen durch kürzere Sätze aus.',
    confused: 'Zeige Verwirrung. Frage nach wenn du etwas nicht verstehst.',
    frustrated: 'Zeige leichte Frustration.',
    relieved: 'Zeige Erleichterung.',
  };

  

  return `Du bist ${scenario.name}, ein Patient bei der Fachsprachprüfung in Deutschland.

SPRICH NUR DEUTSCH. Du bist ein echter deutscher Patient im Gespräch mit einem Arzt.

Deine Persönlichkeit: ${personalityTraits[personality as keyof typeof personalityTraits]}

Deine Beschwerden: ${scenario.complaint}
Vorgeschichte: ${scenario.history}

${emotionalGuidance[emotionalState]}

SPRICH NATÜRLICH UND MENSCHLICH:
- Antworte so wie ein echter Patient sprechen würde - warmherzig, direkt, authentisch
- Stelle echte Fragen mit Fragezeichen wenn du unsicher bist: "Ist das schlimm?" "Was bedeutet das?"
- Benutze natürliche deutsche Redewendungen: "Wissen Sie...", "Also...", "Ja, genau"
- Zeige Emotionen durch deine Wortwahl, nicht durch künstliche Marker
- Halte Antworten kurz und gesprächsnah (1-3 Sätze)
- Sprich wie du mit deinem Hausarzt sprechen würdest - vertraut aber respektvoll`;
};

interface PronunciationHint {
  text: string;
  suggestion: string;
  type: 'clarity' | 'grammar' | 'vocabulary' | 'structure';
}

export default function VoiceFSPScreen() {
  const [messages, setMessages] = useState<FSPMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [settings, setSettings] = useState<FSPSessionSettings>({
    personality: 'anxious',
    difficulty: 'B2',
    examinerInterruptions: false,
    voiceGender: 'female',
  });
  const [currentScenario, setCurrentScenario] = useState<PatientScenario>(PATIENT_SCENARIOS[0]);
  const [currentVoice, setCurrentVoice] = useState<VoiceProfile>(getRandomVoice());
  const [currentEmotionalState, setCurrentEmotionalState] = useState<EmotionalState>('neutral');
  const [randomMode, setRandomMode] = useState(true);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [showCaseSelector, setShowCaseSelector] = useState(false);
  const [pronunciationHint, setPronunciationHint] = useState<PronunciationHint | null>(null);
  const [hintAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    checkPermissions();
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isRecording, pulseAnimation]);

  const checkPermissions = async () => {
    try {
      if (Platform.OS === 'web') {
        setHasPermission(true);
        return;
      }
      
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Mikrofon benötigt',
          'Bitte erlauben Sie den Zugriff auf das Mikrofon für die Sprachsimulation.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Permission check error:', error);
      setHasPermission(false);
    }
  };

  const showHint = useCallback((hint: PronunciationHint) => {
    setPronunciationHint(hint);
    Animated.sequence([
      Animated.timing(hintAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(5000),
      Animated.timing(hintAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setPronunciationHint(null));
  }, [hintAnimation]);

  const analyzeForPronunciationHints = useCallback((text: string): PronunciationHint | null => {
    const lowerText = text.toLowerCase();
    
    if (text.length < 10 && !text.includes('?')) {
      return {
        text: text,
        suggestion: 'Versuchen Sie, vollständige Sätze zu formulieren.',
        type: 'clarity',
      };
    }
    
    if (lowerText.includes('weh') && !lowerText.includes('schmerz')) {
      return {
        text: '"weh tun"',
        suggestion: 'Verwenden Sie medizinische Begriffe: "Schmerzen" statt "weh tun".',
        type: 'vocabulary',
      };
    }
    
    if (lowerText.includes('kriegen') || lowerText.includes('gekriegt')) {
      return {
        text: '"kriegen"',
        suggestion: 'Formeller: "bekommen" oder "erhalten" statt "kriegen".',
        type: 'vocabulary',
      };
    }
    
    if ((lowerText.includes('können sie') || lowerText.includes('haben sie')) && !text.includes('?')) {
      return {
        text: text,
        suggestion: 'Vergessen Sie nicht das Fragezeichen bei Fragen an den Patienten.',
        type: 'grammar',
      };
    }
    
    const anamnesisKeywords = ['seit wann', 'wo genau', 'wie stark', 'ausstrahlung', 'begleitsymptome'];
    const hasAnamnesisStructure = anamnesisKeywords.some(kw => lowerText.includes(kw));
    if (messages.length > 2 && messages.length < 6 && !hasAnamnesisStructure) {
      return {
        text: 'Anamnese-Struktur',
        suggestion: 'Denken Sie an SOCRATES: Site, Onset, Character, Radiation, Associated symptoms...',
        type: 'structure',
      };
    }
    
    return null;
  }, [messages]);

  const getFilteredScenarios = () => {
    if (genderFilter === 'all') return PATIENT_SCENARIOS;
    return PATIENT_SCENARIOS.filter(s => s.gender === genderFilter);
  };

  const startSession = () => {
    setShowSettings(false);
    setPronunciationHint(null);
    
    const filteredScenarios = getFilteredScenarios();
    let scenario: PatientScenario;
    
    if (randomMode || !selectedScenarioId) {
      scenario = filteredScenarios[Math.floor(Math.random() * filteredScenarios.length)];
    } else {
      scenario = PATIENT_SCENARIOS.find(s => s.id === selectedScenarioId) || filteredScenarios[0];
    }
    
    const voice = getVoiceByCharacteristics(scenario.gender, scenario.age);
    
    setCurrentScenario(scenario);
    setCurrentVoice(voice);
    setCurrentEmotionalState('anxious');
    
    const initialMessage = `${scenario.greeting} ${scenario.complaint}`;
    const processedMessage = processTextForNaturalSpeech(initialMessage, 'anxious', settings.personality);
    
    const message: FSPMessage = {
      id: '1',
      role: 'patient',
      content: processedMessage,
      timestamp: Date.now(),
    };
    setMessages([message]);
    speakTextEnhanced(processedMessage, voice, 'anxious', scenario.gender);
    
    console.log(`[VoiceFSP] Session started with ${scenario.name}, voice: ${voice.name} (${voice.age}), gender: ${scenario.gender}`);
  };

  const speakTextEnhanced = async (
    text: string,
    voice: VoiceProfile,
    emotionalState: EmotionalState,
    patientGender: 'female' | 'male' = 'female'
  ) => {
    try {
      setIsSpeaking(true);
      
      const ttsText = prepareTextForTTS(text, emotionalState);
      
      console.log(`[VoiceFSP] Speaking: "${ttsText.substring(0, 50)}..." with ${voice.name} (${emotionalState}) - ${patientGender} patient`);
      
      await speakWithExpoSpeech(ttsText, voice, emotionalState, patientGender);
    } catch (error) {
      console.log('[VoiceFSP] Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const speakWithExpoSpeech = async (
    text: string,
    voice: VoiceProfile,
    emotionalState: EmotionalState,
    patientGender: 'female' | 'male' = 'female'
  ) => {
    try {
      await Speech.stop();
      
      const pattern = EMOTIONAL_SPEECH_PATTERNS[emotionalState];
      const dynamicRate = calculateDynamicSpeed(voice.rate, emotionalState);
      
      const voices = await Speech.getAvailableVoicesAsync();
      const germanVoices = voices.filter(v => v.language.startsWith('de'));
      
      const femaleIdentifiers = ['anna', 'petra', 'helena', 'marlene', 'vicki', 'female', 'frau', 'woman', 'girl', 'sabine', 'helga', 'julia', 'maria', 'lisa', 'sarah', 'katja', 'monika', 'claudia', 'stefanie', 'heike', 'fem', 'weiblich', 'yuna', 'zira', 'hedda', 'katrin', 'amala', 'elke', 'ingrid', 'louisa', 'serafina', 'conchita', 'eva', 'emma', 'sophia', 'lena', 'hannah', 'mia', 'lea', 'nele', 'nina', 'samantha', 'karen', 'tessa', 'fiona', 'moira', 'ava', 'allison', 'susan', 'kathy', 'princess', 'victoria', 'alice', 'nova', 'shimmer', 'coral', 'sage', 'silke', 'gisela', 'renate', 'ursula', 'brigitte', 'christa', 'irmgard', 'karin', 'margit', 'sigrid', 'traude', 'elfriede', 'frieda', 'gertrud', 'hilde', 'inge', 'johanna', 'enhanced', 'premium'];
      const maleIdentifiers = ['stefan', 'markus', 'hans', 'male', 'mann', 'herr', 'man', 'boy', 'heinrich', 'thomas', 'daniel', 'martin', 'michael', 'andreas', 'peter', 'klaus', 'jürgen', 'wolfgang', 'dieter', 'masc', 'männlich', 'conrad', 'killian', 'florian', 'jonas', 'christoph', 'jan', 'karsten', 'ralf', 'bernd', 'georg', 'felix', 'leon', 'lukas', 'paul', 'tim', 'tobias', 'sebastian', 'benjamin', 'alexander', 'david', 'alex', 'tom', 'fred', 'ralph', 'bruce', 'albert', 'gordon', 'lee', 'oliver', 'rishi', 'aaron', 'onyx', 'echo', 'fable', 'alloy', 'ernst', 'friedrich', 'gerhard', 'helmut', 'horst', 'karl', 'kurt', 'ludwig', 'otto', 'walter', 'werner', 'wilhelm'];
      
      const checkVoiceGender = (voiceObj: { name?: string; identifier?: string }): 'female' | 'male' | 'unknown' => {
        const nameToCheck = `${voiceObj.name || ''} ${voiceObj.identifier || ''}`.toLowerCase();
        const hasFemaleId = femaleIdentifiers.some(fn => nameToCheck.includes(fn));
        const hasMaleId = maleIdentifiers.some(mn => nameToCheck.includes(mn));
        
        if (hasFemaleId && !hasMaleId) return 'female';
        if (hasMaleId && !hasFemaleId) return 'male';
        return 'unknown';
      };
      
      const categorizedVoices = germanVoices.map(v => ({
        voice: v,
        gender: checkVoiceGender(v)
      }));
      
      const femaleVoices = categorizedVoices.filter(v => v.gender === 'female');
      const maleVoices = categorizedVoices.filter(v => v.gender === 'male');
      const unknownVoices = categorizedVoices.filter(v => v.gender === 'unknown');
      
      console.log('[VoiceFSP] Looking for', patientGender, 'voice');
      console.log('[VoiceFSP] Female voices:', femaleVoices.map(v => v.voice.name).join(', ') || 'none');
      console.log('[VoiceFSP] Male voices:', maleVoices.map(v => v.voice.name).join(', ') || 'none');
      console.log('[VoiceFSP] Unknown voices:', unknownVoices.map(v => v.voice.name).join(', ') || 'none');
      
      let germanVoice;
      
      if (patientGender === 'female') {
        if (femaleVoices.length > 0) {
          germanVoice = femaleVoices[0].voice;
          console.log('[VoiceFSP] Using identified female voice:', germanVoice.name);
        } else if (unknownVoices.length > 0) {
          germanVoice = unknownVoices[0].voice;
          console.log('[VoiceFSP] Using unknown voice for female:', germanVoice.name);
        } else if (germanVoices.length > 0) {
          germanVoice = germanVoices[0];
          console.log('[VoiceFSP] Using fallback German voice for female:', germanVoice.name);
        }
      } else {
        if (maleVoices.length > 0) {
          germanVoice = maleVoices[0].voice;
          console.log('[VoiceFSP] Using identified male voice:', germanVoice.name);
        } else if (unknownVoices.length > 1) {
          germanVoice = unknownVoices[unknownVoices.length - 1].voice;
          console.log('[VoiceFSP] Using last unknown voice for male:', germanVoice.name);
        } else if (unknownVoices.length > 0) {
          germanVoice = unknownVoices[0].voice;
          console.log('[VoiceFSP] Using unknown voice for male:', germanVoice.name);
        } else if (germanVoices.length > 1) {
          germanVoice = germanVoices[germanVoices.length - 1];
          console.log('[VoiceFSP] Using fallback German voice for male:', germanVoice.name);
        } else if (germanVoices.length > 0) {
          germanVoice = germanVoices[0];
          console.log('[VoiceFSP] Using only German voice for male:', germanVoice.name);
        }
      }
      
      // Use maximum pitch difference for very clear gender differentiation
      // Female: very high pitch for distinctly feminine sound
      // Male: deep low pitch for distinctly masculine sound
      const finalPitch = patientGender === 'female' ? 1.7 : 0.65;
      const finalRate = patientGender === 'female' ? 1.08 : 0.88;
      
      console.log('[VoiceFSP] Selected voice:', germanVoice?.name || 'default German', 'for', patientGender, 'patient');
      console.log('[VoiceFSP] FINAL SPEECH CONFIG - Gender:', patientGender, 'Pitch:', finalPitch, 'Rate:', finalRate, 'Voice:', germanVoice?.name || 'system default');
      
      // For female patients, try to use a voice that naturally sounds female
      // If no female voice found, pitch adjustment helps differentiate
      const useVoiceId = germanVoice?.identifier;
      
      await Speech.speak(text, {
        language: 'de-DE',
        voice: useVoiceId,
        pitch: finalPitch,
        rate: finalRate,
        onStart: () => {
          console.log('[VoiceFSP] Speech started for', patientGender, 'patient with pitch', finalPitch);
        },
        onDone: () => {
          console.log('[VoiceFSP] Speech completed');
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.log('[VoiceFSP] Speech error:', error);
          setIsSpeaking(false);
        },
        onStopped: () => {
          console.log('[VoiceFSP] Speech stopped');
          setIsSpeaking(false);
        },
      });
    } catch (error) {
      console.log('[VoiceFSP] speakWithExpoSpeech error:', error);
      setIsSpeaking(false);
    }
  };

  const speakText = async (text: string) => {
    await speakTextEnhanced(text, currentVoice, currentEmotionalState, currentScenario.gender);
  };

  const startRecording = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Web-Einschränkung',
        'Die Sprachaufnahme funktioniert am besten auf einem mobilen Gerät. Bitte nutzen Sie die Text-basierte Übung im Web.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      if (!hasPermission) {
        await checkPermissions();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      recordingRef.current = recording;
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.log('Failed to start recording:', error);
      Alert.alert('Fehler', 'Aufnahme konnte nicht gestartet werden.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (uri) {
        await processAudio(uri);
      }
    } catch (error) {
      console.log('Failed to stop recording:', error);
      setIsProcessing(false);
    }
  };

  const processAudio = async (uri: string) => {
    try {
      const formData = new FormData();
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      const audioFile = {
        uri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      };

      formData.append('audio', audioFile as any);
      formData.append('language', 'de');

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      const transcribedText = data.text;

      if (transcribedText && transcribedText.trim()) {
        await handleDoctorMessage(transcribedText);
      } else {
        Alert.alert('Hinweis', 'Keine Sprache erkannt. Bitte sprechen Sie deutlicher.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.log('Audio processing error:', error);
      Alert.alert('Fehler', 'Spracherkennung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      setIsProcessing(false);
    }
  };

  const handleDoctorMessage = async (text: string) => {
    const hint = analyzeForPronunciationHints(text);
    if (hint) {
      showHint(hint);
    }
    
    const doctorMessage: FSPMessage = {
      id: Date.now().toString(),
      role: 'arzt',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, doctorMessage]);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    await generatePatientResponse(text);
  };

  const generatePatientResponse = async (doctorInput: string) => {
    try {
      const newEmotionalState = detectEmotionalState(doctorInput, settings.personality);
      setCurrentEmotionalState(newEmotionalState);
      
      const conversationHistory = messages.map(m => ({
        role: m.role === 'arzt' ? 'user' as const : 'assistant' as const,
        content: m.content,
      }));

      const systemPrompt = createPatientPrompt(currentScenario, settings.personality, newEmotionalState);

      const response = await generateText({
        messages: [
          { role: 'user', content: systemPrompt },
          { role: 'assistant', content: `Verstanden. Ich bin ${currentScenario.name} und werde entsprechend antworten.` },
          ...conversationHistory,
          { role: 'user', content: doctorInput },
        ],
      });

      let patientResponse = response || 'Entschuldigung, können Sie das bitte wiederholen?';
      
      patientResponse = processTextForNaturalSpeech(patientResponse, newEmotionalState, settings.personality);

      const patientMessage: FSPMessage = {
        id: Date.now().toString(),
        role: 'patient',
        content: patientResponse,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, patientMessage]);
      setIsProcessing(false);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      console.log(`[VoiceFSP] Patient response with emotional state: ${newEmotionalState}`);
      await speakTextEnhanced(patientResponse, currentVoice, newEmotionalState, currentScenario.gender);
    } catch (error) {
      console.log('[VoiceFSP] AI generation error:', error);
      const fallbackResponses = [
        'Ja, Herr Doktor. Können Sie mir bitte mehr erklären?',
        'Das verstehe ich nicht ganz.',
        'Also, wie meinen Sie das genau?',
        'Ja, und was bedeutet das für mich?',
      ];
      const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      const patientMessage: FSPMessage = {
        id: Date.now().toString(),
        role: 'patient',
        content: fallbackResponse,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, patientMessage]);
      setIsProcessing(false);
      await speakTextEnhanced(fallbackResponse, currentVoice, 'confused', currentScenario.gender);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const resetSession = async () => {
    setMessages([]);
    setShowSettings(true);
    Speech.stop();
    setCurrentEmotionalState('neutral');
  };

  const replayLastPatient = () => {
    const lastPatientMessage = [...messages].reverse().find(m => m.role === 'patient');
    if (lastPatientMessage) {
      speakText(lastPatientMessage.content);
    }
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = CATEGORY_ICONS[category] || Activity;
    return IconComponent;
  };

  if (showSettings) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView 
          contentContainerStyle={styles.settingsContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[Colors.dark.primary, Colors.dark.primaryDark]}
                style={styles.iconGradient}
              >
                <Mic color="#fff" size={32} />
              </LinearGradient>
            </View>
            <Text style={styles.settingsTitle}>FSP Voice Simulation</Text>
            <Text style={styles.settingsSubtitle}>
              Practice your medical German with AI-powered patient conversations
            </Text>
          </View>

          <View style={styles.featureCards}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(0, 180, 216, 0.15)' }]}>
                <Users color={Colors.dark.primary} size={18} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Natural Voices</Text>
                <Text style={styles.featureDesc}>Male & female patients</Text>
              </View>
            </View>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(0, 212, 170, 0.15)' }]}>
                <Zap color={Colors.dark.accent} size={18} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Real-time Feedback</Text>
                <Text style={styles.featureDesc}>Pronunciation hints</Text>
              </View>
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Settings color={Colors.dark.textSecondary} size={18} />
              <Text style={styles.settingCardTitle}>Session Settings</Text>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Case Selection</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleOption, randomMode && styles.toggleOptionActive]}
                  onPress={() => setRandomMode(true)}
                >
                  <Shuffle color={randomMode ? '#fff' : Colors.dark.textMuted} size={16} />
                  <Text style={[styles.toggleText, randomMode && styles.toggleTextActive]}>Random</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, !randomMode && styles.toggleOptionActive]}
                  onPress={() => setRandomMode(false)}
                >
                  <Text style={[styles.toggleText, !randomMode && styles.toggleTextActive]}>Choose</Text>
                </TouchableOpacity>
              </View>
            </View>

            {!randomMode && (
              <>
                <View style={styles.genderFilterRow}>
                  <Text style={styles.filterLabel}>Patient Gender:</Text>
                  <View style={styles.genderFilters}>
                    {(['all', 'female', 'male'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.genderChip, genderFilter === g && styles.genderChipActive]}
                        onPress={() => {
                          setGenderFilter(g);
                          setSelectedScenarioId(null);
                        }}
                      >
                        <Text style={[styles.genderChipText, genderFilter === g && styles.genderChipTextActive]}>
                          {g === 'all' ? 'All' : g === 'female' ? 'Female' : 'Male'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.caseSelectorButton}
                  onPress={() => setShowCaseSelector(!showCaseSelector)}
                >
                  <View style={styles.caseSelectorLeft}>
                    <User color={Colors.dark.textSecondary} size={18} />
                    <Text style={styles.caseSelectorButtonText}>
                      {selectedScenarioId 
                        ? PATIENT_SCENARIOS.find(s => s.id === selectedScenarioId)?.name || 'Select Case'
                        : 'Select a Patient Case'}
                    </Text>
                  </View>
                  <ChevronDown 
                    color={Colors.dark.textSecondary} 
                    size={20} 
                    style={{ transform: [{ rotate: showCaseSelector ? '180deg' : '0deg' }] }}
                  />
                </TouchableOpacity>
              </>
            )}

            {!randomMode && showCaseSelector && (
              <ScrollView style={styles.caseList} nestedScrollEnabled>
                {getFilteredScenarios().map((scenario) => {
                  const IconComponent = getCategoryIcon(scenario.category);
                  return (
                    <TouchableOpacity
                      key={scenario.id}
                      style={[
                        styles.caseItem,
                        selectedScenarioId === scenario.id && styles.caseItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedScenarioId(scenario.id);
                        setShowCaseSelector(false);
                      }}
                    >
                      <View style={styles.caseItemLeft}>
                        <View style={[
                          styles.caseAvatar,
                          scenario.gender === 'male' ? styles.caseAvatarMale : styles.caseAvatarFemale
                        ]}>
                          <User color="#fff" size={16} />
                        </View>
                        <View style={styles.caseItemContent}>
                          <Text style={styles.caseItemName}>{scenario.name}</Text>
                          <Text style={styles.caseItemComplaint} numberOfLines={1}>
                            {scenario.complaint.substring(0, 45)}...
                          </Text>
                        </View>
                      </View>
                      <View style={styles.caseItemRight}>
                        <View style={styles.categoryBadge}>
                          <IconComponent color={Colors.dark.primary} size={12} />
                          <Text style={styles.caseItemCategory}>{scenario.category}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Patient Personality</Text>
            </View>
            <View style={styles.personalityRow}>
              {(['anxious', 'talkative', 'brief'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.personalityButton,
                    settings.personality === p && styles.personalityButtonActive,
                  ]}
                  onPress={() => setSettings({ ...settings, personality: p })}
                >
                  <Text style={[
                    styles.personalityText,
                    settings.personality === p && styles.personalityTextActive,
                  ]}>
                    {p === 'anxious' ? 'Ängstlich' : p === 'talkative' ? 'Gesprächig' : 'Kurz'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Difficulty Level</Text>
            </View>
            <View style={styles.difficultyRow}>
              {(['A2', 'B2', 'C1'] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.difficultyButton,
                    settings.difficulty === d && styles.difficultyButtonActive,
                  ]}
                  onPress={() => setSettings({ ...settings, difficulty: d })}
                >
                  <Text style={[
                    styles.difficultyText,
                    settings.difficulty === d && styles.difficultyTextActive,
                  ]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.startButton} 
            onPress={startSession}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.dark.primary, Colors.dark.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButtonGradient}
            >
              <Play color="#fff" size={22} fill="#fff" />
              <Text style={styles.startButtonText}>Start Simulation</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.tipText}>
            Tip: Use a quiet environment for best speech recognition results
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.sessionHeader}>
        <TouchableOpacity style={styles.headerButton} onPress={resetSession}>
          <RefreshCw color={Colors.dark.textSecondary} size={20} />
        </TouchableOpacity>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>{currentScenario.name}</Text>
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText}>{currentScenario.category}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.headerButton, isSpeaking && styles.headerButtonActive]} 
          onPress={replayLastPatient}
        >
          <Volume2 color={isSpeaking ? '#fff' : Colors.dark.textSecondary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageRow,
              message.role === 'arzt' && styles.messageRowRight,
            ]}
          >
            {message.role === 'patient' && (
              <View style={[
                styles.avatarPatient,
                currentScenario.gender === 'male' ? styles.avatarMale : styles.avatarFemale
              ]}>
                <User color="#fff" size={16} />
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                message.role === 'arzt'
                  ? styles.messageBubbleArzt
                  : styles.messageBubblePatient,
              ]}
            >
              <Text style={styles.roleLabel}>
                {message.role === 'arzt' ? 'Sie (Arzt)' : currentScenario.name}
              </Text>
              <Text style={styles.messageText}>{message.content}</Text>
            </View>
            {message.role === 'arzt' && (
              <View style={styles.avatarArzt}>
                <Stethoscope color="#fff" size={16} />
              </View>
            )}
          </View>
        ))}

        {isProcessing && (
          <View style={styles.processingContainer}>
            <View style={styles.processingDots}>
              <Animated.View style={[styles.dot, styles.dot1]} />
              <Animated.View style={[styles.dot, styles.dot2]} />
              <Animated.View style={[styles.dot, styles.dot3]} />
            </View>
            <Text style={styles.processingText}>Patient denkt nach...</Text>
          </View>
        )}
      </ScrollView>

      {pronunciationHint && (
        <Animated.View 
          style={[
            styles.pronunciationHintContainer,
            {
              opacity: hintAnimation,
              transform: [{
                translateY: hintAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.pronunciationHintHeader}>
            <Lightbulb color="#F5A623" size={18} />
            <Text style={styles.pronunciationHintTitle}>Echtzeit-Hinweis</Text>
          </View>
          <Text style={styles.pronunciationHintText}>{pronunciationHint.suggestion}</Text>
        </Animated.View>
      )}

      <View style={styles.controlsContainer}>
        <View style={styles.recordingHint}>
          <Text style={styles.recordingHintText}>
            {isRecording ? 'Aufnahme läuft... Tippen zum Stoppen' : 
             isProcessing ? 'Verarbeitung...' : 'Tippen Sie zum Sprechen'}
          </Text>
        </View>
        
        <Animated.View style={[
          styles.micButtonContainer,
          { transform: [{ scale: pulseAnimation }] }
        ]}>
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording && styles.micButtonRecording,
              (isProcessing || !hasPermission) && styles.micButtonDisabled,
            ]}
            onPress={handleMicPress}
            disabled={isProcessing || !hasPermission}
            activeOpacity={0.8}
          >
            {isRecording ? (
              <MicOff color="#fff" size={32} />
            ) : (
              <Mic color="#fff" size={32} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  settingsContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 12,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  settingsSubtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  featureCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  settingCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  settingCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  settingRow: {
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 10,
    padding: 4,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  toggleOptionActive: {
    backgroundColor: Colors.dark.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.dark.textMuted,
  },
  toggleTextActive: {
    color: '#fff',
  },
  genderFilterRow: {
    marginBottom: 14,
  },
  filterLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginBottom: 8,
  },
  genderFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  genderChipActive: {
    backgroundColor: Colors.dark.primary + '20',
    borderColor: Colors.dark.primary,
  },
  genderChipText: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    fontWeight: '500' as const,
  },
  genderChipTextActive: {
    color: Colors.dark.primary,
  },
  caseSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  caseSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  caseSelectorButtonText: {
    fontSize: 15,
    color: Colors.dark.text,
  },
  caseList: {
    marginTop: 12,
    maxHeight: 280,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  caseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  caseItemSelected: {
    backgroundColor: Colors.dark.primary + '15',
  },
  caseItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  caseAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caseAvatarFemale: {
    backgroundColor: '#E91E63',
  },
  caseAvatarMale: {
    backgroundColor: '#2196F3',
  },
  caseItemContent: {
    flex: 1,
  },
  caseItemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  caseItemComplaint: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  caseItemRight: {
    marginLeft: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  caseItemCategory: {
    fontSize: 10,
    color: Colors.dark.primary,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: 18,
  },
  personalityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  personalityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
  },
  personalityButtonActive: {
    backgroundColor: Colors.dark.primary + '20',
    borderColor: Colors.dark.primary,
  },
  personalityText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
  },
  personalityTextActive: {
    color: Colors.dark.primary,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: Colors.dark.primary + '20',
    borderColor: Colors.dark.primary,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.dark.textMuted,
  },
  difficultyTextActive: {
    color: Colors.dark.primary,
  },
  startButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  tipText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonActive: {
    backgroundColor: Colors.dark.primary,
  },
  sessionInfo: {
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  sessionBadge: {
    backgroundColor: Colors.dark.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sessionBadgeText: {
    fontSize: 11,
    color: Colors.dark.primary,
    fontWeight: '600' as const,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  avatarPatient: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarFemale: {
    backgroundColor: '#E91E63',
  },
  avatarMale: {
    backgroundColor: '#2196F3',
  },
  avatarArzt: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  messageBubble: {
    maxWidth: '72%',
    padding: 14,
    borderRadius: 18,
  },
  messageBubblePatient: {
    backgroundColor: Colors.dark.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  messageBubbleArzt: {
    backgroundColor: Colors.dark.primary,
    borderBottomRightRadius: 4,
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 15,
    color: Colors.dark.text,
    lineHeight: 22,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  processingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.primary,
    opacity: 0.4,
  },
  dot1: {
    opacity: 1,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.3,
  },
  processingText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  controlsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  recordingHint: {
    marginBottom: 16,
  },
  recordingHintText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  micButtonContainer: {
    marginBottom: 8,
  },
  micButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: Colors.dark.error,
  },
  micButtonDisabled: {
    backgroundColor: Colors.dark.textMuted,
    opacity: 0.5,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.error,
  },
  recordingText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.error,
    letterSpacing: 1,
  },
  pronunciationHintContainer: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F5A623',
  },
  pronunciationHintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pronunciationHintTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#F5A623',
  },
  pronunciationHintText: {
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 20,
  },
});
