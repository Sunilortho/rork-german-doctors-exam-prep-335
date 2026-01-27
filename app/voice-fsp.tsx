import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
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

const PATIENT_SCENARIOS: PatientScenario[] = [
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
    id: 'urinary',
    name: 'Frau Bauer',
    gender: 'female',
    age: 'middle',
    greeting: 'Tag, Herr Doktor. Bauer ist mein Name.',
    complaint: 'Also, ich habe Probleme beim Wasserlassen. Es brennt und ich muss ständig auf Toilette.',
    history: 'Vor zwei Jahren Nierensteine, sonst gesund, keine Medikamente.',
    category: 'Urologie',
  },
  {
    id: 'cardiac',
    name: 'Frau Hoffmann',
    gender: 'female',
    age: 'elderly',
    greeting: 'Guten Tag, Hoffmann ist mein Name.',
    complaint: 'Ich bin so müde in letzter Zeit, und meine Beine sind so geschwollen, sehen Sie?',
    history: 'Herzinsuffizienz, Vorhofflimmern, nimmt Marcumar und Diuretika.',
    category: 'Kardiologie',
  },
  {
    id: 'orthopedic',
    name: 'Frau Klein',
    gender: 'female',
    age: 'young',
    greeting: 'Hallo, ich bin Maria Klein.',
    complaint: 'Ich hab mir beim Sport das Knie verdreht. Es ist total geschwollen und tut wirklich sehr weh.',
    history: 'Sportlerin, keine Vorerkrankungen, keine Allergien.',
    category: 'Orthopädie',
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
    id: 'diabetes',
    name: 'Frau Wagner',
    gender: 'female',
    age: 'elderly',
    greeting: 'Grüß Gott, Frau Doktor. Wagner ist mein Name.',
    complaint: 'Mir ist oft schwindelig und ich habe ständig Durst. Meine Füße kribbeln auch.',
    history: 'Diabetes Typ 2 seit 15 Jahren, Adipositas, nimmt Metformin.',
    category: 'Innere Medizin',
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
  {
    id: 'thyroid',
    name: 'Frau Braun',
    gender: 'female',
    age: 'young',
    greeting: 'Hallo, Braun ist mein Name.',
    complaint: 'Mir ist ständig heiß, ich schwitze viel und habe in letzter Zeit abgenommen, obwohl ich normal esse.',
    history: 'Keine Vorerkrankungen, Mutter hat Schilddrüsenprobleme.',
    category: 'Endokrinologie',
  },
  {
    id: 'depression',
    name: 'Frau Krause',
    gender: 'female',
    age: 'middle',
    greeting: 'Guten Tag, Herr Doktor. Krause.',
    complaint: 'Ich fühle mich seit Monaten so antriebslos. Ich kann nicht schlafen und habe keine Freude mehr an irgendetwas.',
    history: 'Keine psychiatrische Vorgeschichte, vor einem Jahr Scheidung.',
    category: 'Psychiatrie',
  },
  {
    id: 'allergy',
    name: 'Frau Richter',
    gender: 'female',
    age: 'young',
    greeting: 'Hallo, ich bin Sandra Richter.',
    complaint: 'Meine Augen jucken so stark und meine Nase läuft ständig. Das ist jedes Jahr im Frühling so.',
    history: 'Bekannte Pollenallergie, nimmt Cetirizin bei Bedarf.',
    category: 'Allergologie',
  },
  {
    id: 'stroke',
    name: 'Frau Schulz',
    gender: 'female',
    age: 'elderly',
    greeting: 'Guten Tag, Schulz mein Name.',
    complaint: 'Heute Morgen war plötzlich mein rechter Arm so schwach und ich konnte nicht richtig sprechen. Jetzt ist es besser.',
    history: 'Vorhofflimmern, Bluthochdruck, nimmt ASS und Metoprolol.',
    category: 'Neurologie',
  },
  {
    id: 'pregnancy',
    name: 'Frau Neumann',
    gender: 'female',
    age: 'young',
    greeting: 'Guten Tag, ich bin Frau Neumann.',
    complaint: 'Ich bin schwanger und habe seit ein paar Tagen Blutungen und Unterleibsschmerzen.',
    history: 'Erste Schwangerschaft, 12. Woche, keine Vorerkrankungen.',
    category: 'Gynäkologie',
  },
  {
    id: 'liver',
    name: 'Frau Lange',
    gender: 'female',
    age: 'middle',
    greeting: 'Tag, Lange ist mein Name.',
    complaint: 'Meine Haut und meine Augen sind so gelb geworden. Mir ist auch oft übel.',
    history: 'Regelmäßiger Alkoholkonsum seit 20 Jahren, bekannte Fettleber.',
    category: 'Gastroenterologie',
  },
  {
    id: 'hypertension',
    name: 'Frau Peters',
    gender: 'female',
    age: 'elderly',
    greeting: 'Grüß Gott, Peters mein Name.',
    complaint: 'Ich habe starke Kopfschmerzen im Hinterkopf und mir ist schwindelig. Mein Blutdruck war heute Morgen 190 zu 110.',
    history: 'Bekannte Hypertonie, nimmt Amlodipin, hat letzte Woche die Tabletten vergessen.',
    category: 'Kardiologie',
  },
  {
    id: 'anemia',
    name: 'Frau Koch',
    gender: 'female',
    age: 'young',
    greeting: 'Hallo, Koch ist mein Name.',
    complaint: 'Ich bin ständig müde und erschöpft. Mir wird auch oft schwarz vor Augen wenn ich aufstehe.',
    history: 'Vegetarierin seit 5 Jahren, starke Regelblutungen.',
    category: 'Hämatologie',
  },
  {
    id: 'asthma',
    name: 'Frau Wolf',
    gender: 'female',
    age: 'young',
    greeting: 'Guten Tag, Wolf mein Name.',
    complaint: 'Ich bekomme nachts kaum Luft und muss ständig husten. Das pfeift auch so komisch.',
    history: 'Als Kind Asthma, seit Jahren keine Beschwerden, neu eingezogen in Altbauwohnung.',
    category: 'Pneumologie',
  },
  {
    id: 'kidney',
    name: 'Frau Schäfer',
    gender: 'female',
    age: 'elderly',
    greeting: 'Guten Tag, Schäfer ist mein Name.',
    complaint: 'Meine Beine sind so geschwollen und ich muss kaum noch Wasser lassen. Mir ist auch ständig übel.',
    history: 'Diabetes seit 25 Jahren, bekannte diabetische Nephropathie Stadium 3.',
    category: 'Nephrologie',
  },
  {
    id: 'skin',
    name: 'Frau Meier',
    gender: 'female',
    age: 'middle',
    greeting: 'Hallo, Meier mein Name.',
    complaint: 'Ich habe so rote, schuppige Stellen auf der Haut, besonders an den Ellbogen und Knien. Das juckt furchtbar.',
    history: 'Vater hatte Psoriasis, aktuell viel Stress bei der Arbeit.',
    category: 'Dermatologie',
  },
  {
    id: 'vertigo',
    name: 'Frau Huber',
    gender: 'female',
    age: 'elderly',
    greeting: 'Grüß Gott, Huber ist mein Name.',
    complaint: 'Mir dreht sich alles, besonders wenn ich mich im Bett umdrehe. Mir ist auch übel davon.',
    history: 'Keine Vorerkrankungen, nimmt keine Medikamente.',
    category: 'HNO',
  },
  {
    id: 'dvt',
    name: 'Frau Vogel',
    gender: 'female',
    age: 'middle',
    greeting: 'Tag, Vogel mein Name.',
    complaint: 'Mein linkes Bein ist seit zwei Tagen dick und rot. Es tut weh, besonders in der Wade.',
    history: 'Vor 3 Wochen Langstreckenflug, nimmt die Pille, raucht 10 Zigaretten täglich.',
    category: 'Angiologie',
  },
  {
    id: 'migraine',
    name: 'Frau Beck',
    gender: 'female',
    age: 'young',
    greeting: 'Hallo, Beck ist mein Name.',
    complaint: 'Ich habe wieder diese pochenden Kopfschmerzen, nur auf einer Seite. Mir ist übel und Licht tut weh.',
    history: 'Bekannte Migräne seit der Pubertät, nimmt Triptane bei Bedarf.',
    category: 'Neurologie',
  },
  {
    id: 'fracture',
    name: 'Frau Zimmermann',
    gender: 'female',
    age: 'elderly',
    greeting: 'Guten Tag, Zimmermann mein Name.',
    complaint: 'Ich bin gestürzt und kann jetzt nicht mehr auf dem linken Bein stehen. Die Hüfte tut so weh.',
    history: 'Osteoporose, nimmt Calcium und Vitamin D, keine Bisphosphonate.',
    category: 'Unfallchirurgie',
  },
  // Male patients
  {
    id: 'male_chest',
    name: 'Herr Baumann',
    gender: 'male',
    age: 'middle',
    greeting: 'Guten Tag, Baumann ist mein Name.',
    complaint: 'Ich habe seit zwei Tagen ein starkes Engegefühl in der Brust. Das strahlt in den linken Arm aus.',
    history: 'Raucher seit 25 Jahren, Übergewicht, Vater hatte Herzinfarkt mit 55.',
    category: 'Kardiologie',
  },
  {
    id: 'male_diabetes',
    name: 'Herr Krüger',
    gender: 'male',
    age: 'elderly',
    greeting: 'Grüß Gott, Krüger mein Name.',
    complaint: 'Meine Füße brennen und kribbeln ständig. Nachts ist es besonders schlimm, ich kann kaum schlafen.',
    history: 'Diabetes Typ 2 seit 20 Jahren, HbA1c zuletzt 8.5%, nimmt Metformin und Insulin.',
    category: 'Innere Medizin',
  },
  {
    id: 'male_prostate',
    name: 'Herr Schwarz',
    gender: 'male',
    age: 'elderly',
    greeting: 'Tag, Schwarz ist mein Name.',
    complaint: 'Ich muss nachts fünf- bis sechsmal auf die Toilette. Der Strahl ist auch ganz schwach geworden.',
    history: 'Keine Vorerkrankungen, PSA vor zwei Jahren leicht erhöht.',
    category: 'Urologie',
  },
  {
    id: 'male_back',
    name: 'Herr Friedrich',
    gender: 'male',
    age: 'middle',
    greeting: 'Hallo, Friedrich ist mein Name.',
    complaint: 'Ich habe seit einer Woche starke Rückenschmerzen, die ins linke Bein ausstrahlen. Manchmal kribbelt der Fuß.',
    history: 'Bandscheibenvorfall vor 5 Jahren, arbeitet im Lager, hebt schwere Sachen.',
    category: 'Orthopädie',
  },
  {
    id: 'male_gout',
    name: 'Herr Weber',
    gender: 'male',
    age: 'middle',
    greeting: 'Guten Tag, Weber mein Name.',
    complaint: 'Mein großer Zeh ist seit gestern Nacht knallrot, geschwollen und tut höllisch weh. Ich kann nicht mal eine Decke drauflegen.',
    history: 'Bekannte Hyperurikämie, trinkt gerne Bier, isst viel Fleisch.',
    category: 'Rheumatologie',
  },
  {
    id: 'male_lung',
    name: 'Herr Hartmann',
    gender: 'male',
    age: 'elderly',
    greeting: 'Tag, Hartmann ist mein Name.',
    complaint: 'Ich huste seit Wochen und habe Blut im Auswurf gesehen. Ich habe auch fünf Kilo abgenommen.',
    history: 'Raucher seit 40 Jahren, COPD bekannt, Nachtschweiß seit Wochen.',
    category: 'Pneumologie',
  },
  {
    id: 'male_anxiety',
    name: 'Herr Lehmann',
    gender: 'male',
    age: 'young',
    greeting: 'Hallo, Lehmann ist mein Name.',
    complaint: 'Ich habe plötzlich Herzrasen, Schweißausbrüche und das Gefühl, ich müsste sterben. Das kommt aus dem Nichts.',
    history: 'Keine Vorerkrankungen, viel Stress bei der Arbeit, erste Episode vor einem Monat.',
    category: 'Psychiatrie',
  },
  {
    id: 'male_stomach',
    name: 'Herr Becker',
    gender: 'male',
    age: 'young',
    greeting: 'Guten Tag, Becker mein Name.',
    complaint: 'Ich habe seit zwei Wochen Oberbauchschmerzen und schwarzen Stuhl. Das macht mir Sorgen.',
    history: 'Nimmt regelmäßig Ibuprofen wegen Kopfschmerzen, trinkt viel Kaffee.',
    category: 'Gastroenterologie',
  },
];

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
    
    // Check for unclear/incomplete sentences
    if (text.length < 10 && !text.includes('?')) {
      return {
        text: text,
        suggestion: 'Versuchen Sie, vollständige Sätze zu formulieren.',
        type: 'clarity',
      };
    }
    
    // Check for missing medical terminology structure
    if (lowerText.includes('weh') && !lowerText.includes('schmerz')) {
      return {
        text: '"weh tun"',
        suggestion: 'Verwenden Sie medizinische Begriffe: "Schmerzen" statt "weh tun".',
        type: 'vocabulary',
      };
    }
    
    // Check for informal language
    if (lowerText.includes('kriegen') || lowerText.includes('gekriegt')) {
      return {
        text: '"kriegen"',
        suggestion: 'Formeller: "bekommen" oder "erhalten" statt "kriegen".',
        type: 'vocabulary',
      };
    }
    
    // Check for missing question intonation markers
    if ((lowerText.includes('können sie') || lowerText.includes('haben sie')) && !text.includes('?')) {
      return {
        text: text,
        suggestion: 'Vergessen Sie nicht das Fragezeichen bei Fragen an den Patienten.',
        type: 'grammar',
      };
    }
    
    // Check for anamnesis structure
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

  const startSession = () => {
    setShowSettings(false);
    setPronunciationHint(null);
    
    // Select scenario based on mode
    let scenario: PatientScenario;
    if (randomMode || !selectedScenarioId) {
      scenario = PATIENT_SCENARIOS[Math.floor(Math.random() * PATIENT_SCENARIOS.length)];
    } else {
      scenario = PATIENT_SCENARIOS.find(s => s.id === selectedScenarioId) || PATIENT_SCENARIOS[0];
    }
    
    // Select voice based on scenario gender and age for natural matching
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
      
      // Prepare text for natural TTS with proper pauses and intonation
      const ttsText = prepareTextForTTS(text, emotionalState);
      
      console.log(`[VoiceFSP] Speaking: "${ttsText.substring(0, 50)}..." with ${voice.name} (${emotionalState}) - ${patientGender} patient`);
      
      // Use expo-speech with natural German voice settings, matching patient gender
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
      // Stop any ongoing speech first
      await Speech.stop();
      
      const pattern = EMOTIONAL_SPEECH_PATTERNS[emotionalState];
      const dynamicRate = calculateDynamicSpeed(voice.rate, emotionalState);
      
      // Get available voices and find appropriate German voice based on patient gender
      const voices = await Speech.getAvailableVoicesAsync();
      const germanVoices = voices.filter(v => v.language.startsWith('de'));
      
      // Extended voice name patterns for better detection
      const femaleNames = ['anna', 'petra', 'helena', 'marlene', 'vicki', 'female', 'frau', 'maria', 'sabine', 'eva', 'julia', 'katrin', 'woman', 'girl'];
      const maleNames = ['stefan', 'markus', 'hans', 'male', 'mann', 'herr', 'thomas', 'martin', 'andreas', 'michael', 'peter', 'klaus', 'man', 'boy', 'daniel', 'florian'];
      
      let germanVoice;
      let basePitch: number;
      
      if (patientGender === 'female') {
        // Try to find a female voice - prioritize known female names, avoid male names
        germanVoice = germanVoices.find(v => {
          const nameLower = v.name?.toLowerCase() || '';
          return femaleNames.some(fn => nameLower.includes(fn)) && !maleNames.some(mn => nameLower.includes(mn));
        }) || germanVoices.find(v => {
          const nameLower = v.name?.toLowerCase() || '';
          return !maleNames.some(mn => nameLower.includes(mn));
        }) || germanVoices[0];
        // Female pitch: natural to slightly higher
        basePitch = 1.0 * pattern.pitchModifier;
      } else {
        // Try to find a male voice - prioritize known male names
        germanVoice = germanVoices.find(v => {
          const nameLower = v.name?.toLowerCase() || '';
          return maleNames.some(mn => nameLower.includes(mn)) && !femaleNames.some(fn => nameLower.includes(fn));
        }) || germanVoices.find(v => {
          const nameLower = v.name?.toLowerCase() || '';
          return !femaleNames.some(fn => nameLower.includes(fn));
        }) || germanVoices[0];
        // Male pitch: distinctly lower for masculine sound
        basePitch = 0.75 * pattern.pitchModifier;
      }
      
      // Clamp pitch values appropriately for gender
      const finalPitch = patientGender === 'male' 
        ? Math.max(0.7, Math.min(0.85, basePitch))  // Male: 0.7-0.85 for deep voice
        : Math.max(0.95, Math.min(1.1, basePitch)); // Female: 0.95-1.1 for natural female voice
      
      console.log('[VoiceFSP] Available German voices:', germanVoices.map(v => v.name).join(', '));
      console.log('[VoiceFSP] Using voice:', germanVoice?.name || 'default German', 'for', patientGender, 'patient');
      console.log('[VoiceFSP] Rate:', dynamicRate, 'Pitch:', finalPitch, '(gender:', patientGender, ')');
      
      await Speech.speak(text, {
        language: 'de-DE',
        voice: germanVoice?.identifier,
        pitch: finalPitch,
        rate: Math.max(0.85, Math.min(1.0, dynamicRate)),
        onStart: () => {
          console.log('[VoiceFSP] Speech started with pitch:', finalPitch);
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
    // Check for pronunciation/clarity hints
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
      // Detect emotional state from context
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
      
      // Process for natural speech
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

  if (showSettings) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.settingsContent}>
          <Text style={styles.settingsTitle}>FSP Simulation Setup</Text>
          <Text style={styles.settingsSubtitle}>
            Configure your practice session
          </Text>

          <View style={styles.voiceInfoCard}>
            <View style={styles.voiceInfoHeader}>
              <Users color={Colors.dark.primary} size={20} />
              <Text style={styles.voiceInfoTitle}>Natural Patient Voices</Text>
            </View>
            <Text style={styles.voiceInfoText}>
              High-quality voices with natural German intonation, 
              emotional expressions, and real-time pronunciation feedback.
            </Text>
          </View>

          <View style={styles.settingSection}>
            <Text style={styles.settingLabel}>Case Selection</Text>
            <View style={styles.caseModeRow}>
              <View style={styles.caseModeOption}>
                <Shuffle color={randomMode ? Colors.dark.primary : Colors.dark.textMuted} size={18} />
                <Text style={[styles.caseModeText, randomMode && styles.caseModeTextActive]}>Random</Text>
              </View>
              <Switch
                value={!randomMode}
                onValueChange={(value) => setRandomMode(!value)}
                trackColor={{ false: Colors.dark.surfaceLight, true: Colors.dark.primary }}
                thumbColor={Colors.dark.text}
              />
              <Text style={[styles.caseModeText, !randomMode && styles.caseModeTextActive]}>Choose Case</Text>
            </View>

            {!randomMode && (
              <TouchableOpacity
                style={styles.caseSelectorButton}
                onPress={() => setShowCaseSelector(!showCaseSelector)}
              >
                <Text style={styles.caseSelectorButtonText}>
                  {selectedScenarioId 
                    ? PATIENT_SCENARIOS.find(s => s.id === selectedScenarioId)?.name || 'Select Case'
                    : 'Select Case'}
                </Text>
                <ChevronDown color={Colors.dark.textSecondary} size={20} />
              </TouchableOpacity>
            )}

            {!randomMode && showCaseSelector && (
              <View style={styles.caseList}>
                {PATIENT_SCENARIOS.map((scenario) => (
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
                    <View style={styles.caseItemContent}>
                      <Text style={styles.caseItemName}>{scenario.name}</Text>
                      <Text style={styles.caseItemCategory}>{scenario.category}</Text>
                    </View>
                    <Text style={styles.caseItemComplaint} numberOfLines={1}>
                      {scenario.complaint.substring(0, 40)}...
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.settingSection}>
            <Text style={styles.settingLabel}>Patient Personality</Text>
            <View style={styles.optionRow}>
              {(['anxious', 'talkative', 'brief'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.optionButton,
                    settings.personality === p && styles.optionButtonActive,
                  ]}
                  onPress={() => setSettings({ ...settings, personality: p })}
                >
                  <Text style={[
                    styles.optionText,
                    settings.personality === p && styles.optionTextActive,
                  ]}>
                    {p === 'anxious' ? 'Ängstlich' : p === 'talkative' ? 'Gesprächig' : 'Kurz'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingSection}>
            <Text style={styles.settingLabel}>Difficulty Level</Text>
            <View style={styles.optionRow}>
              {(['A2', 'B2', 'C1'] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.optionButton,
                    settings.difficulty === d && styles.optionButtonActive,
                  ]}
                  onPress={() => setSettings({ ...settings, difficulty: d })}
                >
                  <Text style={[
                    styles.optionText,
                    settings.difficulty === d && styles.optionTextActive,
                  ]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startSession}>
            <Mic color={Colors.dark.text} size={24} />
            <Text style={styles.startButtonText}>Start Voice Simulation</Text>
          </TouchableOpacity>
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
        <Text style={styles.sessionTitle}>FSP Simulation</Text>
        <TouchableOpacity style={styles.headerButton} onPress={replayLastPatient}>
          <Volume2 color={isSpeaking ? Colors.dark.primary : Colors.dark.textSecondary} size={20} />
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
              <View style={styles.avatarPatient}>
                <User color={Colors.dark.text} size={18} />
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
                {message.role === 'arzt' ? 'Arzt' : 'Patient'}
              </Text>
              <Text style={styles.messageText}>{message.content}</Text>
            </View>
            {message.role === 'arzt' && (
              <View style={styles.avatarArzt}>
                <Stethoscope color={Colors.dark.text} size={18} />
              </View>
            )}
          </View>
        ))}

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator color={Colors.dark.primary} />
            <Text style={styles.processingText}>Verarbeitung...</Text>
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

      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          🎤 Sprechen Sie wie in der echten Prüfung. KI gibt Echtzeit-Feedback.
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.micButton,
            isRecording && styles.micButtonRecording,
            (isProcessing || !hasPermission) && styles.micButtonDisabled,
          ]}
          onPress={handleMicPress}
          disabled={isProcessing || !hasPermission}
        >
          {isRecording ? (
            <MicOff color={Colors.dark.text} size={32} />
          ) : (
            <Mic color={Colors.dark.text} size={32} />
          )}
        </TouchableOpacity>
        <Text style={styles.micLabel}>
          {isRecording ? 'Recording... Tap to stop' : isProcessing ? 'Processing...' : 'Tap to speak'}
        </Text>
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
    padding: 24,
    paddingTop: 40,
  },
  settingsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  settingsSubtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    marginBottom: 32,
  },
  settingSection: {
    marginBottom: 28,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  optionTextActive: {
    color: Colors.dark.text,
  },
  startButton: {
    backgroundColor: Colors.dark.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 20,
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  voiceInfoCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.primary + '40',
  },
  voiceInfoHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 8,
  },
  voiceInfoTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  voiceInfoText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 19,
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
    marginBottom: 16,
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  avatarPatient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarArzt: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 14,
    borderRadius: 16,
  },
  messageBubblePatient: {
    backgroundColor: Colors.dark.surface,
    borderBottomLeftRadius: 4,
  },
  messageBubbleArzt: {
    backgroundColor: Colors.dark.primary,
    borderBottomRightRadius: 4,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 15,
    color: Colors.dark.text,
    lineHeight: 22,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  processingText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  hintContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  hintText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  controlsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: Colors.dark.surface,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  micButtonRecording: {
    backgroundColor: Colors.dark.error,
  },
  micButtonDisabled: {
    backgroundColor: Colors.dark.textMuted,
    opacity: 0.5,
  },
  micLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  caseModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  caseModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  caseModeText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  caseModeTextActive: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  caseSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  caseSelectorButtonText: {
    fontSize: 15,
    color: Colors.dark.text,
  },
  caseList: {
    marginTop: 12,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  caseItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  caseItemSelected: {
    backgroundColor: Colors.dark.primary + '20',
  },
  caseItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  caseItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  caseItemCategory: {
    fontSize: 12,
    color: Colors.dark.primary,
    backgroundColor: Colors.dark.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  caseItemComplaint: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  pronunciationHintContainer: {
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
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
    fontWeight: '600',
    color: '#F5A623',
  },
  pronunciationHintText: {
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 20,
  },
});
