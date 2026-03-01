import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  ExternalLink,
  MessageCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    id: '1',
    category: 'Getting Started',
    question: 'Was ist die FSP Vorbereitung App?',
    answer:
      'Die FSP Vorbereitung App ist ein umfassendes Lernwerkzeug für ausländische Ärzte, die sich auf die Fachsprachprüfung (FSP) in Deutschland vorbereiten. Sie bietet Sprachsimulationen mit KI-Patienten, medizinische Begriffe, Arztbrief-Vorlagen und interaktive Übungen.',
  },
  {
    id: '2',
    category: 'Getting Started',
    question: 'Für wen ist diese App gedacht?',
    answer:
      'Die App richtet sich an ausländische Ärztinnen und Ärzte, die ihre medizinische Approbation in Deutschland anstreben und die Fachsprachprüfung (FSP) ablegen möchten. Sie deckt alle wichtigen Kommunikationsbereiche des Ärztealltags ab.',
  },
  {
    id: '3',
    category: 'Voice FSP',
    question: 'Wie funktioniert die Voice FSP Simulation?',
    answer:
      'Die Voice FSP Simulation nutzt fortschrittliche KI-Technologie (ElevenLabs) für realistische Patientenstimmen. Sie wählen einen Fall aus, starten das Gespräch und führen eine vollständige Anamnese durch – genau wie in der echten Prüfung. Nach dem Gespräch erhalten Sie detailliertes Feedback.',
  },
  {
    id: '4',
    category: 'Voice FSP',
    question: 'Welche Unterschiede gibt es zwischen Free und Pro?',
    answer:
      'In der kostenlosen Version können Sie je 2 männliche und 2 weibliche Simulationsfälle üben. Mit Pro (€9,99) erhalten Sie Zugang zu allen Fällen, allen Dokumentvorlagen, dem Arztbrief-Korrektor und allen premium Begriffe.',
  },
  {
    id: '5',
    category: 'Voice FSP',
    question: 'Kann ich die Stimme des Patienten wählen?',
    answer:
      'Ja! Sie können zwischen männlichen und weiblichen Patientenstimmen wählen. Die Stimmen sind speziell für natürliches Deutsch in medizinischen Kontexten optimiert und klingen sehr realistisch.',
  },
  {
    id: '6',
    category: 'Begriffe',
    question: 'Wie viele medizinische Begriffe sind enthalten?',
    answer:
      'Die App enthält über 500 kuratierte medizinische Fachbegriffe auf Deutsch, geordnet nach Kategorien wie Symptome, Diagnosen, Körperteile, Medikamente und mehr. Alle Begriffe sind prüfungsrelevant.',
  },
  {
    id: '7',
    category: 'Begriffe',
    question: 'Gibt es ein Quiz-System für die Begriffe?',
    answer:
      'Ja, Sie können mit dem eingebauten Karteikartensystem lernen. Markieren Sie Begriffe als bekannt oder unbekannt, und die App priorisiert automatisch Begriffe, die Sie noch üben müssen.',
  },
  {
    id: '8',
    category: 'Documents',
    question: 'Welche Dokumentvorlagen sind verfügbar?',
    answer:
      'Die App bietet Vorlagen für alle wichtigen medizinischen Dokumente: Anamnese, Körperliche Untersuchung, Diagnose & Differentialdiagnosen, Aufklärung, Epikrise und Arztbrief. Jede Vorlage enthält typische FSP-Phrasen.',
  },
  {
    id: '9',
    category: 'Documents',
    question: 'Was ist der Arztbrief Auto-Korrektor?',
    answer:
      'Der KI-gestützte Arztbrief-Korrektor analysiert Ihren geschriebenen Arztbrief auf Deutsch und gibt Feedback zu Grammatik, Stil, medizinischer Korrektheit und typischen FSP-Fehlern. Er hilft Ihnen, professionelle Schreibfähigkeiten zu entwickeln.',
  },
  {
    id: '10',
    category: 'Technical',
    question: 'Funktioniert die App offline?',
    answer:
      'Die Begriffe und Dokumentvorlagen sind offline verfügbar. Für die Voice FSP Simulation und den Arztbrief-Korrektor ist eine Internetverbindung erforderlich, da diese KI-Dienste nutzen.',
  },
  {
    id: '11',
    category: 'Technical',
    question: 'Auf welchen Geräten läuft die App?',
    answer:
      'Die App läuft auf Android und iOS Smartphones. Eine optimale Erfahrung erhalten Sie auf aktuellen Geräten (Android 10+ / iOS 14+). Die Web-Version ist ebenfalls verfügbar.',
  },
  {
    id: '12',
    category: 'Account & Billing',
    question: 'Wie kündige ich mein Pro-Abo?',
    answer:
      'Sie können Ihr Pro-Abonnement jederzeit über den Google Play Store oder App Store kündigen. Gehen Sie zu Einstellungen → Abonnements → FSP Vorbereitung → Kündigen. Die Kündigung wird am Ende des aktuellen Abrechnungszeitraums wirksam.',
  },
  {
    id: '13',
    category: 'Account & Billing',
    question: 'Gibt es eine Geld-zurück-Garantie?',
    answer:
      'Ja! Wenn Sie innerhalb der ersten 7 Tage nach dem Kauf nicht zufrieden sind, erstatten wir Ihnen den vollen Betrag. Schreiben Sie uns einfach an hello@medicortex.de.',
  },
];

