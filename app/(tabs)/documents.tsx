import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useDocuments } from '@/contexts/DocumentsContext';
import { DocumentStatus } from '@/types';

export default function DocumentsScreen() {
  const { categories, stats, toggleCategory, updateDocumentStatus } = useDocuments();

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 color={Colors.dark.success} size={18} />;
      case 'in_progress':
        return <Clock color={Colors.dark.primary} size={18} />;
      default:
        return <Circle color={Colors.dark.textMuted} size={18} />;
    }
  };

  const cycleStatus = (categoryId: string, itemId: string, currentStatus: DocumentStatus) => {
    const statusOrder: DocumentStatus[] = ['not_started', 'in_progress', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    updateDocumentStatus(categoryId, itemId, nextStatus);
  };

  const getStatusLabel = (status: DocumentStatus) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In progress';
      default:
        return 'Not started';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <Text style={styles.headerLabel}>Checklist</Text>
          <Text style={styles.headerTitle}>Authority-ready document tracking</Text>
          <Text style={styles.headerStats}>
            Completed: {stats.completed}/{stats.total} • In progress: {stats.inProgress}
          </Text>
        </View>

        {categories.map((category) => (
          <View key={category.id} style={styles.categoryContainer}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(category.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryTitle}>{category.title}</Text>
              {category.isExpanded ? (
                <Text style={styles.toggleText}>Hide</Text>
              ) : (
                <Text style={styles.toggleText}>Show</Text>
              )}
            </TouchableOpacity>

            {category.isExpanded && (
              <View style={styles.itemsContainer}>
                {category.items.map((item) => (
                  <View key={item.id} style={styles.documentCard}>
                    <View style={styles.documentHeader}>
                      <Text style={styles.documentTitle}>{item.title}</Text>
                      <TouchableOpacity
                        style={styles.statusButton}
                        onPress={() => cycleStatus(category.id, item.id, item.status)}
                      >
                        {getStatusIcon(item.status)}
                        <Text style={styles.statusText}>
                          {getStatusLabel(item.status)}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.tipBox}>
                      <Text style={styles.tipLabel}>Authority tip</Text>
                      <Text style={styles.tipContent}>{item.authorityTip}</Text>
                    </View>

                    <View style={styles.mistakeBox}>
                      <Text style={styles.mistakeLabel}>Common mistake</Text>
                      <Text style={styles.mistakeContent}>{item.commonMistake}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
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
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  headerStats: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  categoryContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    flex: 1,
  },
  toggleText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  itemsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  documentCard: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
    flex: 1,
    marginRight: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statusText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginLeft: 6,
  },
  tipBox: {
    backgroundColor: 'rgba(0, 180, 216, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.primary,
  },
  tipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.primary,
    marginBottom: 4,
  },
  tipContent: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  mistakeBox: {
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.warning,
  },
  mistakeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.warning,
    marginBottom: 4,
  },
  mistakeContent: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
});
