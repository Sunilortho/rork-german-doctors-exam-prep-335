import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  FileText,
  MessageCircle,
  PenLine,
  Briefcase,
  ChevronRight,
  Lock,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

export default function ToolsScreen() {
  const router = useRouter();
  const { canAccess } = useUser();

  const handleArztbriefCorrector = () => {
    router.push('/arztbrief-corrector');
  };

  const handleSampleView = (sampleId: string, requiredTier: 'free' | 'pro' | 'vip') => {
    if (!canAccess(requiredTier)) {
      router.push('/upgrade');
      return;
    }
    router.push({
      pathname: '/sample-viewer',
      params: { id: sampleId },
    });
  };

  const samples = [
    {
      id: 'arztbrief',
      title: 'Sample Arztbrief',
      description: 'Complete medical discharge letter with FSP structure.',
      icon: FileText,
      requiredTier: 'free' as const,
    },
    {
      id: 'anamnesis',
      title: 'Sample Anamnesis Dialogue',
      description: 'Doctor-patient conversation with proper medical German.',
      icon: MessageCircle,
      requiredTier: 'pro' as const,
    },
    {
      id: 'motivation',
      title: 'Sample Motivation Letter',
      description: 'Professional letter for German medical positions.',
      icon: PenLine,
      requiredTier: 'pro' as const,
    },
    {
      id: 'cv',
      title: 'Sample German CV (Lebenslauf)',
      description: 'Properly formatted German medical CV template.',
      icon: Briefcase,
      requiredTier: 'pro' as const,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <Text style={styles.headerLabel}>Clinical German</Text>
          <Text style={styles.headerTitle}>Arztbrief & examiner-ready outputs</Text>
          <Text style={styles.headerSubtitle}>
            Locked actions always redirect to Upgrade.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.correctorCard}
          onPress={handleArztbriefCorrector}
          activeOpacity={0.8}
        >
          <View style={styles.correctorContent}>
            <Text style={styles.correctorTitle}>Arztbrief Auto-Corrector</Text>
            <Text style={styles.correctorDescription}>
              Paste or upload text and receive corrected, structured German with examiner-style notes.
            </Text>
            <Text style={styles.openLink}>Open</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.samplesCard}
          activeOpacity={1}
        >
          <Text style={styles.samplesTitle}>Samples / Examples</Text>
          <Text style={styles.samplesDescription}>
            Sample Arztbrief, dialogue, patient explanation, examiner feedback.
          </Text>
        </TouchableOpacity>

        <View style={styles.samplesGrid}>
          {samples.map((sample) => {
            const isLocked = !canAccess(sample.requiredTier);
            const IconComponent = sample.icon;

            return (
              <TouchableOpacity
                key={sample.id}
                style={[styles.sampleCard, isLocked && styles.sampleCardLocked]}
                onPress={() => handleSampleView(sample.id, sample.requiredTier)}
                activeOpacity={0.7}
              >
                <View style={styles.sampleIconRow}>
                  <View style={styles.sampleIconContainer}>
                    <IconComponent color={Colors.dark.primary} size={24} />
                  </View>
                  {isLocked && (
                    <View style={styles.lockIndicator}>
                      <Lock color={Colors.dark.gold} size={14} />
                    </View>
                  )}
                </View>
                <Text style={styles.sampleTitle}>{sample.title}</Text>
                <Text style={styles.sampleDescription}>{sample.description}</Text>
                <View style={styles.sampleAction}>
                  <Text style={[styles.sampleActionText, isLocked && styles.sampleActionLocked]}>
                    {isLocked ? 'Unlock' : 'View'}
                  </Text>
                  <ChevronRight
                    color={isLocked ? Colors.dark.gold : Colors.dark.primary}
                    size={16}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
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
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  correctorCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  correctorContent: {},
  correctorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  correctorDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  openLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  samplesCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  samplesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  samplesDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  samplesGrid: {
    gap: 12,
  },
  sampleCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sampleCardLocked: {
    opacity: 0.8,
  },
  sampleIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sampleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(197, 165, 114, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 6,
  },
  sampleDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  sampleAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sampleActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.primary,
    marginRight: 4,
  },
  sampleActionLocked: {
    color: Colors.dark.gold,
  },
});
