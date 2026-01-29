import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Stethoscope,
  FileText,
  Mic,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useDemo } from '@/contexts/DemoContext';
import WelcomeModal from '@/components/WelcomeModal';

const { width } = Dimensions.get('window');

export default function RoadmapScreen() {
  const router = useRouter();
  const { user, markWelcomeSeen } = useUser();
  const { stats } = useDocuments();
  const { formattedTimeRemaining } = useDemo();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!user.hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, [user.hasSeenWelcome]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    markWelcomeSeen();
  };

  const roadmapSteps = [
    {
      id: 1,
      title: 'Document Preparation',
      description: 'Gather and verify all required documents',
      icon: FileText,
      status: stats.completed > 0 ? 'in_progress' : 'pending',
      progress: `${stats.completed}/${stats.total} completed`,
      route: '/documents',
    },
    {
      id: 2,
      title: 'Language Certification',
      description: 'B2 German certificate (Goethe/telc/ÖSD)',
      icon: CheckCircle2,
      status: 'pending',
      progress: 'Required before FSP',
      route: '/documents',
    },
    {
      id: 3,
      title: 'Fachsprachprüfung (FSP)',
      description: 'Medical German language examination',
      icon: Mic,
      status: 'pending',
      progress: 'Practice available',
      route: '/fsp-practice',
    },
    {
      id: 4,
      title: 'Approbation Application',
      description: 'Submit to Landesamt for medical license',
      icon: AlertCircle,
      status: 'locked',
      progress: 'After FSP completion',
      route: null,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return Colors.dark.success;
      case 'in_progress':
        return Colors.dark.primary;
      case 'pending':
        return Colors.dark.warning;
      default:
        return Colors.dark.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WelcomeModal visible={showWelcome} onClose={handleCloseWelcome} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.demoBanner}>
          <View style={styles.demoBannerLeft}>
            <Sparkles color="#FFD700" size={18} />
            <Text style={styles.demoBannerText}>DEMO VERSION</Text>
          </View>
          <View style={styles.demoBannerRight}>
            <Clock color="#FFD700" size={14} />
            <Text style={styles.demoBannerTime}>{formattedTimeRemaining}</Text>
          </View>
        </View>

        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Stethoscope color={Colors.dark.primary} size={32} />
            <View style={styles.brandText}>
              <Text style={styles.appName}>Roadmap to Germany</Text>
              <Text style={styles.appNameSub}>for Doctors</Text>
            </View>
          </View>
          <Text style={styles.tagline}>
            From documents to Fachsprachprüfung — structured, examiner-ready.
          </Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.inProgress}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total - stats.completed - stats.inProgress}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Pathway</Text>

        {roadmapSteps.map((step, index) => (
          <TouchableOpacity
            key={step.id}
            style={[
              styles.stepCard,
              step.status === 'locked' && styles.stepCardLocked,
            ]}
            onPress={() => step.route && router.push(step.route as any)}
            disabled={step.status === 'locked'}
            activeOpacity={0.7}
          >
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{step.id}</Text>
            </View>

            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <step.icon
                  color={getStatusColor(step.status)}
                  size={20}
                />
                <Text style={styles.stepTitle}>{step.title}</Text>
              </View>
              <Text style={styles.stepDescription}>{step.description}</Text>
              <View style={styles.stepProgress}>
                <Clock color={Colors.dark.textMuted} size={14} />
                <Text style={styles.stepProgressText}>{step.progress}</Text>
              </View>
            </View>

            {step.route && (
              <ChevronRight color={Colors.dark.textMuted} size={24} />
            )}

            {index < roadmapSteps.length - 1 && (
              <View style={styles.stepConnector} />
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Pro Tip</Text>
          <Text style={styles.tipText}>
            Start with document preparation while practicing for FSP. 
            Many doctors underestimate the time needed for translations and apostilles.
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  demoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  demoBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demoBannerText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFD700',
    letterSpacing: 1,
  },
  demoBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoBannerTime: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  header: {
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandText: {
    marginLeft: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  appNameSub: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.dark.primary,
    marginTop: -2,
  },
  tagline: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.dark.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  stepCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    position: 'relative',
  },
  stepCardLocked: {
    opacity: 0.5,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginLeft: 8,
  },
  stepDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: 6,
  },
  stepProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepProgressText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginLeft: 6,
  },
  stepConnector: {
    position: 'absolute',
    left: 35,
    bottom: -12,
    width: 2,
    height: 12,
    backgroundColor: Colors.dark.border,
  },
  tipCard: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
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
});
