import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  User,
  Crown,
  Shield,
  Star,
  ChevronRight,
  Settings,
  HelpCircle,
  FileText,
  Bell,
  Mail,
  Trophy,
  Flame,
  Zap,
  Moon,
  Volume2,
  X,
  ExternalLink,
  MessageCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useDocuments } from '@/contexts/DocumentsContext';
import { useGamification } from '@/contexts/GamificationContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { stats } = useDocuments();
  const {
    currentStreak,
    longestStreak,
    totalXP,
    level,
    xpProgress,
    totalSessionsCompleted,
    totalTermsLearned,
    achievements,
    unlockedAchievements,
  } = useGamification();

  const [showSettings, setShowSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const getTierInfo = () => {
    switch (user.tier) {
      case 'vip':
        return {
          label: 'VIP',
          color: Colors.dark.gold,
          icon: Crown,
          description: 'Full access to all features',
        };
      case 'pro':
        return {
          label: 'Pro',
          color: Colors.dark.primary,
          icon: Star,
          description: 'Voice FSP & premium templates',
        };
      default:
        return {
          label: 'Free',
          color: Colors.dark.textSecondary,
          icon: Shield,
          description: 'Basic features included',
        };
    }
  };

  const tierInfo = getTierInfo();
  const TierIcon = tierInfo.icon;

  const handleContact = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('mailto:sunilortho0007@gmail.com?subject=FSP%20App%20Support');
  };

  const handleRateApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Rate the App',
      'Enjoying the app? Your review helps other doctors find us!',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Rate Now', onPress: () => Linking.openURL('https://apps.apple.com') },
      ]
    );
  };

  const handlePrivacy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Privacy Policy',
      'Your data is stored locally on your device. We do not collect or share personal information. Voice recordings are processed securely and not stored.',
      [{ text: 'OK' }]
    );
  };

  const handleTerms = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Terms of Service',
      'This app is for educational purposes only. It does not replace official exam preparation or medical advice. Use at your own discretion.',
      [{ text: 'OK' }]
    );
  };

  const handleFAQ = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Frequently Asked Questions',
      '• How do I practice for FSP?\n→ Go to FSP Practice tab and choose Voice or Text mode.\n\n• How do I get study materials?\n→ Pro subscribers can email sunilortho0007@gmail.com with purchase receipt.\n\n• Which Bundesländer are covered?\n→ All 16 Bundesländer with specific protocols.\n\n• Can I cancel my subscription?\n→ Yes, anytime through App Store settings.',
      [{ text: 'Got it!' }]
    );
  };

  const menuItems = [
    {
      id: 'achievements',
      title: 'Achievements',
      subtitle: `${unlockedAchievements.length} of ${achievements.length} unlocked`,
      icon: Trophy,
      color: Colors.dark.gold,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowAchievements(true);
      },
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Notifications, sound, appearance',
      icon: Settings,
      color: Colors.dark.textSecondary,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowSettings(true);
      },
    },
    {
      id: 'help',
      title: 'Help & FAQ',
      subtitle: 'Common questions answered',
      icon: HelpCircle,
      color: Colors.dark.primary,
      onPress: handleFAQ,
    },
    {
      id: 'contact',
      title: 'Contact Support',
      subtitle: 'sunilortho0007@gmail.com',
      icon: Mail,
      color: Colors.dark.accent,
      onPress: handleContact,
    },
    {
      id: 'rate',
      title: 'Rate the App',
      subtitle: 'Help other doctors find us',
      icon: Star,
      color: Colors.dark.warning,
      onPress: handleRateApp,
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'How we handle your data',
      icon: Shield,
      color: Colors.dark.textMuted,
      onPress: handlePrivacy,
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      subtitle: 'Usage guidelines',
      icon: FileText,
      color: Colors.dark.textMuted,
      onPress: handleTerms,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <User color={Colors.dark.text} size={32} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name || 'Doctor'}</Text>
            <TouchableOpacity 
              style={[styles.tierBadge, { backgroundColor: tierInfo.color + '20' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/upgrade');
              }}
            >
              <TierIcon color={tierInfo.color} size={14} />
              <Text style={[styles.tierLabel, { color: tierInfo.color }]}>
                {tierInfo.label}
              </Text>
              {user.tier === 'free' && (
                <ChevronRight color={tierInfo.color} size={14} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FF6B35' + '20' }]}>
              <Flame color="#FF6B35" size={20} />
            </View>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.dark.gold + '20' }]}>
              <Zap color={Colors.dark.gold} size={20} />
            </View>
            <Text style={styles.statValue}>{totalXP}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.dark.primary + '20' }]}>
              <Trophy color={Colors.dark.primary} size={20} />
            </View>
            <Text style={styles.statValue}>{level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Learning Progress</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>FSP Sessions</Text>
            <Text style={styles.progressValue}>{totalSessionsCompleted}</Text>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Terms Learned</Text>
            <Text style={styles.progressValue}>{totalTermsLearned}</Text>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Documents</Text>
            <Text style={styles.progressValue}>{stats.completed}/{stats.total}</Text>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Longest Streak</Text>
            <Text style={styles.progressValue}>{longestStreak} days</Text>
          </View>
        </View>

        {user.tier === 'free' && (
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
              style={styles.upgradeGradient}
            >
              <Crown color={Colors.dark.gold} size={28} />
              <View style={styles.upgradeText}>
                <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeDescription}>
                  Unlock voice FSP, all templates & premium features
                </Text>
              </View>
              <ChevronRight color={Colors.dark.gold} size={24} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && styles.menuItemLast,
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: item.color + '15' }]}>
                  <IconComponent color={item.color} size={20} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <ChevronRight color={Colors.dark.textMuted} size={20} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>Roadmap to Germany v1.0.0</Text>
          <Text style={styles.copyright}>© 2025 All rights reserved</Text>
        </View>
      </ScrollView>

      <Modal
        visible={showSettings}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <X color={Colors.dark.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Bell color={Colors.dark.primary} size={20} />
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Colors.dark.surfaceLight, true: Colors.dark.primary }}
                thumbColor={Colors.dark.text}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Volume2 color={Colors.dark.accent} size={20} />
                <Text style={styles.settingLabel}>Sound Effects</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: Colors.dark.surfaceLight, true: Colors.dark.primary }}
                thumbColor={Colors.dark.text}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Moon color={Colors.dark.gold} size={20} />
                <Text style={styles.settingLabel}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: Colors.dark.surfaceLight, true: Colors.dark.primary }}
                thumbColor={Colors.dark.text}
              />
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAchievements}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAchievements(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.achievementsModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Achievements</Text>
              <TouchableOpacity onPress={() => setShowAchievements(false)}>
                <X color={Colors.dark.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.achievementsList}>
              {achievements.map((achievement) => (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementItem,
                    !achievement.unlocked && styles.achievementItemLocked,
                  ]}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={[
                      styles.achievementTitle,
                      !achievement.unlocked && styles.achievementTitleLocked,
                    ]}>
                      {achievement.title}
                    </Text>
                    <Text style={styles.achievementDesc}>{achievement.description}</Text>
                    <View style={styles.achievementProgress}>
                      <View style={styles.achievementProgressBar}>
                        <View
                          style={[
                            styles.achievementProgressFill,
                            {
                              width: `${Math.min(100, (achievement.current / achievement.requirement) * 100)}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.achievementProgressText}>
                        {achievement.current}/{achievement.requirement}
                      </Text>
                    </View>
                  </View>
                  {achievement.unlocked && (
                    <View style={styles.achievementUnlocked}>
                      <Star color={Colors.dark.gold} size={16} fill={Colors.dark.gold} />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  profileCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  tierLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  upgradeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  upgradeText: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.dark.gold,
  },
  upgradeDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.dark.text,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  version: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  achievementsModal: {
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  modalButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  achievementsList: {
    maxHeight: 500,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 12,
    marginBottom: 10,
  },
  achievementItemLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  achievementTitleLocked: {
    color: Colors.dark.textMuted,
  },
  achievementDesc: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  achievementProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.dark.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
  },
  achievementProgressText: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  achievementUnlocked: {
    marginLeft: 8,
  },
});
