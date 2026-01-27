import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Copy, FileText } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';

const SAMPLES: Record<string, { title: string; content: string }> = {
  arztbrief: {
    title: 'Sample Arztbrief',
    content: `ARZTBRIEF

Patient: Frau Maria Schmidt, geb. 15.03.1978
Aufnahmedatum: 10.01.2025
Entlassungsdatum: 14.01.2025

DIAGNOSEN:
1. Akute Appendizitis
2. Arterielle Hypertonie (vorbekannt)

ANAMNESE:
Die 46-jährige Patientin stellte sich mit seit 2 Tagen bestehenden rechtsseitigen Unterbauchschmerzen vor. Initial waren die Schmerzen periumbilikal lokalisiert und wanderten dann in den rechten Unterbauch. Begleitend bestanden Übelkeit und einmaliges Erbrechen. Fieber bis 38,5°C. Keine Miktionsbeschwerden. Letzte Regelblutung vor 2 Wochen.

Vorerkrankungen: Arterielle Hypertonie seit 5 Jahren, Appendektomie-negativ.
Dauermedikation: Ramipril 5mg 1-0-0

KÖRPERLICHER BEFUND:
Allgemeinzustand: reduziert, Ernährungszustand: normal
Abdomen: Druckschmerz im rechten Unterbauch, positives McBurney-Zeichen, positives Loslassschmerz, Darmgeräusche vermindert
Temperatur: 38,2°C

LABOR:
Leukozyten: 14.500/µl (erhöht)
CRP: 85 mg/l (erhöht)
Weitere Laborwerte im Normbereich

BILDGEBUNG:
Sonographie Abdomen: Kokarde im rechten Unterbauch, Wandverdickung der Appendix auf 12mm, freie Flüssigkeit periappendizeal.

THERAPIE UND VERLAUF:
Nach Diagnosesicherung erfolgte am Aufnahmetag die laparoskopische Appendektomie. Der intraoperative Befund zeigte eine gangränöse Appendizitis ohne Perforation. Der postoperative Verlauf gestaltete sich komplikationslos. Die Patientin wurde unter oraler Kost und mit reizlosen Wundverhältnissen entlassen.

PROCEDERE:
- Körperliche Schonung für 2 Wochen
- Wundkontrolle beim Hausarzt in 5 Tagen
- Fadenzug am 10. postoperativen Tag
- Wiedervorstellung bei Fieber, Wundrötung oder zunehmenden Schmerzen

MEDIKATION BEI ENTLASSUNG:
1. Ramipril 5mg 1-0-0 (Vormedikation)
2. Ibuprofen 400mg bei Bedarf, max. 3x täglich

Mit freundlichen kollegialen Grüßen

Dr. med. Thomas Weber
Facharzt für Allgemeinchirurgie`,
  },
  anamnesis: {
    title: 'Sample Anamnesis Dialogue',
    content: `ANAMNESE-GESPRÄCH (FSP-Muster)

ARZT: Guten Tag, Frau Müller. Mein Name ist Dr. Schmidt, ich bin heute Ihr behandelnder Arzt. Wie kann ich Ihnen helfen?

PATIENTIN: Guten Tag, Herr Doktor. Ich habe seit drei Tagen starke Kopfschmerzen.

ARZT: Das tut mir leid zu hören. Können Sie mir die Kopfschmerzen genauer beschreiben? Wo genau tut es weh?

PATIENTIN: Hauptsächlich hier vorne an der Stirn, aber manchmal auch an den Schläfen.

ARZT: Wie würden Sie den Schmerz beschreiben? Ist er eher pochend, drückend oder stechend?

PATIENTIN: Er ist eher drückend, wie ein Band um den Kopf.

ARZT: Auf einer Skala von 1 bis 10, wobei 10 der stärkste vorstellbare Schmerz ist, wie stark sind die Schmerzen?

PATIENTIN: Ich würde sagen etwa 7.

ARZT: Haben Sie bemerkt, ob etwas die Schmerzen verstärkt oder lindert?

PATIENTIN: Sie werden schlimmer, wenn ich am Computer arbeite. Ruhe hilft ein bisschen.

ARZT: Haben Sie noch andere Beschwerden, zum Beispiel Übelkeit, Sehstörungen oder Lichtempfindlichkeit?

PATIENTIN: Ja, mir ist manchmal übel und grelles Licht stört mich.

ARZT: Hatten Sie solche Kopfschmerzen schon früher? Leidet jemand in Ihrer Familie an Migräne?

PATIENTIN: Meine Mutter hat oft Migräne. Bei mir ist das neu.

ARZT: Welche Medikamente nehmen Sie regelmäßig ein?

PATIENTIN: Nur die Pille zur Verhütung.

ARZT: Haben Sie Allergien gegen Medikamente oder andere Stoffe?

PATIENTIN: Nein, keine bekannten Allergien.

ARZT: Rauchen Sie oder trinken Sie Alkohol?

PATIENTIN: Ich rauche nicht, ab und zu ein Glas Wein.

ARZT: Vielen Dank für die ausführlichen Informationen. Ich möchte Sie jetzt gerne untersuchen.

---
ZUSAMMENFASSUNG:
46-jährige Patientin mit seit 3 Tagen bestehenden Spannungskopfschmerzen, frontotemporal lokalisiert, drückender Charakter, Schmerzintensität 7/10, begleitet von Übelkeit und Photophobie. Positive Familienanamnese für Migräne. Dauermedikation: orale Kontrazeption. Keine Allergien bekannt.`,
  },
  motivation: {
    title: 'Sample Motivation Letter',
    content: `MOTIVATIONSSCHREIBEN

Dr. med. [Ihr Name]
[Ihre Adresse]
[PLZ Stadt]
[E-Mail]
[Telefon]

An das
[Krankenhaus Name]
Personalabteilung
[Adresse]
[PLZ Stadt]

[Datum]

Betreff: Bewerbung als Assistenzarzt/Assistenzärztin in der Inneren Medizin

Sehr geehrte Damen und Herren,

mit großem Interesse bewerbe ich mich um eine Stelle als Assistenzarzt in der Abteilung für Innere Medizin an Ihrem Krankenhaus.

Nach meinem Medizinstudium an der [Universität] in [Land] und meiner Approbation als Arzt habe ich [X] Jahre klinische Erfahrung in der Inneren Medizin gesammelt. Während dieser Zeit konnte ich fundierte Kenntnisse in der Diagnostik und Behandlung internistischer Erkrankungen erwerben.

Mein Entschluss, meine ärztliche Karriere in Deutschland fortzusetzen, basiert auf meinem Wunsch, in einem Gesundheitssystem zu arbeiten, das für seine hohen Standards und fortschrittlichen Behandlungsmethoden bekannt ist. Die deutsche Facharztausbildung bietet mir die Möglichkeit, meine medizinischen Fähigkeiten weiter zu vertiefen.

Ihre Klinik hat mich besonders angesprochen, weil:
- Sie über eine ausgezeichnete Weiterbildungsermächtigung verfügen
- Sie moderne diagnostische und therapeutische Verfahren anwenden
- Sie einen guten Ruf für die Ausbildung junger Ärzte haben

Ich bringe mit:
- Abgeschlossenes Medizinstudium und ärztliche Approbation
- [X] Jahre Berufserfahrung in der Inneren Medizin
- Fachsprachprüfung (FSP) erfolgreich bestanden
- Deutschkenntnisse auf C1-Niveau
- Hohe Motivation und Lernbereitschaft
- Teamfähigkeit und Belastbarkeit

Über die Möglichkeit, mich persönlich bei Ihnen vorzustellen, würde ich mich sehr freuen.

Mit freundlichen Grüßen

[Unterschrift]
Dr. med. [Ihr Name]

Anlagen:
- Lebenslauf
- Zeugnisse und Zertifikate
- Approbationsurkunde
- Sprachzertifikate`,
  },
  cv: {
    title: 'Sample German CV (Lebenslauf)',
    content: `LEBENSLAUF

PERSÖNLICHE DATEN
Name:                Dr. med. [Vorname Nachname]
Geburtsdatum:        [TT.MM.JJJJ]
Geburtsort:          [Stadt, Land]
Staatsangehörigkeit: [Land]
Familienstand:       [ledig/verheiratet]
Adresse:             [Straße, PLZ Stadt]
Telefon:             [+49 XXX XXXXXXX]
E-Mail:              [email@example.com]

BERUFLICHER WERDEGANG

[MM/JJJJ - MM/JJJJ]
Assistenzarzt Innere Medizin
[Krankenhaus Name], [Stadt, Land]
- Stationäre Patientenversorgung
- Durchführung von Aufnahmeuntersuchungen
- Teilnahme am Bereitschaftsdienst
- Erstellung von Arztbriefen

[MM/JJJJ - MM/JJJJ]
Assistenzarzt Allgemeinmedizin
[Krankenhaus Name], [Stadt, Land]
- Notaufnahme und Akutversorgung
- Ambulante Patientenbetreuung

AUSBILDUNG

[MM/JJJJ - MM/JJJJ]
Studium der Humanmedizin
[Universität Name], [Stadt, Land]
Abschluss: Dr. med. / MBBS
Note: [Note]

[MM/JJJJ - MM/JJJJ]
Gymnasium
[Schule Name], [Stadt]
Abschluss: Abitur/Hochschulreife

SPRACHKENNTNISSE
Deutsch:    C1 (Goethe-Zertifikat)
            Fachsprachprüfung (FSP) bestanden
Englisch:   fließend
[Muttersprache]: Muttersprache

ZUSATZQUALIFIKATIONEN
- ACLS (Advanced Cardiovascular Life Support)
- Sonographie-Grundkurs
- EKG-Kurs

WEITERE KENNTNISSE
EDV: Microsoft Office, Krankenhausinformationssysteme
Führerschein: Klasse B

INTERESSEN
Medizinische Fortbildung, Reisen, Sport

[Ort], den [Datum]

[Unterschrift]`,
  },
};

export default function SampleViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sample = id ? SAMPLES[id] : null;

  const handleCopy = async () => {
    if (sample) {
      await Clipboard.setStringAsync(sample.content);
      Alert.alert('Kopiert', 'Der Text wurde in die Zwischenablage kopiert.');
    }
  };

  if (!sample) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Sample nicht gefunden</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <FileText color={Colors.dark.primary} size={24} />
          <Text style={styles.title}>{sample.title}</Text>
        </View>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
          <Copy color={Colors.dark.primary} size={18} />
          <Text style={styles.copyText}>Copy</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sampleCard}>
          <Text style={styles.sampleText}>{sample.content}</Text>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Hinweis</Text>
          <Text style={styles.tipText}>
            Dieses Muster dient als Referenz. Passen Sie es an Ihre persönlichen
            Daten und den spezifischen Kontext an.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  copyText: {
    fontSize: 13,
    color: Colors.dark.primary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sampleCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 20,
  },
  sampleText: {
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 22,
    fontFamily: 'monospace',
  },
  tipCard: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.gold,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.gold,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
});
