import React, { useRef, useEffect } from 'react';
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
  Mic,
  MessageSquare,
  FileText,
  ChevronRight,
  Lightbulb,
  BookOpen,
  Shuffle,
  Sparkles,
  Volume2,
  Mail,
  Zap,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function FSPPracticeScreen() {
  const router = useRouter();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleVoiceFSP = () => {
    router.push('/voice-fsp');
  };

  const handleTextFSP = () => {
    router.push('/text-fsp');
  };

  const handleArztbrief = () => {
    router.push('/arztbrief-corrector');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Fachsprachprüfung Practice</Text>
          <Text style={styles.subtitle}>
            This section simulates the real Fachsprachprüfung.
            Voice-based practice is recommended.
          </Text>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <TouchableOpacity
            style={styles.primaryCard}
            onPress={handleVoiceFSP}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(0, 180, 216, 0.15)', 'rgba(0, 212, 170, 0.08)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.cardIconContainer}>
              <LinearGradient
                colors={[Colors.dark.primary, Colors.dark.accent]}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Mic color="#FFFFFF" size={28} />
              </LinearGradient>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardTitleRow}>
                <Zap color={Colors.dark.primary} size={18} />
                <Text style={styles.cardTitle}>Voice-based FSP Simulation</Text>
              </View>
              <Text style={styles.cardDescription}>
                Speak like in the real exam: anamnesis, patient explanation, and Arztbrief dictation.
              </Text>
              <View style={styles.featureList}>
                <View style={styles.featureRow}>
                  <Volume2 color={Colors.dark.accent} size={14} />
                  <Text style={styles.featureItem}>High-quality natural voices</Text>
                </View>
                <View style={styles.featureRow}>
                  <Shuffle color={Colors.dark.accent} size={14} />
                  <Text style={styles.featureItem}>Choose cases or random mode</Text>
                </View>
                <View style={styles.featureRow}>
                  <Sparkles color={Colors.dark.accent} size={14} />
                  <Text style={styles.featureItem}>Real-time pronunciation hints</Text>
                </View>
                <View style={styles.featureRow}>
                  <Lightbulb color={Colors.dark.accent} size={14} />
                  <Text style={styles.featureItem}>AI feedback on articulation</Text>
                </View>
              </View>
              <View style={styles.recommendedBadge}>
                <Sparkles color={Colors.dark.accent} size={12} />
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

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
              <Text style={styles.secondaryTitle}>Text-based FSP Practice</Text>
            </View>
            <Text style={styles.cardDescription}>
              Type your responses and practice structuring your anamnesis.
            </Text>
            <Text style={styles.availableText}>Available for all users</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={styles.tipText}>
            Tip: Voice practice is the closest simulation to the actual FSP exam. 
            Start with text mode to learn structure, then move to voice.
          </Text>
        </View>

        <View style={styles.arztbriefSection}>
          <Text style={styles.sectionTitle}>Arztbrief Practice</Text>
          <TouchableOpacity
            style={styles.arztbriefCard}
            onPress={handleArztbrief}
            activeOpacity={0.8}
          >
            <FileText color={Colors.dark.primary} size={24} />
            <View style={styles.arztbriefContent}>
              <Text style={styles.arztbriefTitle}>Arztbrief Auto-Corrector</Text>
              <Text style={styles.arztbriefDescription}>
                Paste your Arztbrief and receive structured corrections with color-coded mistake highlighting.
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
            <ChevronRight color={Colors.dark.textMuted} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.resourcesSection}>
          <Text style={styles.sectionTitle}>FSP Resources</Text>
          <View style={styles.resourceCard}>
            <BookOpen color={Colors.dark.primary} size={24} />
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Bundesland Exam Protocols</Text>
              <Text style={styles.resourceDescription}>
                Access ebooks and official protocols for all 16 Bundesländer FSP exams.
              </Text>
              <View style={styles.bundeslandList}>
                <Text style={styles.bundeslandItem}>• Bayern, Baden-Württemberg, NRW</Text>
                <Text style={styles.bundeslandItem}>• Hessen, Niedersachsen, Sachsen</Text>
                <Text style={styles.bundeslandItem}>• Berlin, Hamburg, and more...</Text>
              </View>
              <View style={styles.resourceBadge}>
                <Text style={styles.resourceBadgeText}>Included with Pro</Text>
              </View>
            </View>
          </View>

          <View style={styles.resourceRequestCard}>
            <Mail color={Colors.dark.gold} size={22} />
            <View style={styles.resourceRequestContent}>
              <Text style={styles.resourceRequestTitle}>Get Study Materials</Text>
              <Text style={styles.resourceRequestDescription}>
                Pro subscribers can request ebooks, protocols, and study guides.
              </Text>
              <Text style={styles.resourceRequestEmail}>
                After purchase, email: sunilortho0007@gmail.com
              </Text>
              <Text style={styles.resourceRequestNote}>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
  primaryCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardIconContainer: {
    marginRight: 16,
  },
  iconGradient: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardEmoji: {
    fontSize: 18,
    marginRight: 8,
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
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.accent,
  },
  secondaryCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    flexDirection: 'row',
  },
  secondaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  secondaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  availableText: {
    fontSize: 12,
    color: Colors.dark.accent,
    marginTop: 4,
  },
  tipCard: {
    backgroundColor: 'rgba(197, 165, 114, 0.1)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    flexDirection: 'row',
    borderLeftWidth: 4,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  arztbriefSection: {
    marginTop: 8,
  },
  arztbriefCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  arztbriefContent: {
    flex: 1,
    marginLeft: 12,
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
  },
  arztbriefFeatures: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
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
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  resourcesSection: {
    marginTop: 24,
  },
  resourceCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  resourceContent: {
    flex: 1,
    marginLeft: 12,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  bundeslandList: {
    marginBottom: 10,
  },
  bundeslandItem: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginBottom: 2,
  },
  resourceBadge: {
    backgroundColor: Colors.dark.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  resourceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  resourceRequestCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.dark.gold + '40',
    marginTop: 12,
  },
  resourceRequestContent: {
    flex: 1,
    marginLeft: 12,
  },
  resourceRequestTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  resourceRequestDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  resourceRequestEmail: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.gold,
    marginBottom: 4,
  },
  resourceRequestNote: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    fontStyle: 'italic',
  },
});
