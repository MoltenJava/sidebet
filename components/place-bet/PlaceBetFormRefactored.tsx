// PlaceBetFormRefactored.tsx - Refactored form component for placing bets
// Following rule: Adding debug logs & comments for easier readability

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  Switch, 
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Image
} from 'react-native';
import { Bet, BetOption, PlacedBet } from '../../constants/Models';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { ApiService } from '../../constants/ApiService';
import { LinearGradient } from 'expo-linear-gradient';

interface PlaceBetFormRefactoredProps {
  bet: Bet;
  userId: string;
  onBetPlaced: () => void;
  onCancel?: () => void;
}

export const PlaceBetFormRefactored: React.FC<PlaceBetFormRefactoredProps> = ({ 
  bet, 
  userId, 
  onBetPlaced, 
  onCancel 
}) => {
  // Debug log
  console.debug(`[PlaceBetFormRefactored] Rendering form for bet: ${bet.bet_id}, user: ${userId}`);

  // Main state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [userBalance, setUserBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // FireBack state
  const [showFireBackModal, setShowFireBackModal] = useState<boolean>(false);
  const [fireBackAmount, setFireBackAmount] = useState<string>('');
  const [fireBackLoading, setFireBackLoading] = useState<boolean>(false);
  const [fireBackError, setFireBackError] = useState<string>('');
  
  // Bet status state
  const [betStatus, setBetStatus] = useState<{
    isActive: boolean;
    requiredMatchingAmount: number;
    creatorName: string;
  }>({
    isActive: true,
    requiredMatchingAmount: 0,
    creatorName: '',
  });

  // Fetch user balance on component mount
  useEffect(() => {
    fetchUserBalance();
    analyzeBetStatus();
  }, []);

  // Fetch user balance
  const fetchUserBalance = async () => {
    try {
      console.debug(`[PlaceBetFormRefactored] Fetching balance for user: ${userId}`);
      const userData = await ApiService.getUser(userId);
      setUserBalance(userData.wallet_balance);
    } catch (error) {
      console.error('[PlaceBetFormRefactored] Error fetching user balance:', error);
      setError('Failed to load your account balance.');
    }
  };

  // Analyze the bet status
  const analyzeBetStatus = async () => {
    try {
      console.debug(`[PlaceBetFormRefactored] Analyzing bet status for bet: ${bet.bet_id}`);
      
      // Check if bet is closed
      const now = new Date();
      const closingTime = new Date(bet.bet_closing_time);
      
      if (now > closingTime || bet.status === 'locked' || bet.status === 'settled') {
        setBetStatus({
          ...betStatus,
          isActive: false,
        });
        return;
      }
      
      // Check if this is a challenge bet that requires matching
      if (bet.visibility === 'challenge' && bet.challenged_users?.includes(userId)) {
        const creatorData = await ApiService.getUser(bet.creator_id);
        
        // Get creator's placed bet to determine required matching amount
        const creatorBet = bet.placed_bets?.find(placedBet => 
          placedBet.user_id === bet.creator_id
        );
        
        if (creatorBet) {
          setBetStatus({
            isActive: true,
            requiredMatchingAmount: creatorBet.amount,
            creatorName: creatorData.username,
          });
        }
      }
    } catch (error) {
      console.error('[PlaceBetFormRefactored] Error analyzing bet status:', error);
    }
  };

  // Handler for selecting an option
  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
  };

  // Handler for amount change
  const handleAmountChange = (text: string) => {
    // Only allow numeric input with decimal
    if (text === '' || /^\d+(\.\d{0,2})?$/.test(text)) {
      setAmount(text);
    }
  };

  // Handler for fire back amount change
  const handleFireBackAmountChange = (text: string) => {
    // Only allow numeric input with decimal
    if (text === '' || /^\d+(\.\d{0,2})?$/.test(text)) {
      setFireBackAmount(text);
    }
  };

  // Handler for placing a bet
  const handlePlaceBet = async () => {
    if (!selectedOption) {
      Alert.alert('Error', 'Please select an option.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    if (parseFloat(amount) > userBalance) {
      Alert.alert('Error', 'Bet amount exceeds your available balance.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.debug(`[PlaceBetFormRefactored] Placing bet for user: ${userId}, bet: ${bet.bet_id}, option: ${selectedOption}, amount: ${amount}`);
      
      // Calculate potential winnings
      const odds = bet.bet_options[selectedOption].odds;
      const betAmount = parseFloat(amount);
      const potentialWinnings = betAmount * odds;
      
      // Create placed bet object
      const placedBet: PlacedBet = {
        user_id: userId,
        bet_id: bet.bet_id,
        amount: betAmount,
        selected_option: selectedOption,
        placed_at: new Date().toISOString(),
        potential_winnings: potentialWinnings
      };
      
      // Call API to place bet
      await ApiService.placeBet(placedBet);
      
      // Update user balance
      await ApiService.updateUserBalance(userId, -betAmount);
      
      console.debug('[PlaceBetFormRefactored] Bet placed successfully');
      
      // Inform parent component
      onBetPlaced();
    } catch (error) {
      console.error('[PlaceBetFormRefactored] Error placing bet:', error);
      setError('Failed to place bet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for initiating a fire back
  const handleFireBack = () => {
    setShowFireBackModal(true);
    setFireBackAmount('');
    setFireBackError('');
  };

  // Handler for submitting a fire back
  const handleSubmitFireBack = async () => {
    if (!fireBackAmount || parseFloat(fireBackAmount) <= 0) {
      setFireBackError('Please enter a valid amount.');
      return;
    }

    const originalBetAmount = bet.placed_bets?.find(
      placedBet => placedBet.user_id === bet.creator_id
    )?.amount || 0;

    if (parseFloat(fireBackAmount) <= originalBetAmount) {
      setFireBackError(`Amount must be greater than the original bet (${originalBetAmount}).`);
      return;
    }

    if (parseFloat(fireBackAmount) > userBalance) {
      setFireBackError('Amount exceeds your available balance.');
      return;
    }

    setFireBackLoading(true);
    setFireBackError('');

    try {
      console.debug(`[PlaceBetFormRefactored] Submitting fire back for user: ${userId}, bet: ${bet.bet_id}, amount: ${fireBackAmount}`);
      
      // Call API to create fire back
      await ApiService.createFireBack({
        user_id: userId,
        bet_id: bet.bet_id,
        new_wager: parseFloat(fireBackAmount),
        status: 'pending',
        created_at: new Date().toISOString()
      });
      
      console.debug('[PlaceBetFormRefactored] Fire back submitted successfully');
      
      // Close modal and inform parent component
      setShowFireBackModal(false);
      onBetPlaced();
    } catch (error) {
      console.error('[PlaceBetFormRefactored] Error submitting fire back:', error);
      setFireBackError('Failed to submit fire back. Please try again.');
    } finally {
      setFireBackLoading(false);
    }
  };

  // Calculate current odds for an option
  const calculateCurrentOdds = (optionKey: string): string => {
    const option = bet.bet_options[optionKey];
    return option?.odds ? option.odds.toFixed(2) : '2.00';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>Place Bet</ThemedText>
          {onCancel && (
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Bet Information */}
        <View style={styles.betInfoContainer}>
          <ThemedText style={styles.betDescription}>{bet.event_description}</ThemedText>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={16} color="#999" />
              <ThemedText style={styles.metaText}>
                {bet.creator_name || 'Unknown'}
              </ThemedText>
            </View>
            
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#999" />
              <ThemedText style={styles.metaText}>
                {new Date(bet.bet_closing_time).toLocaleString()}
              </ThemedText>
            </View>
          </View>
        </View>
        
        {/* Challenge Notification */}
        {betStatus.requiredMatchingAmount > 0 && (
          <View style={styles.challengeContainer}>
            <Ionicons name="flash" size={20} color="#FFA500" />
            <ThemedText style={styles.challengeText}>
              {`${betStatus.creatorName} has challenged you to match their bet of $${betStatus.requiredMatchingAmount.toFixed(2)}!`}
            </ThemedText>
          </View>
        )}
        
        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}
        
        {/* Bet Options */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Select Option</ThemedText>
          
          {Object.keys(bet.bet_options).map((optionKey) => (
            <TouchableOpacity
              key={optionKey}
              style={[
                styles.optionButton,
                selectedOption === optionKey && styles.selectedOptionButton
              ]}
              onPress={() => handleSelectOption(optionKey)}
              disabled={!betStatus.isActive}
            >
              <ThemedText style={styles.optionName}>{optionKey}</ThemedText>
              <View style={styles.oddsContainer}>
                <ThemedText style={styles.oddsText}>
                  {calculateCurrentOdds(optionKey)}x
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Bet Amount */}
        <View style={styles.section}>
          <View style={styles.amountHeader}>
            <ThemedText style={styles.sectionTitle}>Bet Amount</ThemedText>
            <ThemedText style={styles.balanceText}>
              Balance: ${userBalance.toFixed(2)}
            </ThemedText>
          </View>
          
          <View style={styles.amountInputContainer}>
            <ThemedText style={styles.dollarSign}>$</ThemedText>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              editable={betStatus.isActive}
            />
          </View>
          
          {betStatus.requiredMatchingAmount > 0 && (
            <TouchableOpacity 
              style={styles.matchButton}
              onPress={() => setAmount(betStatus.requiredMatchingAmount.toString())}
            >
              <ThemedText style={styles.matchButtonText}>
                Match Challenge (${betStatus.requiredMatchingAmount.toFixed(2)})
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Potential Winnings */}
        {selectedOption && amount ? (
          <View style={styles.winningsContainer}>
            <ThemedText style={styles.winningsLabel}>Potential Winnings:</ThemedText>
            <ThemedText style={styles.winningsAmount}>
              ${(parseFloat(amount) * (bet.bet_options[selectedOption]?.odds || 2)).toFixed(2)}
            </ThemedText>
          </View>
        ) : null}
        
        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {/* Place Bet Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.placeBetButton,
              !betStatus.isActive && styles.disabledButton
            ]}
            onPress={handlePlaceBet}
            disabled={loading || !betStatus.isActive}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <LinearGradient
                colors={['#0a7ea4', '#0598d4']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <ThemedText style={styles.actionButtonText}>Place Bet</ThemedText>
              </LinearGradient>
            )}
          </TouchableOpacity>
          
          {/* Fire Back Button */}
          {userId !== bet.creator_id && betStatus.isActive && (
            <TouchableOpacity
              style={[styles.actionButton, styles.fireBackButton]}
              onPress={handleFireBack}
            >
              <Ionicons name="flash" size={18} color="#FFF" style={styles.fireBackIcon} />
              <ThemedText style={styles.actionButtonText}>Fire Back</ThemedText>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Message if bet is not active */}
        {!betStatus.isActive && (
          <View style={styles.inactiveMessage}>
            <Ionicons name="lock-closed" size={20} color="#999" />
            <ThemedText style={styles.inactiveText}>
              This bet is no longer accepting wagers
            </ThemedText>
          </View>
        )}
      </ScrollView>
      
      {/* Fire Back Modal */}
      {showFireBackModal && (
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowFireBackModal(false)}>
            <View style={styles.modalBg} />
          </TouchableWithoutFeedback>
          
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Fire Back Challenge</ThemedText>
                <TouchableOpacity onPress={() => setShowFireBackModal(false)}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              <ThemedText style={styles.modalDescription}>
                Challenge the original bettor with a higher wager. They'll need to match your amount or back down!
              </ThemedText>
              
              {fireBackError ? (
                <View style={styles.fireBackErrorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                  <ThemedText style={styles.fireBackErrorText}>{fireBackError}</ThemedText>
                </View>
              ) : null}
              
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Your Fire Back Amount</ThemedText>
                <ThemedText style={styles.fireBackNote}>
                  Must be higher than the original bet
                </ThemedText>
                
                <View style={styles.amountInputContainer}>
                  <ThemedText style={styles.dollarSign}>$</ThemedText>
                  <TextInput
                    style={styles.amountInput}
                    value={fireBackAmount}
                    onChangeText={handleFireBackAmountChange}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleSubmitFireBack}
                disabled={fireBackLoading}
              >
                {fireBackLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <LinearGradient
                    colors={['#FF6B00', '#FF8800']}
                    style={styles.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <ThemedText style={styles.modalButtonText}>Send Challenge</ThemedText>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#151718',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    padding: 5,
  },
  betInfoContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  betDescription: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#999',
    marginLeft: 4,
    fontSize: 14,
  },
  challengeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  challengeText: {
    color: '#FFA500',
    marginLeft: 10,
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedOptionButton: {
    backgroundColor: 'rgba(10, 126, 164, 0.3)',
    borderColor: '#0a7ea4',
    borderWidth: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  oddsContainer: {
    backgroundColor: '#3A3A3A',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  oddsText: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '700',
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceText: {
    fontSize: 14,
    color: '#999',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  dollarSign: {
    fontSize: 18,
    marginRight: 5,
  },
  amountInput: {
    flex: 1,
    height: 45,
    color: '#FFFFFF',
    fontSize: 16,
  },
  matchButton: {
    backgroundColor: 'rgba(10, 126, 164, 0.2)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  matchButtonText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  winningsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 152, 212, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  winningsLabel: {
    fontSize: 16,
  },
  winningsAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0a7ea4',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
  },
  placeBetButton: {
    marginRight: 10,
  },
  fireBackButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingVertical: 15,
  },
  fireBackIcon: {
    marginRight: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  gradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  inactiveMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveText: {
    color: '#999',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF6B6B',
    marginLeft: 10,
  },
  // Fire Back Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  modalBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    maxHeight: '80%',
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 20,
  },
  fireBackErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  fireBackErrorText: {
    color: '#FF6B6B',
    marginLeft: 10,
  },
  fireBackNote: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  modalButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 15,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 