import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Stethoscope,
  FileText,
  Mic,
  BookOpen,
  Target,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
}

interface OnboardingSlide {
  id: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  title: string;
  description: string;
  features?: string[];
}

const { width, height } = Dimensions.get('window');

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: Stethoscope,
    iconColor: Colors.dark.primary,
    title: 'Welcome, Doctor',
    description: 'Your complete roadmap to practicing medicine in Germany. From documents to Fachsprachprüfung — we\'ve got you covered.',
  },
  {
    id: '2',
    icon: FileText,
    iconColor: Colors.dark.accent,
    title: 'Document Checklist',
    description: 'Track all required documents with authority tips and common mistakes to avoid.',
    features: ['Translation requirements', 'Apostille guidance', 'Deadline tracking'],
  },
  {
    id: '3',
    icon: Mic,
    iconColor: Colors.dark.warning,
    title: 'FSP Voice Practice',
    description: 'Realistic exam simulation with AI patients. Practice anamnesis, patient explanation, and Arztbrief.',
    features: ['24+ medical cases', 'Natural German voices', 'Real-time feedback'],
  },
  {
    id: '4',
    icon: BookOpen,
    iconColor: '#9B59B6',
    title: '300+ Medical Terms',
    description: 'Essential vocabulary for the Fachsprachprüfung with pronunciation and examples.',
    features: ['Flashcard mode', 'Category filters', 'Audio pronunciation'],
  },
  {
    id: '5',
    icon: Target,
    iconColor: '#E74C3C',
    title: 'Daily Goals & Streaks',
    description: 'Stay motivated with daily practice goals, XP rewards, and achievement badges.',
    features: ['Track your progress', 'Earn achievements', 'Build consistency'],
  },
];

export default function WelcomeModal({ visible, onClose }: WelcomeModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const IconComponent = item.icon;
    
    return (
      <View style={styles.slide}>
        <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '20' }]}>
          <IconComponent color={item.iconColor} size={48} />
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>

        {item.features && (
          <View style={styles.featuresContainer}>
            {item.features.map((feature, idx) => (
              <View key={idx} style={styles.featureItem}>
                <View style={[styles.featureDot, { backgroundColor: item.iconColor }]} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {SLIDES.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: Colors.dark.primary,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#111921', '#0A0E14']}
            style={styles.gradient}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              ref={flatListRef}
              data={SLIDES}
              renderItem={renderSlide}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentIndex(index);
              }}
              scrollEventThrottle={16}
            />

            {renderPagination()}

            <View style={styles.footer}>
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <LinearGradient
                  colors={[Colors.dark.primary, Colors.dark.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextButtonGradient}
                >
                  <Text style={styles.nextButtonText}>
                    {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                  {currentIndex < SLIDES.length - 1 ? (
                    <ChevronRight color={Colors.dark.text} size={20} />
                  ) : (
                    <Sparkles color={Colors.dark.text} size={20} />
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {currentIndex === SLIDES.length - 1 && (
                <Text style={styles.disclaimer}>
                  By continuing, you agree to our Terms of Service
                </Text>
              )}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width,
    height: height * 0.85,
    maxHeight: 700,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 15,
    color: Colors.dark.textMuted,
  },
  slide: {
    width: width,
    paddingHorizontal: 32,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresContainer: {
    alignSelf: 'stretch',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 14,
  },
  featureText: {
    fontSize: 15,
    color: Colors.dark.text,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
});
