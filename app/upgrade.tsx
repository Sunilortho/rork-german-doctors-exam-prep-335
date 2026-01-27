import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Crown,
  Check,
  Mic,
  FileText,
  MessageSquare,
  Star,
  Zap,
  Shield,
  Users,
  BookOpen,
  ChevronRight,
  Quote,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { UserTier } from '@/types';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: UserTier;
  name: string;
  price: string;
  period: string;
  features: PlanFeature[];
  popular?: boolean;
}

interface Testimonial {
  id: string;
  name: string;
  country: string;
  text: string;
  rating: number;
}

const { width } = Dimensions.get('window');

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    period: 'forever',
    features: [
      { text: 'Document checklist access', included: true },
      { text: 'Text-based FSP practice', included: true },
      { text: 'Sample Arztbrief (1)', included: true },
      { text: 'Voice FSP simulation', included: false },
      { text: 'All sample templates', included: false },
      { text: 'Arztbrief auto-corrector', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€9.99',
    period: '/month',
    popular: true,
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Voice-based FSP simulation', included: true },
      { text: 'All sample templates', included: true },
      { text: 'Arztbrief auto-corrector', included: true },
      { text: 'Bundesland exam protocols', included: true },
      { text: 'Priority support', included: true },
    ],
  },
  {
    id: 'vip',
    name: 'VIP',
    price: '€19.99',
    period: '/month',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited corrections', included: true },
      { text: 'Personal feedback', included: true },
      { text: 'Early access to features', included: true },
      { text: '1-on-1 consultation', included: true },
      { text: 'Lifetime updates', included: true },
    ],
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Dr. Ahmed K.',
    country: 'Egypt',
    text: 'Passed my FSP in Bayern on the first attempt! The voice practice was exactly like the real exam.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Dr. Priya S.',
    country: 'India',
    text: 'The Arztbrief corrector helped me understand my mistakes. Very useful for exam preparation.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Dr. Maria G.',
    country: 'Romania',
    text: 'Best investment for my FSP preparation. The document checklist saved me so much time.',
    rating: 5,
  },
  {
    id: '4',
    name: 'Dr. Carlos M.',
    country: 'Brazil',
    text: 'The 300 Begriffe section is gold! I learned all the vocabulary I needed for the exam.',
    rating: 5,
  },
];

