// BetDetailsModal.tsx - Component for displaying bet details in a modal
// Following rule: Adding debug logs & comments for easier readability

import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bet, PlacedBet } from '../../constants/Models';

interface BetDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  placedBet: PlacedBet | null;
  betDetails: Bet | null;
  isLoading: boolean;
}

export const BetDetailsModal: React.FC<BetDetailsModalProps> = ({
  visible,
  onClose,
  placedBet,
  betDetails,
  isLoading,
}) => {
  // Debug log
  console.debug(`[BetDetailsModal] Rendering for bet: ${betDetails?.bet_id}`);
  
  // Get safe area insets for proper iPhone spacing
  const insets = useSafeAreaInsets();

  // Format date string
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Determine status color based on bet status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open':
        return '#4BB543'; // Green
      case 'locked':
        return '#FFA500'; // Orange
      case 'settled':
        return '#0a7ea4'; // Blue
      case 'disputed':
        return '#FF4C4C'; // Red
      default:
        return '#999999'; // Gray
    }
  };

  // Format status text
  const formatStatus = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Determine if user won the bet
  const didUserWin = (): boolean | null => {
    if (!betDetails || !placedBet || !betDetails.winning_option) return null;
    return betDetails.winning_option === placedBet.selected_option;
  };

  // Loading or empty state
  if (isLoading || !betDetails || !placedBet) {
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
        
        <View 
          style={[
            styles.modalContainer,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }
          ]}
        >
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Bet Details</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.loadingContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#0a7ea4" />
            ) : (
              <ThemedText style={styles.emptyText}>Bet details not available</ThemedText>
            )}
          </View>
        </View>
      </Modal>
    );
  }

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
      
      <View 
        style={[
          styles.modalContainer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }
        ]}
      >
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>Bet Details</ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Bet title and status */}
          <View style={styles.section}>
            <ThemedText style={styles.betTitle}>{betDetails.event_description}</ThemedText>
            
            <View style={[styles.statusContainer, { backgroundColor: `${getStatusColor(betDetails.status)}20` }]}>
              <Ionicons 
                name={betDetails.status === 'settled' ? 'checkmark-circle' : 'time'} 
                size={16} 
                color={getStatusColor(betDetails.status)} 
              />
              <ThemedText style={[styles.statusText, { color: getStatusColor(betDetails.status) }]}>
                {formatStatus(betDetails.status)}
              </ThemedText>
            </View>
          </View>
          
          {/* User's bet details */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Your Bet</ThemedText>
            
            <View style={styles.betCard}>
              <View style={styles.betDetail}>
                <ThemedText style={styles.detailLabel}>Option Selected:</ThemedText>
                <ThemedText style={styles.detailValue}>{placedBet.selected_option}</ThemedText>
              </View>
              
              <View style={styles.betDetail}>
                <ThemedText style={styles.detailLabel}>Amount Wagered:</ThemedText>
                <ThemedText style={styles.detailValue}>${placedBet.amount.toFixed(2)}</ThemedText>
              </View>
              
              <View style={styles.betDetail}>
                <ThemedText style={styles.detailLabel}>Placed On:</ThemedText>
                <ThemedText style={styles.detailValue}>{formatDate(placedBet.placed_at)}</ThemedText>
              </View>
              
              <View style={styles.betDetail}>
                <ThemedText style={styles.detailLabel}>Potential Winnings:</ThemedText>
                <ThemedText style={styles.detailValue}>${placedBet.potential_winnings?.toFixed(2) || "0.00"}</ThemedText>
              </View>
            </View>
          </View>
          
          {/* Outcome section (if the bet is settled) */}
          {betDetails.status === 'settled' && didUserWin() !== null && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Outcome</ThemedText>
              
              <View 
                style={[
                  styles.outcomeCard, 
                  didUserWin() ? styles.winOutcomeCard : styles.loseOutcomeCard
                ]}
              >
                <View style={styles.outcomeHeader}>
                  <Ionicons 
                    name={didUserWin() ? 'trophy' : 'close-circle'} 
                    size={24} 
                    color={didUserWin() ? '#4BB543' : '#FF4C4C'} 
                  />
                  <ThemedText style={styles.outcomeTitle}>
                    {didUserWin() ? 'You Won!' : 'You Lost'}
                  </ThemedText>
                </View>
                
                <View style={styles.outcomeDivider} />
                
                <View style={styles.betDetail}>
                  <ThemedText style={styles.detailLabel}>Winning Option:</ThemedText>
                  <ThemedText style={styles.detailValue}>{betDetails.winning_option}</ThemedText>
                </View>
                
                {didUserWin() && (
                  <View style={styles.betDetail}>
                    <ThemedText style={styles.detailLabel}>Winnings:</ThemedText>
                    <ThemedText style={[styles.detailValue, styles.winningAmount]}>
                      +${placedBet.potential_winnings?.toFixed(2) || "0.00"}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* Bet details */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Bet Information</ThemedText>
            
            <View style={styles.betCard}>
              <View style={styles.betDetail}>
                <ThemedText style={styles.detailLabel}>Created By:</ThemedText>
                <ThemedText style={styles.detailValue}>{betDetails.creator_name || 'Unknown'}</ThemedText>
              </View>
              
              <View style={styles.betDetail}>
                <ThemedText style={styles.detailLabel}>Closing Time:</ThemedText>
                <ThemedText style={styles.detailValue}>{formatDate(betDetails.bet_closing_time)}</ThemedText>
              </View>
              
              <View style={styles.betDetail}>
                <ThemedText style={styles.detailLabel}>Visibility:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {betDetails.visibility === 'public' 
                    ? 'Public' 
                    : betDetails.visibility === 'friends_only'
                    ? 'Friends Only'
                    : 'Challenge'
                  }
                </ThemedText>
              </View>
              
              {/* Options and odds */}
              <ThemedText style={styles.optionsTitle}>Options & Odds</ThemedText>
              
              {betDetails.bet_options && Object.entries(betDetails.bet_options).map(([key, option]) => (
                <View key={key} style={styles.optionItem}>
                  <View style={styles.optionNameContainer}>
                    {key === betDetails.winning_option && (
                      <Ionicons name="checkmark-circle" size={16} color="#4BB543" style={styles.winnerIcon} />
                    )}
                    <ThemedText 
                      style={[
                        styles.optionName,
                        key === placedBet.selected_option && styles.selectedOption
                      ]}
                    >
                      {key}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.optionOdds}>{option.odds.toFixed(2)}x</ThemedText>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
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
    right: 16,
  },
  loadingContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  betTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  statusText: {
    marginLeft: 5,
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  betCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  betDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#AAA',
    fontSize: 14,
  },
  detailValue: {
    fontWeight: '500',
    fontSize: 14,
    color: '#FFFFFF',
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 10,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  optionNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerIcon: {
    marginRight: 6,
  },
  optionName: {
    fontSize: 14,
  },
  selectedOption: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  optionOdds: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a7ea4',
  },
  outcomeCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  winOutcomeCard: {
    backgroundColor: 'rgba(75, 181, 67, 0.1)',
    borderColor: 'rgba(75, 181, 67, 0.3)',
  },
  loseOutcomeCard: {
    backgroundColor: 'rgba(255, 76, 76, 0.1)',
    borderColor: 'rgba(255, 76, 76, 0.3)',
  },
  outcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  outcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  outcomeDivider: {
    height: 1,
    backgroundColor: '#3A3A3A',
    marginVertical: 12,
  },
  winningAmount: {
    color: '#4BB543',
  },
}); 