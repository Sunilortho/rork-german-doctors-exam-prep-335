import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Eye,
  History,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { ArztbriefResult } from '@/types';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

interface MistakeRecord {
  text: string;
  count: number;
  category: string;
}

interface HighlightedMistake {
  original: string;
  corrected: string;
  isRepeated: boolean;
  category: string;
}

const ARZTBRIEF_PROMPT = `Du bist ein erfahrener deutscher Prüfer für die Fachsprachprüfung (FSP).
Korrigiere den folgenden Arztbrief nach FSP-Standards:

1. Korrigiere Grammatik und medizinisches Deutsch
2. Stelle sicher, dass die FSP-Struktur eingehalten wird:
   - Anamnese
   - Befund
   - Diagnose
   - Therapie
   - Empfehlung/Procedere
3. Erfinde KEINE medizinischen Daten - nur korrigieren was vorhanden ist
4. Gib konstruktives Feedback wie ein Prüfer
5. Identifiziere ALLE Fehler mit Original und Korrektur

Der korrigierte Text sollte professionell und prüfungsbereit sein.`;

const resultSchema = z.object({
  correctedText: z.string().describe('Der vollständig korrigierte Arztbrief auf Deutsch'),
  feedback: z.array(z.string()).describe('Liste von Prüfer-Feedback-Punkten auf Deutsch'),
  mistakes: z.array(z.object({
    original: z.string().describe('Der fehlerhafte Text'),
    corrected: z.string().describe('Die korrekte Version'),
    category: z.string().describe('Kategorie: grammar, vocabulary, structure, spelling'),
  })).describe('Liste aller gefundenen Fehler mit Original und Korrektur'),
});

