import React, { useState, useEffect, useRef } from 'react';
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
import {
  Stethoscope,
  FileText,
  Mic,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  TrendingUp,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useDocuments } from '@/contexts/DocumentsContext';
import WelcomeModal from '@/components/WelcomeModal';



export default function RoadmapScreen() {
  const router = useRouter();
  const { user, markWelcomeSeen } = useUser();
  const { stats } = useDocuments();
  const [showWelcome, setShowWelcome] = useState(false);
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (!user.hasSeenWelcome) {
      setShowWelcome(true);
    }
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    const progress = stats.total > 0 ? (stats.completed / stats.total) : 0;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [user.hasSeenWelcome, stats.completed, stats.total]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    markWelcomeSeen();
  };

  const progressPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const roadmapSteps = [
    {
      id: 1,
      title: 'Document Preparation',
      description: 'Gather and verify all required documents',
      icon: FileText,
      status: stats.completed > 0 ? 'in_progress' : 'pending',
      progress: `${stats.completed}/${stats.total} completed`,
      route: '/documents',
      gradient: ['#0077B6', '#00B4D8'] as const,
    },
    {
      id: 2,
      title: 'Language Certification',
      description: 'B2 German certificate (Goethe/telc/ÖSD)',
      icon: CheckCircle2,
      status: 'pending',
      progress: 'Required before FSP',
      route: '/documents',
      gradient: ['#00B4D8', '#00D4AA'] as const,
    },
    {
      id: 3,
      title: 'Fachsprachprüfung (FSP)',
      description: 'Medical German language examination',
      icon: Mic,
      status: 'pending',
      progress: 'Practice available',
      route: '/fsp-practice',
      gradient: ['#00D4AA', '#27AE60'] as const,
    },
    {
      id: 4,
      title: 'Approbation Application',
      description: 'Submit to Landesamt for medical license',
      icon: AlertCircle,
      status: 'locked',
      progress: 'After FSP completion',
      route: null,
      gradient: ['#C5A572', '#D4B896'] as const,
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

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WelcomeModal visible={showWelcome} onClose={handleCloseWelcome} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={['rgba(0, 180, 216, 0.12)', 'rgba(0, 212, 170, 0.08)', 'transparent']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.brandRow}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[Colors.dark.primary, Colors.dark.accent]}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Stethoscope color="#FFFFFF" size={28} />
              </LinearGradient>
            </View>
            <View style={styles.brandText}>
              <Text style={styles.appName}>Roadmap to Germany</Text>
              <Text style={styles.appNameSub}>for Doctors</Text>
            </View>
          </View>
          <Text style={styles.tagline}>
            From documents to Fachsprachprüfung — structured, examiner-ready.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
          <View style={styles.statsHeader}>
            <View style={styles.statsHeaderLeft}>
              <TrendingUp color={Colors.dark.accent} size={18} />
              <Text style={styles.statsTitle}>Your Progress</Text>
            </View>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>{progressPercentage}%</Text>
            </View>
          </View>
          
          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
              <LinearGradient
                colors={[Colors.dark.primary, Colors.dark.accent]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
          
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
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Award color={Colors.dark.gold} size={20} />
          <Text style={styles.sectionTitle}>Your Pathway</Text>
        </View>

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
            <View style={styles.stepNumberContainer}>
              <LinearGradient
                colors={step.status === 'locked' ? ['#3A4A5A', '#2A3A4A'] : step.gradient}
                style={styles.stepNumber}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.stepNumberText}>{step.id}</Text>
              </LinearGradient>
              {index < roadmapSteps.length - 1 && (
                <View style={styles.stepConnector} />
              )}
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
              <View style={styles.chevronContainer}>
                <ChevronRight color={Colors.dark.textMuted} size={22} />
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.tipCard}>
          <LinearGradient
            colors={['rgba(197, 165, 114, 0.15)', 'rgba(197, 165, 114, 0.05)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.tipTitle}>💡 Pro Tip</Text>
          <Text style={styles.tipText}>
            Start with document preparation while practicing for FSP. 
            Many doctors underestimate the time needed for translations and apostilles.
          </Text>
        </View>
        
        <View style={styles.bottomSpacing} />
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
    position: 'relative',
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  logoContainer: {
    marginRight: 14,
  },
  logoGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandText: {
    flex: 1,
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  percentageBadge: {
    backgroundColor: Colors.dark.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.accent,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
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
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.text,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  stepCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  stepCardLocked: {
    opacity: 0.6,
  },
  stepNumberContainer: {
    alignItems: 'center',
    marginRight: 14,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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
    width: 2,
    height: 20,
    backgroundColor: Colors.dark.border,
    marginTop: 8,
  },
  chevronContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipCard: {
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.gold,
    overflow: 'hidden',
    position: 'relative',
  },
  bottomSpacing: {
    height: 20,
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
