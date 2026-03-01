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
  User,
  Crown,
  Shield,
  Star,
  ChevronRight,
  Settings,
  HelpCircle,
  FileText,
  Bell,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useDocuments } from '@/contexts/DocumentsContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { stats } = useDocuments();

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

  const menuItems = [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      onPress: () => router.push('/notifications'),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      onPress: () => router.push('/settings'),
    },
    {
      id: 'help',
      title: 'Help & FAQ',
      icon: HelpCircle,
      onPress: () => router.push('/help-faq'),
    },
    {
      id: 'terms',
      title: 'Terms & Privacy',
      icon: FileText,
      onPress: () => router.push('/terms-privacy'),
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
            <View style={styles.tierBadge}>
              <TierIcon color={tierInfo.color} size={14} />
              <Text style={[styles.tierLabel, { color: tierInfo.color }]}>
                {tierInfo.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Document Progress</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(stats.completed / stats.total) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {stats.completed} of {stats.total} documents completed
            </Text>
            <Text style={styles.statsPercent}>
              {Math.round((stats.completed / stats.total) * 100)}%
            </Text>
          </View>
        </View>

        {user.tier === 'free' && (
          <TouchableOpacity
            style={styles.upgradeCard}
            onPress={() => router.push('/upgrade')}
            activeOpacity={0.8}
          >
            <View style={styles.upgradeContent}>
              <View style={styles.upgradeIconContainer}>
                <Crown color={Colors.dark.gold} size={28} />
              </View>
              <View style={styles.upgradeText}>
                <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeDescription}>
                  Unlock voice FSP, all templates, and premium features
                </Text>
              </View>
            </View>
            <ChevronRight color={Colors.dark.gold} size={24} />
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
                <View style={styles.menuIconContainer}>
                  <IconComponent color={Colors.dark.textSecondary} size={20} />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
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
    backgroundColor: Colors.dark.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  tierLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  statsPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  upgradeCard: {
    backgroundColor: 'rgba(197, 165, 114, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.gold,
  },
  upgradeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(197, 165, 114, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  upgradeText: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.gold,
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: Colors.dark.text,
    flex: 1,
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
});
