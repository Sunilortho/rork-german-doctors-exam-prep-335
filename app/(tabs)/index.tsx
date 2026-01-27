import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Stethoscope,
  FileText,
  Mic,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Flame,
  Target,
  Trophy,
  Zap,
  BookOpen,
  Star,
  Crown,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useGamification } from '@/contexts/GamificationContext';
import WelcomeModal from '@/components/WelcomeModal';

const { width } = Dimensions.get('window');

export default function RoadmapScreen() {
  const router = useRouter();
  const { user, markWelcomeSeen, canAccess } = useUser();
  const { stats } = useDocuments();
  const {
    currentStreak,
    longestStreak,
    totalXP,
    level,
    xpProgress,
    dailyGoals,
    dailyGoalsCompleted,
    totalDailyGoals,
    unlockedAchievements,
    totalSessionsCompleted,
  } = useGamification();
  const [showWelcome, setShowWelcome] = useState(false);
  
  const streakAnimation = useRef(new Animated.Value(0)).current;
  const xpBarAnimation = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (!user.hasSeenWelcome) {
      setShowWelcome(true);
    }
    
    Animated.parallel([
      Animated.spring(streakAnimation, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(xpBarAnimation, {
        toValue: xpProgress,
        duration: 1000,
        useNativeDriver: false,
      }),
      ...cardAnimations.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: 100 + index * 100,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, [user.hasSeenWelcome, xpProgress]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    markWelcomeSeen();
  };

  const handleCardPress = (route: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (route) {
      router.push(route as any);
    }
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
      color: Colors.dark.primary,
    },
    {
      id: 2,
      title: 'Language Certification',
      description: 'B2 German certificate (Goethe/telc/ÖSD)',
      icon: CheckCircle2,
      status: 'pending',
      progress: 'Required before FSP',
      route: '/documents',
      color: Colors.dark.accent,
    },
    {
      id: 3,
      title: 'Fachsprachprüfung (FSP)',
      description: 'Medical German language examination',
      icon: Mic,
      status: totalSessionsCompleted > 0 ? 'in_progress' : 'pending',
      progress: `${totalSessionsCompleted} sessions completed`,
      route: '/fsp-practice',
      color: Colors.dark.warning,
    },
    {
      id: 4,
      title: 'Approbation Application',
      description: 'Submit to Landesamt for medical license',
      icon: AlertCircle,
      status: 'locked',
      progress: 'After FSP completion',
      route: null,
      color: Colors.dark.textMuted,
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

  const quickActions = [
    {
      id: 'fsp',
      title: 'Practice FSP',
      icon: Mic,
      color: Colors.dark.primary,
      route: '/fsp-practice',
    },
    {
      id: 'begriffe',
      title: 'Learn Terms',
      icon: BookOpen,
      color: Colors.dark.accent,
      route: '/begriffe',
    },
    {
      id: 'documents',
      title: 'Documents',
      icon: FileText,
      color: Colors.dark.warning,
      route: '/documents',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WelcomeModal visible={showWelcome} onClose={handleCloseWelcome} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <View style={styles.logoContainer}>
                <Stethoscope color={Colors.dark.primary} size={26} />
              </View>
              <View style={styles.brandText}>
                <Text style={styles.appName}>Roadmap to Germany</Text>
                <Text style={styles.appNameSub}>for Doctors</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/profile');
              }}
            >
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv.{level}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View 
          style={[
            styles.heroCard,
            {
              transform: [
                { scale: streakAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                })},
              ],
              opacity: streakAnimation,
            },
          ]}
        >
          <LinearGradient
            colors={['#1a3a4a', '#0d1f2d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.streakSection}>
                <View style={styles.streakIconContainer}>
                  <Flame color={currentStreak > 0 ? '#FF6B35' : Colors.dark.textMuted} size={32} />
                </View>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakNumber}>{currentStreak}</Text>
                  <Text style={styles.streakLabel}>Day Streak</Text>
                </View>
                {currentStreak >= longestStreak && currentStreak > 0 && (
                  <View style={styles.bestBadge}>
                    <Star color={Colors.dark.gold} size={12} />
                    <Text style={styles.bestText}>Best!</Text>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.xpSection}>
                <View style={styles.xpHeader}>
                  <Zap color={Colors.dark.gold} size={18} />
                  <Text style={styles.xpLabel}>Level {level}</Text>
                  <Text style={styles.xpTotal}>{totalXP} XP</Text>
                </View>
                <View style={styles.xpBarContainer}>
                  <Animated.View 
                    style={[
                      styles.xpBarFill,
                      {
                        width: xpBarAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]} 
                  />
                </View>
                <Text style={styles.xpNext}>{Math.round(xpProgress * 100)}% to Level {level + 1}</Text>
              </View>
            </View>

            <View style={styles.dailyGoalsSection}>
              <View style={styles.dailyGoalsHeader}>
                <Target color={Colors.dark.primary} size={16} />
                <Text style={styles.dailyGoalsTitle}>Today's Goals</Text>
                <Text style={styles.dailyGoalsCount}>{dailyGoalsCompleted}/{totalDailyGoals}</Text>
              </View>
              <View style={styles.dailyGoalsList}>
                {dailyGoals.map((goal) => (
                  <View key={goal.id} style={styles.goalItem}>
                    <View style={[styles.goalCheck, goal.completed && styles.goalCheckCompleted]}>
                      {goal.completed && <CheckCircle2 color={Colors.dark.success} size={14} />}
                    </View>
                    <Text style={[styles.goalText, goal.completed && styles.goalTextCompleted]}>
                      {goal.title}
                    </Text>
                    <Text style={styles.goalProgress}>{goal.current}/{goal.target}</Text>
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionLabel}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => handleCardPress(action.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <action.icon color={action.color} size={22} />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {unlockedAchievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <View style={styles.achievementsHeader}>
              <Trophy color={Colors.dark.gold} size={18} />
              <Text style={styles.achievementsTitle}>Achievements</Text>
              <Text style={styles.achievementsCount}>{unlockedAchievements.length} unlocked</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsList}
            >
              {unlockedAchievements.slice(0, 5).map((achievement) => (
                <View key={achievement.id} style={styles.achievementBadge}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={styles.achievementName}>{achievement.title}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.sectionTitle}>Your Pathway</Text>

        {roadmapSteps.map((step, index) => (
          <Animated.View
            key={step.id}
            style={{
              opacity: cardAnimations[index],
              transform: [{
                translateY: cardAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }}
          >
            <TouchableOpacity
              style={[
                styles.stepCard,
                step.status === 'locked' && styles.stepCardLocked,
              ]}
              onPress={() => handleCardPress(step.route)}
              disabled={step.status === 'locked'}
              activeOpacity={0.7}
            >
              <View style={[styles.stepNumber, { backgroundColor: step.color + '20' }]}>
                <Text style={[styles.stepNumberText, { color: step.color }]}>{step.id}</Text>
              </View>

              <View style={styles.stepContent}>
                <View style={styles.stepHeader}>
                  <step.icon
                    color={getStatusColor(step.status)}
                    size={18}
                  />
                  <Text style={styles.stepTitle}>{step.title}</Text>
                </View>
                <Text style={styles.stepDescription}>{step.description}</Text>
                <View style={styles.stepProgress}>
                  <Clock color={Colors.dark.textMuted} size={12} />
                  <Text style={styles.stepProgressText}>{step.progress}</Text>
                </View>
              </View>

              {step.route && (
                <ChevronRight color={Colors.dark.textMuted} size={22} />
              )}

              {index < roadmapSteps.length - 1 && (
                <View style={styles.stepConnector} />
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}

        {!canAccess('pro') && (
          <TouchableOpacity 
            style={styles.upgradeCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/upgrade');
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2a1f10', '#1a1308']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeGradient}
            >
              <Crown color={Colors.dark.gold} size={28} />
              <View style={styles.upgradeContent}>
                <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeDescription}>
                  Voice FSP, Arztbrief corrector & all resources
                </Text>
              </View>
              <ChevronRight color={Colors.dark.gold} size={22} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Pro Tip</Text>
          <Text style={styles.tipText}>
            Practice daily to maintain your streak! Consistency is key to passing the FSP exam.
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
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    marginLeft: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  appNameSub: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.primary,
    marginTop: -2,
  },
  profileButton: {
    alignItems: 'center',
  },
  levelBadge: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroGradient: {
    padding: 20,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakInfo: {
    marginLeft: 12,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  streakLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: -2,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.gold + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    gap: 4,
  },
  bestText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.gold,
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.dark.border,
    marginHorizontal: 16,
  },
  xpSection: {
    flex: 1,
  },
  xpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  xpTotal: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginLeft: 'auto',
  },
  xpBarContainer: {
    height: 6,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: Colors.dark.gold,
    borderRadius: 3,
  },
  xpNext: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  dailyGoalsSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 14,
  },
  dailyGoalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dailyGoalsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  dailyGoalsCount: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginLeft: 'auto',
  },
  dailyGoalsList: {
    gap: 8,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalCheckCompleted: {
    borderColor: Colors.dark.success,
    backgroundColor: Colors.dark.success + '20',
  },
  goalText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  goalTextCompleted: {
    color: Colors.dark.success,
    textDecorationLine: 'line-through',
  },
  goalProgress: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.text,
    textAlign: 'center',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  achievementsCount: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginLeft: 'auto',
  },
  achievementsList: {
    gap: 10,
  },
  achievementBadge: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: Colors.dark.gold + '30',
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  achievementName: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
    textAlign: 'center',
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
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  stepDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: 6,
  },
  stepProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepProgressText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  stepConnector: {
    position: 'absolute',
    left: 37,
    bottom: -12,
    width: 2,
    height: 12,
    backgroundColor: Colors.dark.border,
  },
  upgradeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.gold,
  },
  upgradeDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
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
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 19,
  },
});
