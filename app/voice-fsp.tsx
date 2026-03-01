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
  Lock,
  Crown,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { FSPMessage, FSPSessionSettings } from '@/types';
import { generateText } from '@rork-ai/toolkit-sdk';
import { trpc } from '@/lib/trpc';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'expo-router';
import {
  VoiceProfile,
  EmotionalState,
  getRandomVoice,
  getVoiceByCharacteristics,
  processTextForNaturalSpeech,
  prepareTextForTTS,
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
  // FEMALE PATIENTS - NEUROLOGIE (5)
  { id: 'f_neuro_1', name: 'Frau Müller', gender: 'female', age: 'middle', greeting: 'Guten Tag, Herr Doktor. Ich bin Frau Müller.', complaint: 'Ich habe seit drei Tagen starke Kopfschmerzen und mir ist oft schwindelig.', history: 'Migräne in der Familie, keine bekannten Allergien, keine regelmäßige Medikation.', category: 'Neurologie' },
  { id: 'f_neuro_2', name: 'Frau Hoffmann', gender: 'female', age: 'elderly', greeting: 'Guten Tag, Hoffmann mein Name.', complaint: 'Ich habe seit gestern Morgen Taubheitsgefühle in der rechten Hand und im Arm.', history: 'Bluthochdruck, Vorhofflimmern, nimmt Marcumar.', category: 'Neurologie' },
  { id: 'f_neuro_3', name: 'Frau Becker', gender: 'female', age: 'young', greeting: 'Hallo, ich bin Sophie Becker.', complaint: 'Ich sehe seit heute Morgen alles doppelt und habe starke Kopfschmerzen mit Übelkeit.', history: 'Keine Vorerkrankungen, nimmt die Pille, raucht gelegentlich.', category: 'Neurologie' },
  { id: 'f_neuro_4', name: 'Frau Zimmermann', gender: 'female', age: 'middle', greeting: 'Grüß Gott, Zimmermann ist mein Name.', complaint: 'Ich habe immer wieder Schwindelanfälle, besonders wenn ich den Kopf drehe.', history: 'Bekannter Tinnitus, Hörsturz vor 2 Jahren.', category: 'Neurologie' },
  { id: 'f_neuro_5', name: 'Frau Krause', gender: 'female', age: 'elderly', greeting: 'Guten Tag, ich bin Frau Krause.', complaint: 'Mein Gedächtnis lässt nach. Ich vergesse ständig Termine und Namen.', history: 'Depression behandelt, Schilddrüsenunterfunktion, nimmt L-Thyroxin.', category: 'Neurologie' },

  // FEMALE PATIENTS - KARDIOLOGIE (5)
  { id: 'f_kardio_1', name: 'Frau Schmidt', gender: 'female', age: 'elderly', greeting: 'Grüß Gott, Herr Doktor. Schmidt ist mein Name.', complaint: 'Also, ich habe seit einer Woche so ein Druckgefühl in der Brust. Das macht mir Sorgen.', history: 'Bluthochdruck seit 10 Jahren, nimmt Ramipril, Diabetes Typ 2.', category: 'Kardiologie' },
  { id: 'f_kardio_2', name: 'Frau Neumann', gender: 'female', age: 'middle', greeting: 'Guten Tag, Neumann mein Name.', complaint: 'Mein Herz stolpert manchmal, besonders abends. Das beunruhigt mich sehr.', history: 'Schilddrüsenüberfunktion, nimmt Carbimazol, viel Kaffee.', category: 'Kardiologie' },
  { id: 'f_kardio_3', name: 'Frau Schwarz', gender: 'female', age: 'elderly', greeting: 'Guten Tag, ich heiße Schwarz.', complaint: 'Ich bekomme beim Treppensteigen keine Luft mehr und meine Beine schwellen an.', history: 'Herzinsuffizienz NYHA II, nimmt Diuretika und ACE-Hemmer.', category: 'Kardiologie' },
  { id: 'f_kardio_4', name: 'Frau Werner', gender: 'female', age: 'young', greeting: 'Hallo, Werner ist mein Name.', complaint: 'Ich habe seit heute Morgen Herzrasen und mir ist ganz flau.', history: 'Keine Vorerkrankungen, viel Sport, Energy-Drinks.', category: 'Kardiologie' },
  { id: 'f_kardio_5', name: 'Frau Hartmann', gender: 'female', age: 'middle', greeting: 'Guten Tag Herr Doktor, Hartmann.', complaint: 'Der Blutdruck ist zu Hause immer sehr hoch, über 160.', history: 'Familiärer Bluthochdruck, Übergewicht, keine Medikamente bisher.', category: 'Kardiologie' },

  // FEMALE PATIENTS - CHIRURGIE/GASTRO (5)
  { id: 'f_chir_1', name: 'Frau Weber', gender: 'female', age: 'young', greeting: 'Hallo, ich bin Lisa Weber.', complaint: 'Ich habe seit gestern starke Bauchschmerzen, hier unten rechts. Mir ist auch ein bisschen übel.', history: 'Keine Vorerkrankungen, keine Allergien, nimmt nur die Pille.', category: 'Chirurgie' },
  { id: 'f_chir_2', name: 'Frau Koch', gender: 'female', age: 'middle', greeting: 'Guten Tag, Koch mein Name.', complaint: 'Ich habe kolikartige Schmerzen im rechten Oberbauch, besonders nach fettigem Essen.', history: 'Gallensteine bekannt, nimmt Buscopan bei Bedarf.', category: 'Chirurgie' },
  { id: 'f_chir_3', name: 'Frau Richter', gender: 'female', age: 'elderly', greeting: 'Grüß Gott, Richter ist mein Name.', complaint: 'Ich habe eine Beule in der Leiste, die beim Husten größer wird.', history: 'Chronische Bronchitis, nimmt Spiriva, Verstopfung häufig.', category: 'Chirurgie' },
  { id: 'f_gastro_1', name: 'Frau Schneider', gender: 'female', age: 'middle', greeting: 'Guten Tag, ich bin Frau Schneider.', complaint: 'Ich habe seit zwei Wochen Sodbrennen und Magenschmerzen, besonders nach dem Essen.', history: 'Helicobacter pylori vor 5 Jahren behandelt, nimmt gelegentlich Ibuprofen.', category: 'Gastroenterologie' },
  { id: 'f_gastro_2', name: 'Frau Lange', gender: 'female', age: 'young', greeting: 'Hallo, Lange mein Name.', complaint: 'Ich habe seit Wochen Durchfall und Bauchkrämpfe, oft mit Blut im Stuhl.', history: 'Keine Vorerkrankungen, Auslandsreise vor 2 Monaten.', category: 'Gastroenterologie' },

  // FEMALE PATIENTS - PNEUMOLOGIE (5)
  { id: 'f_pulmo_1', name: 'Frau Fischer', gender: 'female', age: 'middle', greeting: 'Guten Tag, Fischer mein Name.', complaint: 'Ich huste seit zwei Wochen und bekomme schlecht Luft, besonders nachts.', history: 'Raucherin seit 20 Jahren, COPD diagnostiziert, nimmt Salbutamol bei Bedarf.', category: 'Pneumologie' },
  { id: 'f_pulmo_2', name: 'Frau Schröder', gender: 'female', age: 'young', greeting: 'Hallo, ich bin Anna Schröder.', complaint: 'Ich bekomme plötzlich keine Luft, besonders bei Anstrengung oder wenn es kalt ist.', history: 'Heuschnupfen, Neurodermitis als Kind, Katzenallergie.', category: 'Pneumologie' },
  { id: 'f_pulmo_3', name: 'Frau Lehmann', gender: 'female', age: 'elderly', greeting: 'Guten Tag, Lehmann ist mein Name.', complaint: 'Ich huste seit drei Wochen Schleim und habe abends immer Fieber.', history: 'Diabetes Typ 2, Herzinsuffizienz, nimmt viele Medikamente.', category: 'Pneumologie' },
  { id: 'f_pulmo_4', name: 'Frau Köhler', gender: 'female', age: 'middle', greeting: 'Grüß Gott, Köhler mein Name.', complaint: 'Ich habe nachts Hustenanfälle und pfeife beim Atmen.', history: 'Asthma seit Kindheit, Kortison-Spray, Allergien gegen Hausstaubmilben.', category: 'Pneumologie' },
  { id: 'f_pulmo_5', name: 'Frau König', gender: 'female', age: 'young', greeting: 'Hallo, König ist mein Name.', complaint: 'Ich habe seit einer Woche Husten mit gelbem Auswurf und Fieber bis 39 Grad.', history: 'Keine Vorerkrankungen, arbeitet im Kindergarten.', category: 'Pneumologie' },

  // FEMALE PATIENTS - ORTHOPÄDIE (4)
  { id: 'f_ortho_1', name: 'Frau Fuchs', gender: 'female', age: 'elderly', greeting: 'Guten Tag, Fuchs mein Name.', complaint: 'Meine Knie tun so weh, besonders beim Aufstehen und Treppensteigen.', history: 'Arthrose beidseits, nimmt Ibuprofen regelmäßig, Osteoporose.', category: 'Orthopädie' },
  { id: 'f_ortho_2', name: 'Frau Scholz', gender: 'female', age: 'middle', greeting: 'Guten Tag, ich bin Frau Scholz.', complaint: 'Ich habe Schmerzen im Nacken, die in den Arm ausstrahlen und kribbeln.', history: 'Büroarbeit, viel Computerarbeit, Verspannungen häufig.', category: 'Orthopädie' },
  { id: 'f_ortho_3', name: 'Frau Möller', gender: 'female', age: 'young', greeting: 'Hallo, Möller ist mein Name.', complaint: 'Meine Schulter schmerzt seit dem Handballtraining, ich kann den Arm kaum heben.', history: 'Sportlerin, früher Schulterluxation rechts.', category: 'Orthopädie' },
  { id: 'f_ortho_4', name: 'Frau Friedrich', gender: 'female', age: 'middle', greeting: 'Grüß Gott, Friedrich mein Name.', complaint: 'Mein unterer Rücken schmerzt seit Wochen, besonders morgens bin ich ganz steif.', history: 'Sitzende Tätigkeit, leichtes Übergewicht, keine Vorerkrankungen.', category: 'Orthopädie' },

  // FEMALE PATIENTS - UROLOGIE/GYNÄKOLOGIE (4)
  { id: 'f_uro_1', name: 'Frau Weiß', gender: 'female', age: 'young', greeting: 'Hallo, Weiß ist mein Name.', complaint: 'Es brennt beim Wasserlassen und ich muss ständig auf die Toilette.', history: 'Häufige Blasenentzündungen, trinkt wenig, sexuell aktiv.', category: 'Urologie' },
  { id: 'f_uro_2', name: 'Frau Peters', gender: 'female', age: 'elderly', greeting: 'Guten Tag, Peters mein Name.', complaint: 'Ich verliere manchmal Urin, wenn ich huste oder niese.', history: 'Drei Geburten, Gebärmuttersenkung bekannt, nimmt keine Medikamente.', category: 'Urologie' },
  { id: 'f_gyn_1', name: 'Frau Graf', gender: 'female', age: 'young', greeting: 'Hallo, ich bin Frau Graf.', complaint: 'Ich habe starke Regelschmerzen und die Blutung ist sehr stark.', history: 'Unregelmäßiger Zyklus seit Jahren, nimmt keine Hormone.', category: 'Gynäkologie' },
  { id: 'f_gyn_2', name: 'Frau Meyer', gender: 'female', age: 'middle', greeting: 'Guten Tag, Meyer ist mein Name.', complaint: 'Ich habe Hitzewallungen und Schlafstörungen seit einigen Monaten.', history: 'Wechseljahre, letzte Periode vor 6 Monaten, keine Vorerkrankungen.', category: 'Gynäkologie' },

  // FEMALE PATIENTS - PSYCHIATRIE (3)
  { id: 'f_psych_1', name: 'Frau Schulze', gender: 'female', age: 'young', greeting: 'Hallo, Schulze ist mein Name.', complaint: 'Ich fühle mich seit Wochen so antriebslos und traurig, kann nicht mehr schlafen.', history: 'Studentin, Prüfungsstress, keine psychiatrische Vorgeschichte.', category: 'Psychiatrie' },
  { id: 'f_psych_2', name: 'Frau Berger', gender: 'female', age: 'middle', greeting: 'Guten Tag, Berger mein Name.', complaint: 'Ich habe Panikattacken, plötzlich bekomme ich keine Luft und das Herz rast.', history: 'Angststörung vor 5 Jahren, damals Therapie, jetzt wieder Symptome.', category: 'Psychiatrie' },
  { id: 'f_psych_3', name: 'Frau Keller', gender: 'female', age: 'elderly', greeting: 'Guten Tag, ich bin Frau Keller.', complaint: 'Ich kann nicht mehr schlafen und habe keine Freude mehr an nichts.', history: 'Ehemann vor 6 Monaten verstorben, lebt allein, keine Vormedikation.', category: 'Psychiatrie' },

  // FEMALE PATIENTS - DERMATOLOGIE (3)
  { id: 'f_derm_1', name: 'Frau Braun', gender: 'female', age: 'young', greeting: 'Hallo, ich bin Lisa Braun.', complaint: 'Ich habe einen juckenden Ausschlag am ganzen Körper seit einer Woche.', history: 'Neurodermitis als Kind, neue Waschmittelmarke verwendet.', category: 'Dermatologie' },
  { id: 'f_derm_2', name: 'Frau Wolf', gender: 'female', age: 'middle', greeting: 'Guten Tag, Wolf mein Name.', complaint: 'Ich habe ein Muttermal, das sich verändert hat und manchmal blutet.', history: 'Viele Sonnenbrände in der Jugend, heller Hauttyp.', category: 'Dermatologie' },
  { id: 'f_derm_3', name: 'Frau Sommer', gender: 'female', age: 'elderly', greeting: 'Grüß Gott, Sommer ist mein Name.', complaint: 'Meine Haut juckt ständig und ist ganz trocken, besonders an den Beinen.', history: 'Diabetes Typ 2, Niereninsuffizienz Stadium 2, nimmt viele Medikamente.', category: 'Dermatologie' },

  // MALE PATIENTS - KARDIOLOGIE (5)
  { id: 'm_kardio_1', name: 'Herr Müller', gender: 'male', age: 'middle', greeting: 'Guten Tag, Herr Doktor. Müller ist mein Name.', complaint: 'Ich habe seit gestern Abend starke Brustschmerzen. Die strahlen auch in den linken Arm aus.', history: 'Raucher seit 25 Jahren, Bluthochdruck, erhöhte Cholesterinwerte, nimmt Simvastatin.', category: 'Kardiologie' },
  { id: 'm_kardio_2', name: 'Herr Fischer', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Fischer mein Name.', complaint: 'Ich bekomme beim Gehen keine Luft mehr und muss oft stehen bleiben.', history: 'Herzinfarkt vor 5 Jahren, 3 Stents, nimmt ASS, Betablocker, Statin.', category: 'Kardiologie' },
  { id: 'm_kardio_3', name: 'Herr Weber', gender: 'male', age: 'middle', greeting: 'Guten Tag, Weber ist mein Name.', complaint: 'Mein Herz schlägt unregelmäßig und ich fühle mich oft erschöpft.', history: 'Vorhofflimmern bekannt, nimmt Xarelto, Betablocker.', category: 'Kardiologie' },
  { id: 'm_kardio_4', name: 'Herr Schäfer', gender: 'male', age: 'young', greeting: 'Hallo, Schäfer ist mein Name.', complaint: 'Ich hatte gestern beim Sport plötzlich Herzrasen und bin fast ohnmächtig geworden.', history: 'Leistungssportler, keine Vorerkrankungen, Großvater plötzlicher Herztod.', category: 'Kardiologie' },
  { id: 'm_kardio_5', name: 'Herr Hofmann', gender: 'male', age: 'elderly', greeting: 'Guten Tag, Hofmann mein Name.', complaint: 'Meine Beine sind abends immer ganz geschwollen und ich bin kurzatmig.', history: 'Herzinsuffizienz, Diabetes, Niereninsuffizienz, viele Medikamente.', category: 'Kardiologie' },

  // MALE PATIENTS - ORTHOPÄDIE (5)
  { id: 'm_ortho_1', name: 'Herr Schmidt', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Schmidt mein Name.', complaint: 'Mein Rücken macht mir große Probleme. Die Schmerzen ziehen bis ins Bein runter.', history: 'Bandscheibenvorfall vor 10 Jahren, Arthrose, nimmt Ibuprofen bei Bedarf.', category: 'Orthopädie' },
  { id: 'm_ortho_2', name: 'Herr Bauer', gender: 'male', age: 'middle', greeting: 'Guten Tag, Bauer ist mein Name.', complaint: 'Meine Schulter schmerzt nachts so stark, dass ich nicht schlafen kann.', history: 'Handwerker, viel Überkopfarbeit, keine Vorerkrankungen.', category: 'Orthopädie' },
  { id: 'm_ortho_3', name: 'Herr Richter', gender: 'male', age: 'young', greeting: 'Hallo, ich bin Richter.', complaint: 'Mein Knie ist seit dem Fußballspiel geschwollen und instabil.', history: 'Sportler, Kreuzbandriss links vor 3 Jahren, operiert.', category: 'Orthopädie' },
  { id: 'm_ortho_4', name: 'Herr Krüger', gender: 'male', age: 'elderly', greeting: 'Guten Tag, Krüger mein Name.', complaint: 'Ich habe starke Hüftschmerzen und hinke beim Gehen.', history: 'Coxarthrose beidseits, Diabetes, Bluthochdruck.', category: 'Orthopädie' },
  { id: 'm_ortho_5', name: 'Herr Schmitt', gender: 'male', age: 'middle', greeting: 'Grüß Gott, Schmitt ist mein Name.', complaint: 'Ich habe ein Kribbeln und Taubheitsgefühl in beiden Händen, besonders nachts.', history: 'Büroarbeit, viel am Computer, leichtes Übergewicht.', category: 'Orthopädie' },

  // MALE PATIENTS - INNERE MEDIZIN (5)
  { id: 'm_innere_1', name: 'Herr Wagner', gender: 'male', age: 'middle', greeting: 'Hallo, Wagner ist mein Name.', complaint: 'Ich bin ständig müde und muss viel trinken. Außerdem habe ich in letzter Zeit stark abgenommen.', history: 'Übergewicht, Vater und Großvater hatten Diabetes.', category: 'Innere Medizin' },
  { id: 'm_innere_2', name: 'Herr Becker', gender: 'male', age: 'elderly', greeting: 'Guten Tag, Becker ist mein Name.', complaint: 'Ich fühle mich seit Wochen schwach und habe keinen Appetit mehr.', history: 'Raucher seit 40 Jahren, Gewichtsverlust 5 kg in 2 Monaten.', category: 'Innere Medizin' },
  { id: 'm_innere_3', name: 'Herr Lorenz', gender: 'male', age: 'middle', greeting: 'Grüß Gott, Lorenz mein Name.', complaint: 'Mein Blutzucker ist immer zu hoch, obwohl ich die Tabletten nehme.', history: 'Diabetes Typ 2 seit 10 Jahren, Metformin, Übergewicht.', category: 'Innere Medizin' },
  { id: 'm_innere_4', name: 'Herr Krämer', gender: 'male', age: 'young', greeting: 'Hallo, Krämer ist mein Name.', complaint: 'Ich habe Fieber, Gelenkschmerzen und einen roten Fleck am Bein, der größer wird.', history: 'Zeckenbiss vor 2 Wochen, sonst gesund.', category: 'Innere Medizin' },
  { id: 'm_innere_5', name: 'Herr Vogt', gender: 'male', age: 'elderly', greeting: 'Guten Tag, Vogt ist mein Name.', complaint: 'Ich schwitze nachts so stark, dass ich das Bett wechseln muss.', history: 'Gewichtsverlust, Müdigkeit, keine bekannten Vorerkrankungen.', category: 'Innere Medizin' },

  // MALE PATIENTS - UNFALLCHIRURGIE (4)
  { id: 'm_unfall_1', name: 'Herr Klein', gender: 'male', age: 'young', greeting: 'Hallo, ich bin Thomas Klein.', complaint: 'Ich bin beim Fußball umgeknickt. Der Knöchel ist stark geschwollen und ich kann kaum auftreten.', history: 'Sportler, früher schon mal denselben Knöchel verstaucht.', category: 'Unfallchirurgie' },
  { id: 'm_unfall_2', name: 'Herr Maier', gender: 'male', age: 'middle', greeting: 'Guten Tag, Maier ist mein Name.', complaint: 'Ich bin von der Leiter gefallen und habe starke Schmerzen im Handgelenk.', history: 'Handwerker, keine Vorerkrankungen, Blutdruckmittel.', category: 'Unfallchirurgie' },
  { id: 'm_unfall_3', name: 'Herr Schulz', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Schulz mein Name.', complaint: 'Ich bin gestürzt und habe starke Schmerzen in der Hüfte.', history: 'Osteoporose, Marcumar wegen Vorhofflimmern, Gehstock.', category: 'Unfallchirurgie' },
  { id: 'm_unfall_4', name: 'Herr Franke', gender: 'male', age: 'young', greeting: 'Hallo, Franke ist mein Name.', complaint: 'Ich habe mir beim Snowboarden die Schulter ausgekugelt.', history: 'Sportler, Schulterluxation derselben Seite vor 2 Jahren.', category: 'Unfallchirurgie' },

  // MALE PATIENTS - PSYCHIATRIE (4)
  { id: 'm_psych_1', name: 'Herr Braun', gender: 'male', age: 'young', greeting: 'Hallo, Braun mein Name.', complaint: 'Ich habe plötzlich Herzrasen und Atemnot, obwohl ich nichts mache. Das macht mir Angst.', history: 'Viel Stress bei der Arbeit, trinkt viel Kaffee, keine Vorerkrankungen.', category: 'Psychiatrie' },
  { id: 'm_psych_2', name: 'Herr Seidel', gender: 'male', age: 'middle', greeting: 'Guten Tag, Seidel ist mein Name.', complaint: 'Ich kann nicht mehr schlafen und trinke abends immer mehr Alkohol.', history: 'Scheidung vor 6 Monaten, Jobverlust, früher keine Probleme.', category: 'Psychiatrie' },
  { id: 'm_psych_3', name: 'Herr Zimmermann', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Zimmermann mein Name.', complaint: 'Ich habe keine Freude mehr am Leben und denke oft, dass alles sinnlos ist.', history: 'Ehefrau vor einem Jahr verstorben, lebt allein, Diabetes.', category: 'Psychiatrie' },
  { id: 'm_psych_4', name: 'Herr Otto', gender: 'male', age: 'young', greeting: 'Hallo, Otto ist mein Name.', complaint: 'Ich habe ständig Angst, dass etwas Schlimmes passiert, und kann mich nicht konzentrieren.', history: 'Student, Prüfungsangst, Schlafstörungen seit Monaten.', category: 'Psychiatrie' },

  // MALE PATIENTS - GASTROENTEROLOGIE (4)
  { id: 'm_gastro_1', name: 'Herr Neumann', gender: 'male', age: 'middle', greeting: 'Guten Tag, Neumann ist mein Name.', complaint: 'Ich habe seit Wochen Sodbrennen und ein Druckgefühl im Magen.', history: 'Übergewicht, viel Stress, raucht, trinkt Alkohol regelmäßig.', category: 'Gastroenterologie' },
  { id: 'm_gastro_2', name: 'Herr Schwarz', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Schwarz mein Name.', complaint: 'Ich habe Blut im Stuhl bemerkt und Bauchschmerzen.', history: 'Darmspiegelung vor 5 Jahren unauffällig, Hämorrhoiden bekannt.', category: 'Gastroenterologie' },
  { id: 'm_gastro_3', name: 'Herr Werner', gender: 'male', age: 'young', greeting: 'Hallo, Werner ist mein Name.', complaint: 'Ich habe starke Bauchkrämpfe und Durchfall, besonders nach dem Essen.', history: 'Keine Vorerkrankungen, neue Arbeitsstelle mit viel Stress.', category: 'Gastroenterologie' },
  { id: 'm_gastro_4', name: 'Herr Hartmann', gender: 'male', age: 'middle', greeting: 'Guten Tag, Hartmann ist mein Name.', complaint: 'Meine Haut und Augen sind gelblich geworden und ich habe keinen Appetit.', history: 'Früher viel Alkohol getrunken, seit 2 Jahren abstinent.', category: 'Gastroenterologie' },

  // MALE PATIENTS - UROLOGIE (4)
  { id: 'm_uro_1', name: 'Herr Meyer', gender: 'male', age: 'elderly', greeting: 'Guten Tag, Meyer ist mein Name.', complaint: 'Ich muss nachts fünfmal zur Toilette und der Strahl ist ganz schwach.', history: 'Prostatavergrößerung bekannt, nimmt Tamsulosin.', category: 'Urologie' },
  { id: 'm_uro_2', name: 'Herr Lange', gender: 'male', age: 'middle', greeting: 'Grüß Gott, Lange mein Name.', complaint: 'Ich habe starke Schmerzen in der Seite, die in die Leiste ausstrahlen.', history: 'Nierensteine vor 3 Jahren, trinkt wenig, viel Fleisch.', category: 'Urologie' },
  { id: 'm_uro_3', name: 'Herr Kraus', gender: 'male', age: 'young', greeting: 'Hallo, Kraus ist mein Name.', complaint: 'Es brennt beim Wasserlassen und ich habe Ausfluss.', history: 'Sexuell aktiv, keine Vorerkrankungen.', category: 'Urologie' },
  { id: 'm_uro_4', name: 'Herr Heinrich', gender: 'male', age: 'elderly', greeting: 'Guten Tag, Heinrich ist mein Name.', complaint: 'Ich habe Blut im Urin bemerkt, keine Schmerzen.', history: 'Raucher, 60 Jahre, PSA leicht erhöht vor 6 Monaten.', category: 'Urologie' },

  // MALE PATIENTS - NEUROLOGIE (4)
  { id: 'm_neuro_1', name: 'Herr Koch', gender: 'male', age: 'middle', greeting: 'Guten Tag, Koch ist mein Name.', complaint: 'Ich habe plötzlich mein rechtes Auge nicht mehr richtig sehen können.', history: 'Bluthochdruck, Diabetes, raucht, Übergewicht.', category: 'Neurologie' },
  { id: 'm_neuro_2', name: 'Herr Schreiber', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Schreiber mein Name.', complaint: 'Meine Hände zittern immer mehr und ich werde langsamer beim Gehen.', history: 'Keine bekannten Vorerkrankungen, Vater hatte Parkinson.', category: 'Neurologie' },
  { id: 'm_neuro_3', name: 'Herr Berg', gender: 'male', age: 'young', greeting: 'Hallo, Berg ist mein Name.', complaint: 'Ich habe heftige Kopfschmerzen mit Übelkeit und bin lichtempfindlich.', history: 'Migräne in der Familie, viel Stress, wenig Schlaf.', category: 'Neurologie' },
  { id: 'm_neuro_4', name: 'Herr Engel', gender: 'male', age: 'middle', greeting: 'Guten Tag, Engel ist mein Name.', complaint: 'Ich hatte gestern einen Krampfanfall, zum ersten Mal in meinem Leben.', history: 'Keine Vorerkrankungen, wenig Schlaf in letzter Zeit, viel Alkohol am Wochenende.', category: 'Neurologie' },

  // MALE PATIENTS - PNEUMOLOGIE (3)
  { id: 'm_pulmo_1', name: 'Herr Hoffmann', gender: 'male', age: 'elderly', greeting: 'Guten Tag, Hoffmann ist mein Name.', complaint: 'Ich huste seit Monaten und habe dabei manchmal Blut im Auswurf.', history: 'Raucher seit 45 Jahren, COPD, Gewichtsverlust.', category: 'Pneumologie' },
  { id: 'm_pulmo_2', name: 'Herr Kraft', gender: 'male', age: 'middle', greeting: 'Grüß Gott, Kraft mein Name.', complaint: 'Ich bekomme bei der Arbeit schlecht Luft und huste abends viel.', history: 'Arbeitet mit Asbest, Ex-Raucher seit 5 Jahren.', category: 'Pneumologie' },
  { id: 'm_pulmo_3', name: 'Herr Haas', gender: 'male', age: 'young', greeting: 'Hallo, Haas ist mein Name.', complaint: 'Ich habe seit drei Tagen Fieber, Husten und fühle mich sehr schwach.', history: 'Keine Vorerkrankungen, arbeitet im Großraumbüro, Kollegen auch krank.', category: 'Pneumologie' },

  // MALE PATIENTS - HNO (3)
  { id: 'm_hno_1', name: 'Herr Fuchs', gender: 'male', age: 'middle', greeting: 'Guten Tag, Fuchs ist mein Name.', complaint: 'Ich höre auf dem rechten Ohr plötzlich viel schlechter und habe ein Rauschen.', history: 'Viel Stress bei der Arbeit, Bluthochdruck, keine HNO-Vorgeschichte.', category: 'HNO' },
  { id: 'm_hno_2', name: 'Herr Wolf', gender: 'male', age: 'young', greeting: 'Hallo, Wolf ist mein Name.', complaint: 'Ich habe starke Halsschmerzen, Fieber und kann kaum schlucken.', history: 'Keine Vorerkrankungen, letzte Angina vor 2 Jahren.', category: 'HNO' },
  { id: 'm_hno_3', name: 'Herr Schuster', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Schuster mein Name.', complaint: 'Meine Nase ist ständig verstopft und ich schnarche sehr laut.', history: 'Nasenpolypen vor 10 Jahren operiert, Allergie gegen Gräser.', category: 'HNO' },

  // MALE PATIENTS - DERMATOLOGIE (2)
  { id: 'm_derm_1', name: 'Herr Vogel', gender: 'male', age: 'middle', greeting: 'Guten Tag, Vogel ist mein Name.', complaint: 'Ich habe schuppige, rote Stellen an den Ellenbogen und Knien.', history: 'Vater hatte Psoriasis, viel Stress, raucht.', category: 'Dermatologie' },
  { id: 'm_derm_2', name: 'Herr Kunz', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Kunz mein Name.', complaint: 'Ich habe eine Wunde am Bein, die seit Wochen nicht heilt.', history: 'Diabetes seit 20 Jahren, Durchblutungsstörungen, Raucher.', category: 'Dermatologie' },
];

const FREE_FEMALE_IDS = ['f_neuro_1', 'f_kardio_1'];
const FREE_MALE_IDS = ['m_kardio_1', 'm_ortho_1'];
const FREE_CASE_IDS = new Set([...FREE_FEMALE_IDS, ...FREE_MALE_IDS]);

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

function isFreeCaseId(id: string): boolean {
  return FREE_CASE_IDS.has(id);
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
  const { canAccess } = useUser();
  const router = useRouter();
  const isPro = canAccess('pro');
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  
  const elevenLabsMutation = trpc.tts.speakElevenLabs.useMutation();

  useEffect(() => {
    checkPermissions();
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      Speech.stop();
      if (soundRef.current) {
        soundRef.current.stopAsync();
        soundRef.current.unloadAsync();
      }
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
    let scenarios = PATIENT_SCENARIOS;
    if (genderFilter !== 'all') {
      scenarios = scenarios.filter(s => s.gender === genderFilter);
    }
    return scenarios;
  };

  const getAccessibleScenarios = () => {
    if (isPro) return getFilteredScenarios();
    return getFilteredScenarios().filter(s => isFreeCaseId(s.id));
  };

  const startSession = () => {
    setShowSettings(false);
    setPronunciationHint(null);
    
    const accessibleScenarios = getAccessibleScenarios();
    let scenario: PatientScenario;
    
    if (randomMode || !selectedScenarioId) {
      scenario = accessibleScenarios[Math.floor(Math.random() * accessibleScenarios.length)];
    } else {
      scenario = PATIENT_SCENARIOS.find(s => s.id === selectedScenarioId) || accessibleScenarios[0];
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
      
      await speakWithCloudTTS(ttsText, patientGender);
    } catch (error) {
      console.log('[VoiceFSP] Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const speakWithCloudTTS = async (
    text: string,
    patientGender: 'female' | 'male'
  ) => {
    try {
      console.log('[VoiceFSP] Calling ElevenLabs TTS for', patientGender);
      
      const result = await elevenLabsMutation.mutateAsync({
        text,
        gender: patientGender,
        voiceIndex: Math.floor(Math.random() * 3),
      });
      
      console.log(`[VoiceFSP] ElevenLabs response received, voice: ${result.voice}`);
      
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      
      const audioUri = `data:${result.mimeType};base64,${result.audio}`;
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      
      sound.setOnPlaybackStatusUpdate((status: import('expo-av').AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('[VoiceFSP] ElevenLabs playback completed');
          setIsSpeaking(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.log('[VoiceFSP] ElevenLabs TTS error, falling back to expo-speech:', error);
      await speakWithExpoSpeechFallback(text, patientGender);
    }
  };

  const speakWithExpoSpeechFallback = async (
    text: string,
    patientGender: 'female' | 'male'
  ) => {
    try {
      await Speech.stop();
      
      const finalPitch = patientGender === 'female' ? 1.3 : 0.55;
      const finalRate = patientGender === 'female' ? 1.0 : 0.88;
      
      console.log('[VoiceFSP] Fallback expo-speech for', patientGender);
      
      await Speech.speak(text, {
        language: 'de-DE',
        pitch: finalPitch,
        rate: finalRate,
        onDone: () => {
          console.log('[VoiceFSP] Fallback speech completed');
          setIsSpeaking(false);
        },
        onError: (error: Error) => {
          console.log('[VoiceFSP] Fallback speech error:', error);
          setIsSpeaking(false);
        },
        onStopped: () => {
          setIsSpeaking(false);
        },
      });
    } catch (error) {
      console.log('[VoiceFSP] Fallback speech error:', error);
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
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
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
                        const locked = !isPro && !isFreeCaseId(scenario.id);
                        if (locked) {
                          Alert.alert(
                            'Pro Feature',
                            'Upgrade to Pro (€9.99) to unlock all patient cases.',
                            [
                              { text: 'Later', style: 'cancel' },
                              { text: 'Upgrade', onPress: () => router.push('/upgrade') },
                            ]
                          );
                          return;
                        }
                        setSelectedScenarioId(scenario.id);
                        setShowCaseSelector(false);
                      }}
                    >
                      <View style={styles.caseItemLeft}>
                        <View style={[
                          styles.caseAvatar,
                          scenario.gender === 'male' ? styles.caseAvatarMale : styles.caseAvatarFemale,
                          !isPro && !isFreeCaseId(scenario.id) && styles.caseAvatarLocked,
                        ]}>
                          {!isPro && !isFreeCaseId(scenario.id) ? (
                            <Lock color="#fff" size={14} />
                          ) : (
                            <User color="#fff" size={16} />
                          )}
                        </View>
                        <View style={styles.caseItemContent}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[
                              styles.caseItemName,
                              !isPro && !isFreeCaseId(scenario.id) && { color: Colors.dark.textMuted },
                            ]}>{scenario.name}</Text>
                            {!isPro && !isFreeCaseId(scenario.id) && (
                              <View style={styles.proBadge}>
                                <Crown color={Colors.dark.gold} size={10} />
                                <Text style={styles.proBadgeText}>PRO</Text>
                              </View>
                            )}
                          </View>
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
  caseAvatarLocked: {
    backgroundColor: Colors.dark.textMuted,
    opacity: 0.6,
  },
  proBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    backgroundColor: 'rgba(197, 165, 114, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.dark.gold,
    letterSpacing: 0.5,
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