const categories = ['All', 'Getting Started', 'Voice FSP', 'Begriffe', 'Documents', 'Technical', 'Account & Billing'];

export default function HelpFAQScreen() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = activeCategory === 'All'
    ? faqs
    : faqs.filter(f => f.category === activeCategory);

  const toggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <HelpCircle color={Colors.dark.primary} size={30} />
        </View>
        <Text style={styles.heroTitle}>How can we help?</Text>
        <Text style={styles.heroSubtitle}>Find answers to common questions about the FSP Vorbereitung App</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              activeCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.categoryLabel,
                activeCategory === cat && styles.categoryLabelActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.faqList}>
        {filtered.map((item, index) => {
          const isExpanded = expandedId === item.id;
          const isLast = index === filtered.length - 1;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.faqItem, isLast && styles.faqItemLast]}
              onPress={() => toggle(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                {isExpanded ? (
                  <ChevronUp color={Colors.dark.primary} size={18} />
                ) : (
                  <ChevronDown color={Colors.dark.textMuted} size={18} />
                )}
              </View>
              {isExpanded && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>Still need help?</Text>
        <Text style={styles.contactSubtitle}>Our team is happy to assist you</Text>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => Linking.openURL('mailto:hello@medicortex.de')}
          activeOpacity={0.8}
        >
          <Mail color={Colors.dark.primary} size={20} />
          <Text style={styles.contactButtonText}>hello@medicortex.de</Text>
          <ExternalLink color={Colors.dark.textMuted} size={16} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => Linking.openURL('https://medicortex.de')}
          activeOpacity={0.8}
        >
          <MessageCircle color={Colors.dark.primary} size={20} />
          <Text style={styles.contactButtonText}>medicortex.de</Text>
          <ExternalLink color={Colors.dark.textMuted} size={16} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: `${Colors.dark.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: `${Colors.dark.primary}40`,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  categoryChipActive: {
    backgroundColor: `${Colors.dark.primary}20`,
    borderColor: Colors.dark.primary,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
  },
  categoryLabelActive: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  faqList: {
    marginHorizontal: 20,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    marginBottom: 24,
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  faqItemLast: {
    borderBottomWidth: 0,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    flex: 1,
    lineHeight: 20,
  },
  faqAnswer: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  contactSection: {
    marginHorizontal: 20,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 6,
  },
  contactSubtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    width: '100%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  contactButtonText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: '500',
  },
});
