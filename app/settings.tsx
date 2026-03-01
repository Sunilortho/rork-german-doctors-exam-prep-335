import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Moon,
  Globe,
  Volume2,
  TextCursor,
  Trash2,
  RefreshCw,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

type TextSizeOption = 'small' | 'medium' | 'large';
type LanguageOption = 'de' | 'en';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [textSize, setTextSize] = useState<TextSizeOption>('medium');
  const [language, setLanguage] = useState<LanguageOption>('de');

  const textSizes: { value: TextSizeOption; label: string }[] = [
    { value: 'small', label: 'S' },
    { value: 'medium', label: 'M' },
    { value: 'large', label: 'L' },
  ];

  const languages: { value: LanguageOption; label: string; full: string }[] = [
    { value: 'de', label: '🇩🇪', full: 'Deutsch' },
    { value: 'en', label: '🇬🇧', full: 'English' },
  ];

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all locally cached data. Your progress will not be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => Alert.alert('Done', 'Cache cleared successfully.'),
        },
      ]
    );
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset All Progress',
      'This will permanently delete all your quiz scores, completed documents, and practice history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => Alert.alert('Reset', 'All progress has been reset.'),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionLabel}>APPEARANCE</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconWrap}>
              <Moon color={Colors.dark.primary} size={18} />
            </View>
            <View>
              <Text style={styles.rowTitle}>Dark Mode</Text>
              <Text style={styles.rowSub}>Easier on eyes at night</Text>
            </View>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: Colors.dark.surfaceLight, true: `${Colors.dark.primary}60` }}
            thumbColor={darkMode ? Colors.dark.primary : Colors.dark.textMuted}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconWrap}>
              <TextCursor color={Colors.dark.primary} size={18} />
            </View>
            <Text style={styles.rowTitle}>Text Size</Text>
          </View>
          <View style={styles.segmented}>
            {textSizes.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.segmentBtn,
                  textSize === opt.value && styles.segmentBtnActive,
                ]}
                onPress={() => setTextSize(opt.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    textSize === opt.value && styles.segmentLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>LANGUAGE</Text>
      <View style={styles.card}>
        {languages.map((lang, index) => {
          const isLast = index === languages.length - 1;
          const isSelected = language === lang.value;
          return (
            <TouchableOpacity
              key={lang.value}
              style={[styles.row, isLast && styles.rowLast]}
              onPress={() => setLanguage(lang.value)}
              activeOpacity={0.8}
            >
              <View style={styles.rowLeft}>
                <View style={styles.iconWrap}>
                  <Globe color={Colors.dark.primary} size={18} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>{lang.full}</Text>
                  <Text style={styles.rowSub}>{lang.label} Interface language</Text>
                </View>
              </View>
              {isSelected && <Check color={Colors.dark.primary} size={20} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>AUDIO</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconWrap}>
              <Volume2 color={Colors.dark.primary} size={18} />
            </View>
            <View>
              <Text style={styles.rowTitle}>Sound Effects</Text>
              <Text style={styles.rowSub}>UI sounds and feedback tones</Text>
            </View>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: Colors.dark.surfaceLight, true: `${Colors.dark.primary}60` }}
            thumbColor={soundEnabled ? Colors.dark.primary : Colors.dark.textMuted}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconWrap}>
              <ChevronRight color={Colors.dark.primary} size={18} />
            </View>
            <View>
              <Text style={styles.rowTitle}>Auto-play Voice</Text>
              <Text style={styles.rowSub}>Start playback automatically</Text>
            </View>
          </View>
          <Switch
            value={autoPlay}
            onValueChange={setAutoPlay}
            trackColor={{ false: Colors.dark.surfaceLight, true: `${Colors.dark.primary}60` }}
            thumbColor={autoPlay ? Colors.dark.primary : Colors.dark.textMuted}
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>DATA & STORAGE</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.row}
          onPress={handleClearCache}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, styles.iconWrapWarning]}>
              <RefreshCw color="#F59E0B" size={18} />
            </View>
            <View>
              <Text style={styles.rowTitle}>Clear Cache</Text>
              <Text style={styles.rowSub}>Free up local storage space</Text>
            </View>
          </View>
          <ChevronRight color={Colors.dark.textMuted} size={18} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.row, styles.rowLast]}
          onPress={handleResetProgress}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, styles.iconWrapDanger]}>
              <Trash2 color="#EF4444" size={18} />
            </View>
            <View>
              <Text style={[styles.rowTitle, styles.dangerText]}>Reset All Progress</Text>
              <Text style={styles.rowSub}>Cannot be undone</Text>
            </View>
          </View>
          <ChevronRight color={Colors.dark.textMuted} size={18} />
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>FSP Vorbereitung v1.0.0 · medicortex.de</Text>
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 20,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: `${Colors.dark.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  iconWrapDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  dangerText: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: Colors.dark.primary,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textMuted,
  },
  segmentLabelActive: {
    color: '#fff',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 32,
  },
});