export default function ArztbriefCorrectorScreen() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<ArztbriefResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mistakeHistory, setMistakeHistory] = useState<MistakeRecord[]>([]);
  const [highlightedMistakes, setHighlightedMistakes] = useState<HighlightedMistake[]>([]);
  const [showMistakeHistory, setShowMistakeHistory] = useState(false);

  useEffect(() => {
    loadMistakeHistory();
  }, []);

  const loadMistakeHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('arztbrief_mistakes');
      if (stored) {
        setMistakeHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading mistake history:', error);
    }
  };

  const saveMistakeHistory = async (mistakes: MistakeRecord[]) => {
    try {
      await AsyncStorage.setItem('arztbrief_mistakes', JSON.stringify(mistakes));
    } catch (error) {
      console.log('Error saving mistake history:', error);
    }
  };

  const updateMistakeHistory = (newMistakes: { original: string; corrected: string; category: string }[]) => {
    const updatedHistory = [...mistakeHistory];
    const highlighted: HighlightedMistake[] = [];

    newMistakes.forEach((mistake) => {
      const existingIndex = updatedHistory.findIndex(
        (m) => m.text.toLowerCase() === mistake.original.toLowerCase()
      );

      if (existingIndex >= 0) {
        updatedHistory[existingIndex].count += 1;
        highlighted.push({
          ...mistake,
          isRepeated: true,
        });
      } else {
        updatedHistory.push({
          text: mistake.original,
          count: 1,
          category: mistake.category,
        });
        highlighted.push({
          ...mistake,
          isRepeated: false,
        });
      }
    });

    setMistakeHistory(updatedHistory);
    setHighlightedMistakes(highlighted);
    saveMistakeHistory(updatedHistory);
  };

  const handleCorrect = async () => {
    if (!inputText.trim()) {
      Alert.alert('Hinweis', 'Bitte fügen Sie einen Arztbrief ein.');
      return;
    }

    if (inputText.trim().length < 50) {
      Alert.alert('Hinweis', 'Der Text ist zu kurz. Bitte fügen Sie einen vollständigen Arztbrief ein.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await generateObject({
        messages: [
          { role: 'user', content: ARZTBRIEF_PROMPT },
          { role: 'assistant', content: 'Verstanden. Ich werde den Arztbrief nach FSP-Standards korrigieren.' },
          { role: 'user', content: `Hier ist der Arztbrief zur Korrektur:\n\n${inputText}` },
        ],
        schema: resultSchema,
      });

      setResult({
        correctedText: response.correctedText,
        feedback: response.feedback,
        watermark: 'Generated via Roadmap to Germany',
      });

      if (response.mistakes && response.mistakes.length > 0) {
        updateMistakeHistory(response.mistakes);
      }
    } catch (error) {
      console.log('Correction error:', error);
      Alert.alert(
        'Fehler',
        'Die Korrektur konnte nicht durchgeführt werden. Bitte versuchen Sie es erneut.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Kopiert', 'Text wurde in die Zwischenablage kopiert.');
  };

  const handleReset = () => {
    setInputText('');
    setResult(null);
    setHighlightedMistakes([]);
  };

  const clearMistakeHistory = async () => {
    Alert.alert(
      'Fehlerhistorie löschen',
      'Möchten Sie alle gespeicherten Fehler löschen? Dies setzt die Wiederholungszählung zurück.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            setMistakeHistory([]);
            await AsyncStorage.removeItem('arztbrief_mistakes');
          },
        },
      ]
    );
  };

  const renderHighlightedText = () => {
    if (!result || highlightedMistakes.length === 0) {
      return <Text style={styles.resultText}>{result?.correctedText}</Text>;
    }

    return (
      <View>
        <Text style={styles.resultText}>{result.correctedText}</Text>
        <View style={styles.mistakesSection}>
          <Text style={styles.mistakesSectionTitle}>Fehleranalyse</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F5A623' }]} />
              <Text style={styles.legendText}>Erster Fehler</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E74C3C' }]} />
              <Text style={styles.legendText}>Wiederholter Fehler</Text>
            </View>
          </View>
          {highlightedMistakes.map((mistake, index) => (
            <View
              key={index}
              style={[
                styles.mistakeItem,
                mistake.isRepeated ? styles.mistakeRepeated : styles.mistakeFirst,
              ]}
            >
              <View style={styles.mistakeHeader}>
                <Text style={styles.mistakeCategory}>{mistake.category.toUpperCase()}</Text>
                {mistake.isRepeated && (
                  <View style={styles.repeatedBadge}>
                    <Text style={styles.repeatedBadgeText}>WIEDERHOLT</Text>
                  </View>
                )}
              </View>
              <View style={styles.mistakeComparison}>
                <View style={styles.mistakeOriginal}>
                  <Text style={styles.mistakeLabel}>Falsch:</Text>
                  <Text style={[
                    styles.mistakeText,
                    mistake.isRepeated ? styles.mistakeTextRepeated : styles.mistakeTextFirst,
                  ]}>{mistake.original}</Text>
                </View>
                <View style={styles.mistakeCorrected}>
                  <Text style={styles.mistakeLabel}>Richtig:</Text>
                  <Text style={styles.mistakeTextCorrect}>{mistake.corrected}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <FileText color={Colors.dark.primary} size={32} />
          <Text style={styles.title}>Arztbrief Auto-Corrector</Text>
          <Text style={styles.subtitle}>
            Fügen Sie Ihren Arztbrief ein und erhalten Sie strukturierte Korrekturen mit Prüfer-Feedback.
          </Text>
        </View>

        {!result ? (
          <>
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Ihr Arztbrief</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Fügen Sie hier Ihren Arztbrief ein...

Beispiel-Struktur:
- Anamnese: Patient stellt sich vor wegen...
- Befund: Bei der Untersuchung zeigt sich...
- Diagnose: ...
- Therapie: ...
- Procedere: ..."
                placeholderTextColor={Colors.dark.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                textAlignVertical="top"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.correctButton, isLoading && styles.correctButtonDisabled]}
              onPress={handleCorrect}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color={Colors.dark.text} />
                  <Text style={styles.correctButtonText}>Arztbrief wird geprüft...</Text>
                </>
              ) : (
                <>
                  <CheckCircle color={Colors.dark.text} size={20} />
                  <Text style={styles.correctButtonText}>Auto-Korrigieren</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.resultSection}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Korrigierter Arztbrief</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopy(result.correctedText)}
                >
                  <Copy color={Colors.dark.primary} size={18} />
                  <Text style={styles.copyText}>Kopieren</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.resultCard}>
                {renderHighlightedText()}
                <Text style={styles.watermark}>{result.watermark}</Text>
              </View>

              {mistakeHistory.length > 0 && (
                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={() => setShowMistakeHistory(!showMistakeHistory)}
                >
                  <History color={Colors.dark.primary} size={18} />
                  <Text style={styles.historyButtonText}>
                    {showMistakeHistory ? 'Fehlerhistorie ausblenden' : 'Fehlerhistorie anzeigen'}
                  </Text>
                </TouchableOpacity>
              )}

              {showMistakeHistory && mistakeHistory.length > 0 && (
                <View style={styles.historySection}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>Ihre häufigen Fehler</Text>
                    <TouchableOpacity onPress={clearMistakeHistory}>
                      <Text style={styles.clearHistoryText}>Löschen</Text>
                    </TouchableOpacity>
                  </View>
                  {mistakeHistory
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10)
                    .map((mistake, index) => (
                      <View key={index} style={styles.historyItem}>
                        <Text style={styles.historyMistakeText}>{mistake.text}</Text>
                        <View style={[
                          styles.historyCountBadge,
                          mistake.count > 1 && styles.historyCountBadgeWarning,
                        ]}>
                          <Text style={styles.historyCountText}>{mistake.count}x</Text>
                        </View>
                      </View>
                    ))}
                </View>
              )}
            </View>

            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackTitle}>Prüfer-Feedback</Text>
              {result.feedback.map((item, index) => (
                <View key={index} style={styles.feedbackItem}>
                  <AlertCircle color={Colors.dark.warning} size={16} />
                  <Text style={styles.feedbackText}>{item}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <RefreshCw color={Colors.dark.primary} size={20} />
              <Text style={styles.resetButtonText}>Neuen Arztbrief korrigieren</Text>
            </TouchableOpacity>
          </>
        )}
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
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textArea: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: Colors.dark.text,
    minHeight: 280,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    lineHeight: 22,
  },
  correctButton: {
    backgroundColor: Colors.dark.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  correctButtonDisabled: {
    backgroundColor: Colors.dark.primaryDark,
  },
  correctButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  resultSection: {
    marginBottom: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  copyText: {
    fontSize: 13,
    color: Colors.dark.primary,
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.success,
  },
  resultText: {
    fontSize: 15,
    color: Colors.dark.text,
    lineHeight: 24,
  },
  watermark: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 16,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  feedbackSection: {
    marginBottom: 24,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surface,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  mistakesSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  mistakesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  mistakeItem: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  mistakeFirst: {
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
    borderLeftColor: '#F5A623',
  },
  mistakeRepeated: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderLeftColor: '#E74C3C',
  },
  mistakeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mistakeCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark.textMuted,
    letterSpacing: 0.5,
  },
  repeatedBadge: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  repeatedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mistakeComparison: {
    gap: 6,
  },
  mistakeOriginal: {
    flexDirection: 'row',
    gap: 8,
  },
  mistakeCorrected: {
    flexDirection: 'row',
    gap: 8,
  },
  mistakeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textMuted,
    width: 50,
  },
  mistakeText: {
    fontSize: 14,
    flex: 1,
  },
  mistakeTextFirst: {
    color: '#F5A623',
    textDecorationLine: 'line-through',
  },
  mistakeTextRepeated: {
    color: '#E74C3C',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  mistakeTextCorrect: {
    fontSize: 14,
    color: Colors.dark.success,
    flex: 1,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surface,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  historyButtonText: {
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: '500',
  },
  historySection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  clearHistoryText: {
    fontSize: 13,
    color: Colors.dark.error,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  historyMistakeText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  historyCountBadge: {
    backgroundColor: Colors.dark.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyCountBadgeWarning: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
  },
  historyCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.text,
  },
});
