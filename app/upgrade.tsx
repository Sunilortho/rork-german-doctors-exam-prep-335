import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Crown,
  Check,
  Mic,
  FileText,
  MessageSquare,
  Star,
  Zap,
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
      { text: 'Voice FSP (2 male + 2 female cases)', included: true },
      { text: 'All voice simulation cases', included: false },
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
      { text: 'Priority support', included: true },
      { text: 'VIP features', included: false },
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
      { text: 'Early access to new features', included: true },
      { text: '1-on-1 consultation', included: true },
      { text: 'Lifetime updates', included: true },
    ],
  },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const { user, upgradeTier } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<UserTier>('pro');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    if (selectedPlan === 'free') {
      router.back();
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      upgradeTier(selectedPlan);
      setIsProcessing(false);
      Alert.alert(
        'Upgrade erfolgreich!',
        `Sie haben jetzt Zugriff auf alle ${selectedPlan === 'vip' ? 'VIP' : 'Pro'}-Funktionen.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Crown color={Colors.dark.gold} size={40} />
          </View>
          <Text style={styles.title}>Upgrade Your Plan</Text>
          <Text style={styles.subtitle}>
            Unlock all features to accelerate your FSP preparation
          </Text>
        </View>

        <View style={styles.highlightCard}>
          <Zap color={Colors.dark.primary} size={24} />
          <View style={styles.highlightContent}>
            <Text style={styles.highlightTitle}>Pro Features Include:</Text>
            <View style={styles.highlightFeatures}>
              <View style={styles.highlightFeature}>
                <Mic color={Colors.dark.accent} size={16} />
                <Text style={styles.highlightText}>Voice FSP Simulation</Text>
              </View>
              <View style={styles.highlightFeature}>
                <FileText color={Colors.dark.accent} size={16} />
                <Text style={styles.highlightText}>Arztbrief Corrector</Text>
              </View>
              <View style={styles.highlightFeature}>
                <MessageSquare color={Colors.dark.accent} size={16} />
                <Text style={styles.highlightText}>All Templates</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.8}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Star color={Colors.dark.text} size={12} />
                  <Text style={styles.popularText}>Most Popular</Text>
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
          <Text style={styles.upgradeButtonText}>
            {isProcessing
              ? 'Processing...'
              : user.tier === selectedPlan
              ? 'Current Plan'
              : selectedPlan === 'free'
              ? 'Continue with Free'
              : `Upgrade to ${selectedPlan === 'vip' ? 'VIP' : 'Pro'}`}
          </Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          Cancel anytime. Secure payment via App Store.
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
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(197, 165, 114, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    textAlign: 'center',
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
    gap: 8,
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
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
  },
  upgradeButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonDisabled: {
    backgroundColor: Colors.dark.textMuted,
    opacity: 0.6,
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
