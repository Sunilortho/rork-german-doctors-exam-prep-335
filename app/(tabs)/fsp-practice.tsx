import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Mic,
  MessageSquare,
  FileText,
  ChevronRight,
  Lock,
  Lightbulb,
  BookOpen,
  Shuffle,
  Sparkles,
  Volume2,
  Mail,
  PenLine,
  Play,
  Target,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useGamification } from '@/contexts/GamificationContext';

export default function FSPPracticeScreen() {
  const router = useRouter();
  const { user, canAccess } = useUser();
  const { totalSessionsCompleted } = useGamification();

  const handleVoiceFSP = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!canAccess('pro')) {
      router.push('/upgrade');
      return;
    }
    router.push('/voice-fsp');
  };

  const handleTextFSP = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/text-fsp');
  };

  const handleArztbrief = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/arztbrief-corrector');
  };

  const handleSampleView = (sampleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!canAccess('pro') && sampleId !== 'arztbrief') {
      router.push('/upgrade');
      return;
    }
    router.push({
      pathname: '/sample-viewer',
      params: { id: sampleId },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>FSP Practice</Text>
          <Text style={styles.subtitle}>
            Simulate the real Fachsprachprüfung exam
          </Text>
          {totalSessionsCompleted > 0 && (
            <View style={styles.sessionsBadge}>
              <Target color={Colors.dark.primary} size={14} />
              <Text style={styles.sessionsText}>{totalSessionsCompleted} sessions completed</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.primaryCard, !canAccess('pro') && styles.lockedCard]}
          onPress={handleVoiceFSP}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canAccess('pro') ? ['#0d2a3a', '#0a1f2d'] : ['#1a1a1a', '#111']}
            style={styles.primaryGradient}
          >
            <View style={styles.primaryCardContent}>
              <View style={styles.cardIconContainer}>
                <Mic color={Colors.dark.primary} size={32} />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardEmoji}>🎙️</Text>
                  <Text style={styles.cardTitle}>Voice FSP Simulation</Text>
                </View>
                <Text style={styles.cardDescription}>
                  Speak like in the real exam: anamnesis, patient explanation, and Arztbrief dictation.
                </Text>
                <View style={styles.featureList}>
                  <View style={styles.featureRow}>
                    <Volume2 color={Colors.dark.accent} size={14} />
                    <Text style={styles.featureItem}>Natural German voices</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Shuffle color={Colors.dark.accent} size={14} />
                    <Text style={styles.featureItem}>24+ medical cases</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Sparkles color={Colors.dark.accent} size={14} />
                    <Text style={styles.featureItem}>Real-time AI feedback</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Lightbulb color={Colors.dark.accent} size={14} />
                    <Text style={styles.featureItem}>Pronunciation hints</Text>
                  </View>
                </View>
                {!canAccess('pro') ? (
                  <View style={styles.lockBadge}>
                    <Lock color={Colors.dark.gold} size={14} />
                    <Text style={styles.lockText}>Pro Feature</Text>
                  </View>
                ) : (
                  <View style={styles.startBadge}>
                    <Play color={Colors.dark.text} size={14} />
                    <Text style={styles.startText}>Start Practice</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryCard}
          onPress={handleTextFSP}
          activeOpacity={0.8}
        >
          <View style={styles.secondaryIconContainer}>
            <MessageSquare color={Colors.dark.textSecondary} size={24} />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardEmoji}>💬</Text>
              <Text style={styles.secondaryTitle}>Text-based Practice</Text>
            </View>
            <Text style={styles.cardDescription}>
              Type your responses and practice structuring your anamnesis.
            </Text>
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>Free for all users</Text>
            </View>
          </View>
          <ChevronRight color={Colors.dark.textMuted} size={22} />
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>Tip:</Text> Start with text mode to learn structure, then move to voice for exam-like practice.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <FileText color={Colors.dark.primary} size={20} />
          <Text style={styles.sectionTitle}>Arztbrief Practice</Text>
        </View>

        <TouchableOpacity
          style={styles.arztbriefCard}
          onPress={handleArztbrief}
          activeOpacity={0.8}
        >
          <View style={styles.arztbriefIconContainer}>
            <PenLine color={Colors.dark.primary} size={24} />
          </View>
          <View style={styles.arztbriefContent}>
            <Text style={styles.arztbriefTitle}>Arztbrief Auto-Corrector</Text>
            <Text style={styles.arztbriefDescription}>
              Paste your Arztbrief and get structured corrections with color-coded mistake highlighting.
            </Text>
            <View style={styles.arztbriefFeatures}>
              <View style={styles.colorIndicator}>
                <View style={[styles.colorDot, { backgroundColor: '#F5A623' }]} />
                <Text style={styles.colorLabel}>First-time mistakes</Text>
              </View>
              <View style={styles.colorIndicator}>
                <View style={[styles.colorDot, { backgroundColor: '#E74C3C' }]} />
                <Text style={styles.colorLabel}>Repeated mistakes</Text>
              </View>
            </View>
          </View>
          <ChevronRight color={Colors.dark.textMuted} size={22} />
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <BookOpen color={Colors.dark.primary} size={20} />
          <Text style={styles.sectionTitle}>Sample Templates</Text>
        </View>

        <View style={styles.samplesGrid}>
          {[
            { id: 'arztbrief', title: 'Sample Arztbrief', icon: FileText, free: true },
            { id: 'anamnesis', title: 'Anamnesis Dialogue', icon: MessageSquare, free: false },
            { id: 'motivation', title: 'Motivation Letter', icon: PenLine, free: false },
          ].map((sample) => {
            const isLocked = !sample.free && !canAccess('pro');
            return (
              <TouchableOpacity
                key={sample.id}
                style={[styles.sampleCard, isLocked && styles.sampleCardLocked]}
                onPress={() => handleSampleView(sample.id)}
                activeOpacity={0.7}
              >
                <View style={styles.sampleIconContainer}>
                  <sample.icon color={Colors.dark.primary} size={20} />
                </View>
                <Text style={styles.sampleTitle}>{sample.title}</Text>
                {isLocked ? (
                  <Lock color={Colors.dark.gold} size={14} />
                ) : (
                  <ChevronRight color={Colors.dark.textMuted} size={16} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.resourcesSection}>
          <View style={styles.sectionHeader}>
            <BookOpen color={Colors.dark.gold} size={20} />
            <Text style={styles.sectionTitle}>FSP Resources</Text>
          </View>

          <View style={styles.resourceCard}>
            <View style={styles.resourceHeader}>
              <Text style={styles.resourceTitle}>Bundesland Exam Protocols</Text>
              <View style={styles.proBadgeSmall}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.resourceDescription}>
              Access official protocols for all 16 Bundesländer FSP exams including Bayern, NRW, Hessen, and more.
            </Text>
          </View>

          <View style={styles.contactCard}>
            <Mail color={Colors.dark.gold} size={22} />
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Get Study Materials</Text>
              <Text style={styles.contactDescription}>
                Pro subscribers can request ebooks and study guides.
              </Text>
              <Text style={styles.contactEmail}>
                Email: sunilortho0007@gmail.com
              </Text>
              <Text style={styles.contactNote}>
                Include your purchase receipt to receive the complete resource pack.
              </Text>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
  sessionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: Colors.dark.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sessionsText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.dark.primary,
  },
  primaryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  lockedCard: {
    borderColor: Colors.dark.border,
  },
  primaryGradient: {
    padding: 20,
  },
  primaryCardContent: {
    flexDirection: 'row',
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardEmoji: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  featureList: {
    marginBottom: 12,
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureItem: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(197, 165, 114, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  lockText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.gold,
  },
  startBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  startText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  secondaryCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  secondaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  freeBadge: {
    marginTop: 6,
  },
  freeText: {
    fontSize: 12,
    color: Colors.dark.accent,
    fontWeight: '500',
  },
  tipCard: {
    backgroundColor: 'rgba(197, 165, 114, 0.1)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    flexDirection: 'row',
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.gold,
  },
  tipEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  tipText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '600',
    color: Colors.dark.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  arztbriefCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 28,
  },
  arztbriefIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.dark.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  arztbriefContent: {
    flex: 1,
    marginRight: 8,
  },
  arztbriefTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  arztbriefDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  arztbriefFeatures: {
    flexDirection: 'row',
    gap: 16,
  },
  colorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  colorLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  samplesGrid: {
    gap: 10,
    marginBottom: 28,
  },
  sampleCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sampleCardLocked: {
    opacity: 0.7,
  },
  sampleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sampleTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.dark.text,
    flex: 1,
  },
  resourcesSection: {
    marginTop: 4,
  },
  resourceCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 12,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  proBadgeSmall: {
    backgroundColor: Colors.dark.primary + '30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  resourceDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 19,
  },
  contactCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.dark.gold + '40',
  },
  contactContent: {
    flex: 1,
    marginLeft: 14,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  contactEmail: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.gold,
    marginBottom: 4,
  },
  contactNote: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    fontStyle: 'italic',
  },
});
