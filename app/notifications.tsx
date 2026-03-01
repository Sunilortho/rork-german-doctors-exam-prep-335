import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Bell, BellOff, Volume2, MessageSquare, Star, BookOpen } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  enabled: boolean;
}

export default function NotificationsScreen() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'daily_reminder',
      title: 'Daily Study Reminder',
      description: 'Get reminded to practice your FSP each day',
      icon: Bell,
      enabled: true,
    },
    {
      id: 'voice_tips',
      title: 'Voice Practice Tips',
      description: 'Helpful tips for improving your spoken German',
      icon: Volume2,
      enabled: true,
    },
    {
      id: 'new_cases',
      title: 'New Cases Available',
      description: 'Be notified when new simulation cases are added',
      icon: MessageSquare,
      enabled: false,
    },
    {
      id: 'progress_updates',
      title: 'Progress Updates',
      description: 'Weekly summary of your learning progress',
      icon: Star,
      enabled: true,
    },
    {
      id: 'new_content',
      title: 'New Study Content',
      description: 'Alerts for new Begriffe and documents added',
      icon: BookOpen,
      enabled: false,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(prev =>
      prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const allEnabled = settings.every(s => s.enabled);

  const toggleAll = () => {
    const next = !allEnabled;
    setSettings(prev => prev.map(s => ({ ...s, enabled: next })));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroSection}>
        <View style={styles.heroIconContainer}>
          <Bell color={Colors.dark.primary} size={32} />
        </View>
        <Text style={styles.heroTitle}>Stay on Track</Text>
        <Text style={styles.heroSubtitle}>
          Manage how and when we remind you to study
        </Text>
      </View>

      <TouchableOpacity style={styles.masterToggle} onPress={toggleAll} activeOpacity={0.8}>
        <View style={styles.masterLeft}>
          {allEnabled ? (
            <Bell color={Colors.dark.primary} size={20} />
          ) : (
            <BellOff color={Colors.dark.textSecondary} size={20} />
          )}
          <Text style={styles.masterTitle}>
            {allEnabled ? 'All notifications on' : 'Enable all notifications'}
          </Text>
        </View>
        <Switch
          value={allEnabled}
          onValueChange={toggleAll}
          trackColor={{ false: Colors.dark.surfaceLight, true: `${Colors.dark.primary}60` }}
          thumbColor={allEnabled ? Colors.dark.primary : Colors.dark.textMuted}
        />
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>NOTIFICATION TYPES</Text>

      <View style={styles.settingsList}>
        {settings.map((item, index) => {
          const IconComponent = item.icon;
          const isLast = index === settings.length - 1;
          return (
            <View
              key={item.id}
              style={[styles.settingItem, isLast && styles.settingItemLast]}
            >
              <View style={[styles.settingIcon, item.enabled && styles.settingIconActive]}>
                <IconComponent
                  color={item.enabled ? Colors.dark.primary : Colors.dark.textMuted}
                  size={18}
                />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingDescription}>{item.description}</Text>
              </View>
              <Switch
                value={item.enabled}
                onValueChange={() => toggleSetting(item.id)}
                trackColor={{ false: Colors.dark.surfaceLight, true: `${Colors.dark.primary}60` }}
                thumbColor={item.enabled ? Colors.dark.primary : Colors.dark.textMuted}
              />
            </View>
          );
        })}
      </View>

      <Text style={styles.footerNote}>
        You can change these settings at any time. Notifications help you stay consistent with your FSP preparation.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${Colors.dark.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  masterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  masterTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.textMuted,
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsList: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: 12,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingIconActive: {
    backgroundColor: `${Colors.dark.primary}20`,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.dark.text,
    marginBottom: 3,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    lineHeight: 16,
  },
  footerNote: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
