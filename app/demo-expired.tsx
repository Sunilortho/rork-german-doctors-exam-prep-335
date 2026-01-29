import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Mail, Stethoscope, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function DemoExpiredScreen() {
  const handleContact = () => {
    Linking.openURL('mailto:sunilortho0007@gmail.com?subject=Roadmap to Germany - Full Access Request');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.dark.background, '#0a1628', Colors.dark.background]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Clock color={Colors.dark.warning} size={48} />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Demo Period Ended</Text>
          <Text style={styles.subtitle}>
            Your 48-hour demo access has expired
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Stethoscope color={Colors.dark.primary} size={24} />
            <Text style={styles.cardTitle}>Roadmap to Germany</Text>
          </View>
          <Text style={styles.cardDescription}>
            Thank you for trying our FSP preparation app. To continue your journey towards German medical licensure, please contact us for full access.
          </Text>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Full Version Includes:</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>50+ patient scenarios</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>All medical specialties</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Study resources & protocols</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Unlimited practice sessions</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handleContact}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.dark.primary, Colors.dark.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.contactButtonGradient}
          >
            <Mail color="#fff" size={20} />
            <Text style={styles.contactButtonText}>Contact for Full Access</Text>
            <ArrowRight color="#fff" size={20} />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.emailText}>sunilortho0007@gmail.com</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.warning + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.warning + '30',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
  featuresCard: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.primary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.accent,
  },
  featureText: {
    fontSize: 15,
    color: Colors.dark.text,
  },
  contactButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  contactButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#fff',
  },
  emailText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
});
