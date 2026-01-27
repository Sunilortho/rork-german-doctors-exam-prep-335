import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Send,
  RefreshCw,
  User,
  Stethoscope,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { FSPMessage } from '@/types';
import { generateText } from '@rork-ai/toolkit-sdk';

const INITIAL_PATIENT_MESSAGE = "Guten Tag, Herr Doktor. Ich bin Frau Schmidt. Ich komme zu Ihnen, weil ich seit einer Woche Rückenschmerzen habe, besonders im unteren Bereich.";

const PATIENT_SYSTEM_PROMPT = `Du bist ein Patient bei der Fachsprachprüfung (FSP) in Deutschland.
Du sprichst NUR Deutsch. Antworte auf alle Fragen auf Deutsch.
Du bist eine 45-jährige Frau mit Rückenschmerzen.
Beschwerden: Schmerzen im unteren Rücken seit 1 Woche, schlimmer beim Bücken, bessert sich beim Liegen.
Vorgeschichte: Büroarbeit, sitzt viel, keine Voroperationen, nimmt gelegentlich Ibuprofen.
Antworte kurz und natürlich wie ein echter Patient.`;

export default function TextFSPScreen() {
  const [messages, setMessages] = useState<FSPMessage[]>([
    {
      id: '1',
      role: 'patient',
      content: INITIAL_PATIENT_MESSAGE,
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;

    const doctorMessage: FSPMessage = {
      id: Date.now().toString(),
      role: 'arzt',
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, doctorMessage]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role === 'arzt' ? 'user' as const : 'assistant' as const,
        content: m.content,
      }));

      const response = await generateText({
        messages: [
          { role: 'user', content: PATIENT_SYSTEM_PROMPT },
          { role: 'assistant', content: 'Verstanden.' },
          ...conversationHistory,
          { role: 'user', content: inputText.trim() },
        ],
      });

      const patientResponse = response || 'Entschuldigung, können Sie das bitte wiederholen?';

      const patientMessage: FSPMessage = {
        id: (Date.now() + 1).toString(),
        role: 'patient',
        content: patientResponse,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, patientMessage]);
    } catch (error) {
      console.log('AI generation error:', error);
      const fallbackMessage: FSPMessage = {
        id: (Date.now() + 1).toString(),
        role: 'patient',
        content: 'Ja, Herr Doktor. Die Schmerzen sind wirklich unangenehm. Was können Sie mir empfehlen?',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [inputText, isLoading, messages]);

  const resetSession = () => {
    setMessages([
      {
        id: '1',
        role: 'patient',
        content: INITIAL_PATIENT_MESSAGE,
        timestamp: Date.now(),
      },
    ]);
    setInputText('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.resetButton} onPress={resetSession}>
            <RefreshCw color={Colors.dark.textSecondary} size={20} />
            <Text style={styles.resetText}>Neu starten</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipBanner}>
          <Text style={styles.tipText}>
            💬 Üben Sie Ihre Anamnese-Struktur: Begrüßung → Hauptbeschwerde → 
            Schmerzcharakter → Vorgeschichte → Zusammenfassung
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                message.role === 'arzt' && styles.messageRowRight,
              ]}
            >
              {message.role === 'patient' && (
                <View style={styles.avatarPatient}>
                  <User color={Colors.dark.text} size={18} />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'arzt'
                    ? styles.messageBubbleArzt
                    : styles.messageBubblePatient,
                ]}
              >
                <Text style={styles.roleLabel}>
                  {message.role === 'arzt' ? 'Arzt (Sie)' : 'Patient'}
                </Text>
                <Text style={styles.messageText}>{message.content}</Text>
              </View>
              {message.role === 'arzt' && (
                <View style={styles.avatarArzt}>
                  <Stethoscope color={Colors.dark.text} size={18} />
                </View>
              )}
            </View>
          ))}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={styles.avatarPatient}>
                <User color={Colors.dark.text} size={18} />
              </View>
              <View style={styles.loadingBubble}>
                <ActivityIndicator color={Colors.dark.primary} size="small" />
                <Text style={styles.loadingText}>Patient antwortet...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Schreiben Sie als Arzt..."
            placeholderTextColor={Colors.dark.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Send color={Colors.dark.text} size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  resetText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  tipBanner: {
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  tipText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  avatarPatient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarArzt: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 14,
    borderRadius: 16,
  },
  messageBubblePatient: {
    backgroundColor: Colors.dark.surface,
    borderBottomLeftRadius: 4,
  },
  messageBubbleArzt: {
    backgroundColor: Colors.dark.primary,
    borderBottomRightRadius: 4,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 15,
    color: Colors.dark.text,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: 14,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.dark.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.dark.textMuted,
    opacity: 0.5,
  },
});
