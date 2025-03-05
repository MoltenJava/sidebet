// BetHistoryModal.tsx - Component for displaying bet history in a modal
// Following rule: Adding debug logs & comments for easier readability

import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bet, PlacedBet } from '../../constants/Models';

interface BetHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  placedBets: PlacedBet[];
  bets: Record<string, Bet>;
}

export const BetHistoryModal: React.FC<BetHistoryModalProps> = ({
  visible,
  onClose,
  placedBets,
  bets,
}) => {
  // Debug log
  console.debug(`[BetHistoryModal] Rendering with ${placedBets.length} bets`);
  
  // Get safe area insets for proper iPhone spacing
  const insets = useSafeAreaInsets();

  // Format date string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate bet outcome and winnings
  const getBetOutcome = (placedBet: PlacedBet): {
    status: 'won' | 'lost' | 'pending';
    winnings: number;
  } => {
    const bet = bets[placedBet.bet_id];
    
    if (!bet || !bet.winning_option) {
      return { status: 'pending', winnings: 0 };
    }
    
    if (bet.winning_option === placedBet.selected_option) {
      return {
        status: 'won',
        winnings: placedBet.potential_winnings || 0,
      };
    } else {
      return {
        status: 'lost',
        winnings: -placedBet.amount,
      };
    }
  };

  // Render individual bet history item
  const renderBetItem = ({ item }: { item: PlacedBet }) => {
    const bet = bets[item.bet_id];
    if (!bet) return null;
    
    const outcome = getBetOutcome(item);
    
    return (
      <View style={styles.betItem}>
        <View style={styles.betHeader}>
          <ThemedText style={styles.betTitle}>{bet.event_description}</ThemedText>
          <View
            style={[
              styles.statusBadge,
              outcome.status === 'won'
                ? styles.wonBadge
                : outcome.status === 'lost'
                ? styles.lostBadge
                : styles.pendingBadge,
            ]}
          >
            <ThemedText style={styles.statusText}>
              {outcome.status.toUpperCase()}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.betDetails}>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Your Pick:</ThemedText>
            <ThemedText style={styles.detailValue}>{item.selected_option}</ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Amount:</ThemedText>
            <ThemedText style={styles.detailValue}>${item.amount.toFixed(2)}</ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Date:</ThemedText>
            <ThemedText style={styles.detailValue}>{formatDate(item.placed_at)}</ThemedText>
          </View>
          
          {outcome.status !== 'pending' && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>
                {outcome.status === 'won' ? 'Won:' : 'Lost:'}
              </ThemedText>
              <ThemedText
                style={[
                  styles.detailValue,
                  outcome.status === 'won'
                    ? styles.positiveAmount
                    : styles.negativeAmount,
                ]}
              >
                {outcome.status === 'won' ? '+' : ''}${Math.abs(outcome.winnings).toFixed(2)}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render empty state if no bets are available
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={40} color="#666" />
      <ThemedText style={styles.emptyText}>No bet history available</ThemedText>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[
          styles.modalContainer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }
        ]}
      >
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>Bet History</ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={placedBets}
          renderItem={renderBetItem}
          keyExtractor={(item) => `${item.bet_id}-${item.user_id}-${item.placed_at}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={renderEmptyState}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#151718',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
  },
  listContent: {
    paddingVertical: 8,
  },
  betItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  betTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  wonBadge: {
    backgroundColor: 'rgba(75, 181, 67, 0.2)',
  },
  lostBadge: {
    backgroundColor: 'rgba(255, 76, 76, 0.2)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 170, 0, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  betDetails: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#AAA',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  positiveAmount: {
    color: '#4BB543',
  },
  negativeAmount: {
    color: '#FF4C4C',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
  },
}); 