const STATS = [
  { value: '2,500+', label: 'Doctors Helped' },
  { value: '89%', label: 'Pass Rate' },
  { value: '16', label: 'Bundesländer' },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const { user, upgradeTier } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<UserTier>('pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleUpgrade = async () => {
    if (selectedPlan === 'free') {
      router.back();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);

    setTimeout(() => {
      upgradeTier(selectedPlan);
      setIsProcessing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Upgrade erfolgreich! 🎉',
        `Sie haben jetzt Zugriff auf alle ${selectedPlan === 'vip' ? 'VIP' : 'Pro'}-Funktionen.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 1500);
  };

  const handleSelectPlan = (planId: UserTier) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(planId);
  };

  const testimonial = TESTIMONIALS[currentTestimonial];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={['#2a1f10', '#1a1308']}
            style={styles.headerGradient}
          >
            <View style={styles.iconContainer}>
              <Crown color={Colors.dark.gold} size={40} />
            </View>
            <Text style={styles.title}>Unlock Your Full Potential</Text>
            <Text style={styles.subtitle}>
              Join thousands of doctors who passed their FSP with our Pro features
            </Text>
          </LinearGradient>
        </Animated.View>

        <View style={styles.statsRow}>
          {STATS.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Animated.View style={[styles.testimonialCard, { opacity: fadeAnim }]}>
          <Quote color={Colors.dark.primary} size={24} style={styles.quoteIcon} />
          <Text style={styles.testimonialText}>"{testimonial.text}"</Text>
          <View style={styles.testimonialAuthor}>
            <Text style={styles.testimonialName}>{testimonial.name}</Text>
            <Text style={styles.testimonialCountry}>{testimonial.country}</Text>
          </View>
          <View style={styles.ratingRow}>
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star key={i} color={Colors.dark.gold} size={16} fill={Colors.dark.gold} />
            ))}
          </View>
        </Animated.View>

        <View style={styles.highlightCard}>
          <Zap color={Colors.dark.primary} size={24} />
          <View style={styles.highlightContent}>
            <Text style={styles.highlightTitle}>Pro Features Include:</Text>
            <View style={styles.highlightFeatures}>
              <View style={styles.highlightFeature}>
                <Mic color={Colors.dark.accent} size={16} />
                <Text style={styles.highlightText}>Voice FSP with 24+ Cases</Text>
              </View>
              <View style={styles.highlightFeature}>
                <FileText color={Colors.dark.accent} size={16} />
                <Text style={styles.highlightText}>Arztbrief Auto-Corrector</Text>
              </View>
              <View style={styles.highlightFeature}>
                <BookOpen color={Colors.dark.accent} size={16} />
                <Text style={styles.highlightText}>Bundesland Protocols</Text>
              </View>
              <View style={styles.highlightFeature}>
                <MessageSquare color={Colors.dark.accent} size={16} />
                <Text style={styles.highlightText}>All Sample Templates</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choose Your Plan</Text>

        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => handleSelectPlan(plan.id)}
              activeOpacity={0.8}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Star color={Colors.dark.text} size={12} />
                  <Text style={styles.popularText}>Best Value</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>

              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <View
                      style={[
                        styles.featureCheck,
                        !feature.included && styles.featureCheckDisabled,
                      ]}
                    >
                      <Check
                        color={feature.included ? Colors.dark.accent : Colors.dark.textMuted}
                        size={14}
                      />
                    </View>
                    <Text
                      style={[
                        styles.featureText,
                        !feature.included && styles.featureTextDisabled,
                      ]}
                    >
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>

              {user.tier === plan.id && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentText}>Current Plan</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.guaranteeCard}>
          <Shield color={Colors.dark.success} size={24} />
          <View style={styles.guaranteeContent}>
            <Text style={styles.guaranteeTitle}>100% Satisfaction Guarantee</Text>
            <Text style={styles.guaranteeText}>
              Not happy? Contact us within 7 days for a full refund. No questions asked.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.upgradeButton,
            (isProcessing || user.tier === selectedPlan) && styles.upgradeButtonDisabled,
          ]}
          onPress={handleUpgrade}
          disabled={isProcessing || user.tier === selectedPlan}
        >
          <LinearGradient
            colors={
              isProcessing || user.tier === selectedPlan
                ? [Colors.dark.textMuted, Colors.dark.textMuted]
                : selectedPlan === 'vip'
                ? [Colors.dark.gold, '#8B7355']
                : [Colors.dark.primary, Colors.dark.primaryDark]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeButtonGradient}
          >
            <Text style={styles.upgradeButtonText}>
              {isProcessing
                ? 'Processing...'
                : user.tier === selectedPlan
                ? 'Current Plan'
                : selectedPlan === 'free'
                ? 'Continue with Free'
                : `Upgrade to ${selectedPlan === 'vip' ? 'VIP' : 'Pro'}`}
            </Text>
            {!isProcessing && user.tier !== selectedPlan && selectedPlan !== 'free' && (
              <ChevronRight color={Colors.dark.text} size={20} />
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          Cancel anytime • Secure payment via App Store
        </Text>
      </View>
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
    paddingBottom: 20,
  },
  header: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  headerGradient: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(197, 165, 114, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  testimonialCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  quoteIcon: {
    marginBottom: 12,
    opacity: 0.5,
  },
  testimonialText: {
    fontSize: 15,
    color: Colors.dark.text,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  testimonialName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  testimonialCountry: {
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 4,
  },
  highlightCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  highlightContent: {
    flex: 1,
    marginLeft: 16,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  highlightFeatures: {
    gap: 10,
  },
  highlightFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  highlightText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  planCardSelected: {
    borderColor: Colors.dark.primary,
  },
  planCardPopular: {
    borderColor: Colors.dark.gold,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  planPeriod: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  planFeatures: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureCheckDisabled: {
    backgroundColor: Colors.dark.surfaceLight,
  },
  featureText: {
    fontSize: 14,
    color: Colors.dark.text,
    flex: 1,
  },
  featureTextDisabled: {
    color: Colors.dark.textMuted,
  },
  currentBadge: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: 'center',
  },
  currentText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  guaranteeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.dark.success + '40',
  },
  guaranteeContent: {
    flex: 1,
    marginLeft: 14,
  },
  guaranteeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.success,
    marginBottom: 4,
  },
  guaranteeText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 19,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },
});
