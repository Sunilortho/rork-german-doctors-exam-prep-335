import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, BookOpen, ChevronRight, Volume2, X, Shuffle } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import Colors from '@/constants/colors';
import {
  MEDICAL_TERMS,
  TERM_CATEGORIES,
  TermCategory,
  MedicalTerm,
  getTermsByCategory,
  searchTerms,
  getRandomTerms,
} from '@/constants/medicalTerms';

export default function BegriffeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TermCategory | 'all'>('all');
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizTerms, setQuizTerms] = useState<MedicalTerm[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);

  const filteredTerms = useMemo(() => {
    let terms = selectedCategory === 'all' 
      ? MEDICAL_TERMS 
      : getTermsByCategory(selectedCategory);
    
    if (searchQuery.trim()) {
      const searchResults = searchTerms(searchQuery);
      terms = terms.filter(t => searchResults.some(r => r.id === t.id));
    }
    
    return terms;
  }, [selectedCategory, searchQuery]);

  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = { all: MEDICAL_TERMS.length };
    TERM_CATEGORIES.forEach(cat => {
      counts[cat] = getTermsByCategory(cat).length;
    });
    return counts;
  }, []);

  const speakTerm = useCallback((text: string) => {
    Speech.speak(text, {
      language: 'de-DE',
      rate: 0.85,
      pitch: 1.0,
    });
  }, []);

  const startQuiz = useCallback(() => {
    const randomTerms = getRandomTerms(20);
    setQuizTerms(randomTerms);
    setCurrentQuizIndex(0);
    setShowAnswer(false);
    setLearnedCount(0);
    setShowQuiz(true);
  }, []);

  const nextQuizTerm = useCallback((learned: boolean) => {
    if (learned) {
      setLearnedCount(prev => prev + 1);
    }
    
    if (currentQuizIndex < quizTerms.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setShowQuiz(false);
    }
  }, [currentQuizIndex, quizTerms.length]);

  const renderQuiz = () => {
    const term = quizTerms[currentQuizIndex];
    if (!term) return null;

    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={() => setShowQuiz(false)} style={styles.closeButton}>
            <X color={Colors.dark.textSecondary} size={24} />
          </TouchableOpacity>
          <Text style={styles.quizProgress}>
            {currentQuizIndex + 1} / {quizTerms.length}
          </Text>
          <View style={styles.learnedBadge}>
            <Text style={styles.learnedText}>{learnedCount} gelernt</Text>
          </View>
        </View>

        <View style={styles.quizContent}>
          <View style={styles.quizCard}>
            <Text style={styles.quizCategory}>{term.category}</Text>
            <Text style={styles.quizTerm}>{term.german}</Text>
            
            <TouchableOpacity 
              style={styles.speakButton}
              onPress={() => speakTerm(term.german)}
            >
              <Volume2 color={Colors.dark.primary} size={24} />
              <Text style={styles.speakButtonText}>Aussprechen</Text>
            </TouchableOpacity>

            {showAnswer ? (
              <View style={styles.answerContainer}>
                <Text style={styles.answerLabel}>English:</Text>
                <Text style={styles.answerText}>{term.english}</Text>
                {term.example && (
                  <>
                    <Text style={styles.exampleLabel}>Beispiel:</Text>
                    <Text style={styles.exampleText}>{term.example}</Text>
                  </>
                )}
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.showAnswerButton}
                onPress={() => setShowAnswer(true)}
              >
                <Text style={styles.showAnswerText}>Antwort zeigen</Text>
              </TouchableOpacity>
            )}
          </View>

          {showAnswer && (
            <View style={styles.quizActions}>
              <TouchableOpacity 
                style={[styles.quizActionButton, styles.repeatButton]}
                onPress={() => nextQuizTerm(false)}
              >
                <Text style={styles.repeatButtonText}>Wiederholen</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quizActionButton, styles.learnedButton]}
                onPress={() => nextQuizTerm(true)}
              >
                <Text style={styles.learnedButtonText}>Gelernt ✓</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuizIndex + 1) / quizTerms.length) * 100}%` }
            ]} 
          />
        </View>
      </SafeAreaView>
    );
  };

  if (showQuiz) {
    return renderQuiz();
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <BookOpen color={Colors.dark.primary} size={28} />
          </View>
          <Text style={styles.title}>Medizinische Begriffe</Text>
          <Text style={styles.subtitle}>
            300 wichtige Begriffe für die Fachsprachprüfung
          </Text>
        </View>

        <TouchableOpacity style={styles.quizBanner} onPress={startQuiz}>
          <View style={styles.quizBannerContent}>
            <Shuffle color={Colors.dark.text} size={22} />
            <View style={styles.quizBannerText}>
              <Text style={styles.quizBannerTitle}>Lernmodus starten</Text>
              <Text style={styles.quizBannerSubtitle}>20 zufällige Begriffe üben</Text>
            </View>
          </View>
          <ChevronRight color={Colors.dark.text} size={20} />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Search color={Colors.dark.textMuted} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Begriff suchen..."
            placeholderTextColor={Colors.dark.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color={Colors.dark.textMuted} size={18} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'all' && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === 'all' && styles.categoryChipTextActive,
            ]}>
              Alle ({categoryCount.all})
            </Text>
          </TouchableOpacity>
          {TERM_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === cat && styles.categoryChipTextActive,
              ]}>
                {cat} ({categoryCount[cat]})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.resultsCount}>
          {filteredTerms.length} Begriffe
        </Text>

        <View style={styles.termsList}>
          {filteredTerms.map((term) => (
            <TouchableOpacity
              key={term.id}
              style={[
                styles.termCard,
                expandedTerm === term.id && styles.termCardExpanded,
              ]}
              onPress={() => setExpandedTerm(expandedTerm === term.id ? null : term.id)}
              activeOpacity={0.7}
            >
              <View style={styles.termHeader}>
                <View style={styles.termMain}>
                  <Text style={styles.termGerman}>{term.german}</Text>
                  <Text style={styles.termEnglish}>{term.english}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.termSpeakButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    speakTerm(term.german);
                  }}
                >
                  <Volume2 color={Colors.dark.primary} size={18} />
                </TouchableOpacity>
              </View>
              
              {expandedTerm === term.id && (
                <View style={styles.termExpanded}>
                  <View style={styles.termCategoryBadge}>
                    <Text style={styles.termCategoryText}>{term.category}</Text>
                  </View>
                  {term.example && (
                    <View style={styles.termExampleContainer}>
                      <Text style={styles.termExampleLabel}>Beispiel:</Text>
                      <Text style={styles.termExampleText}>{term.example}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Tipp: Tippen Sie auf einen Begriff für mehr Details
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  quizBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.dark.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quizBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  quizBannerText: {
    gap: 2,
  },
  quizBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  quizBannerSubtitle: {
    fontSize: 13,
    color: Colors.dark.text,
    opacity: 0.8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark.text,
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.dark.text,
  },
  resultsCount: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  termsList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  termCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  termCardExpanded: {
    borderColor: Colors.dark.primary + '60',
  },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  termMain: {
    flex: 1,
    gap: 4,
  },
  termGerman: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  termEnglish: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  termSpeakButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  termExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    gap: 10,
  },
  termCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.primary + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  termCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.dark.primary,
  },
  termExampleContainer: {
    gap: 4,
  },
  termExampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
  },
  termExampleText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  // Quiz styles
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizProgress: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  learnedBadge: {
    backgroundColor: Colors.dark.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  learnedText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.success,
  },
  quizContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  quizCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  quizCategory: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.dark.primary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quizTerm: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.dark.primary + '20',
    borderRadius: 12,
    marginBottom: 24,
  },
  speakButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  showAnswerButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
  },
  showAnswerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  answerContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
  },
  answerText: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.dark.success,
    marginBottom: 12,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  exampleText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quizActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  quizActionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  repeatButton: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  repeatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  learnedButton: {
    backgroundColor: Colors.dark.success,
  },
  learnedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.dark.surface,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
  },
});
