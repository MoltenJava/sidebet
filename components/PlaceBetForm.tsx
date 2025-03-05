// PlaceBetForm.tsx - Form component for placing bets
// Following rule: Adding debug logs & comments for easier readability

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  Switch, 
  Modal,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TouchableWithoutFeedback,
  Image
} from 'react-native';
import { Bet, BetOption, PlacedBet } from '../constants/Models';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { ApiService } from '../constants/ApiService';

interface PlaceBetFormProps {
  bet: Bet;
  userId: string;
  onBetPlaced: () => void;
  onCancel?: () => void;
}

export const PlaceBetForm: React.FC<PlaceBetFormProps> = ({ bet, userId, onBetPlaced, onCancel }) => {
  // Debug log
  console.debug(`[PlaceBetForm] Rendering form for bet: ${bet.bet_id}, user: ${userId}`);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [userBalance, setUserBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showFireBackModal, setShowFireBackModal] = useState<boolean>(false);
  const [fireBackAmount, setFireBackAmount] = useState<string>('');
  const [fireBackLoading, setFireBackLoading] = useState<boolean>(false);
  const [fireBackError, setFireBackError] = useState<string>('');
  
  // New state for tracking bet status
  const [betStatus, setBetStatus] = useState<{
    isActive: boolean;
    requiredMatchingAmount: number;
    creatorOption: string;
    creatorAmount: number;
  }>({
    isActive: false,
    requiredMatchingAmount: 0,
    creatorOption: '',
    creatorAmount: 0
  });

  useEffect(() => {
    fetchUserBalance();
    analyzeBetStatus();
  }, [userId, bet]);

  const fetchUserBalance = async () => {
    try {
      console.debug(`[PlaceBetForm] Fetching balance for user: ${userId}`);
      const response = await fetch(`https://sidebet-api.onrender.com/api/users/${userId}/balance`);
      const data = await response.json();
      
      if (data.success) {
        setUserBalance(data.balance);
      } else {
        console.error('[PlaceBetForm] Failed to fetch user balance:', data.message);
      }
    } catch (error) {
      console.error('[PlaceBetForm] Error fetching user balance:', error);
    }
  };
  
  const analyzeBetStatus = () => {
    console.debug('[PlaceBetForm] Analyzing bet status');
    
    // Find the creator's bet
    const creatorBet = bet.placed_bets?.find((placedBet: PlacedBet) => 
      placedBet.user_id === bet.creator_id
    );
    
    if (!creatorBet) {
      console.debug('[PlaceBetForm] No creator bet found');
      return;
    }
    
    const creatorOptionKey = creatorBet.selected_option;
    const creatorOption = bet.bet_options[creatorOptionKey]?.option || '';
    const creatorAmount = creatorBet.amount;
    
    // Calculate the total amount wagered on the opposite side
    let oppositeAmount = 0;
    
    Object.entries(bet.bet_options).forEach(([key, option]) => {
      if (key !== creatorOptionKey) {
        // Sum up all bets on options that aren't the creator's option
        const optionBets = bet.placed_bets?.filter((placedBet: PlacedBet) => 
          placedBet.selected_option === key
        ) || [];
        
        oppositeAmount += optionBets.reduce((sum: number, placedBet: PlacedBet) => sum + placedBet.amount, 0);
      }
    });
    
    // Calculate how much more is needed to match the creator's bet
    const requiredMatchingAmount = Math.max(0, creatorAmount - oppositeAmount);
    const isActive = requiredMatchingAmount === 0;
    
    setBetStatus({
      isActive,
      requiredMatchingAmount,
      creatorOption,
      creatorAmount
    });
    
    console.debug(`[PlaceBetForm] Bet status: active=${isActive}, requiredMatching=${requiredMatchingAmount}`);
  };

  const handleSelectOption = (option: string) => {
    console.debug(`[PlaceBetForm] Selected option: ${option}`);
    setSelectedOption(option);
  };

  const handleAmountChange = (text: string) => {
    // Only allow numeric input with up to 2 decimal places
    if (/^\d*\.?\d{0,2}$/.test(text)) {
      console.debug(`[PlaceBetForm] Amount changed: ${text}`);
      setAmount(text);
    }
  };

  const handleFireBackAmountChange = (text: string) => {
    // Only allow numeric input with up to 2 decimal places
    if (/^\d*\.?\d{0,2}$/.test(text)) {
      console.debug(`[PlaceBetForm] Fire back amount changed: ${text}`);
      setFireBackAmount(text);
    }
  };

  const handlePlaceBet = async () => {
    try {
      // Validate inputs
      if (!selectedOption) {
        setError('Please select an option');
        return;
      }
      
      if (!amount || parseFloat(amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      
      if (parseFloat(amount) > userBalance) {
        setError('Insufficient balance');
        return;
      }
      
      if (bet.minimum_wager && parseFloat(amount) < bet.minimum_wager) {
        setError(`Minimum wager is $${bet.minimum_wager.toFixed(2)}`);
        return;
      }
      
      setLoading(true);
      setError('');
      
      console.debug(`[PlaceBetForm] Placing bet: ${selectedOption}, $${amount}`);
      
      // Find the option key that matches the selected option text
      const selectedOptionKey = Object.keys(bet.bet_options).find(
        key => bet.bet_options[key].option === selectedOption
      );
      
      if (!selectedOptionKey) {
        setError('Invalid option selected');
        setLoading(false);
        return;
      }
      
      // Send request to place bet
      const response = await fetch('https://sidebet-api.onrender.com/api/bets/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bet_id: bet.bet_id,
          user_id: userId,
          selected_option: selectedOptionKey,
          amount: parseFloat(amount)
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.debug('[PlaceBetForm] Bet placed successfully');
        onBetPlaced();
      } else {
        setError(data.message || 'Failed to place bet');
      }
    } catch (error) {
      console.error('[PlaceBetForm] Error placing bet:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFireBack = () => {
    console.debug('[PlaceBetForm] Opening fire back modal');
    setShowFireBackModal(true);
    setFireBackAmount('');
    setFireBackError('');
  };

  const handleSubmitFireBack = async () => {
    try {
      // Validate inputs
      if (!fireBackAmount || parseFloat(fireBackAmount) <= 0) {
        setFireBackError('Please enter a valid amount');
        return;
      }
      
      if (parseFloat(fireBackAmount) > userBalance) {
        setFireBackError('Insufficient balance');
        return;
      }
      
      setFireBackLoading(true);
      setFireBackError('');
      
      console.debug(`[PlaceBetForm] Submitting fire back: $${fireBackAmount}`);
      
      // Send request to fire back
      const response = await fetch('https://sidebet-api.onrender.com/api/bets/fire-back', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bet_id: bet.bet_id,
          user_id: userId,
          amount: parseFloat(fireBackAmount)
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.debug('[PlaceBetForm] Fire back submitted successfully');
        setShowFireBackModal(false);
        onBetPlaced();
      } else {
        setFireBackError(data.message || 'Failed to fire back');
      }
    } catch (error) {
      console.error('[PlaceBetForm] Error submitting fire back:', error);
      setFireBackError('An error occurred. Please try again.');
    } finally {
      setFireBackLoading(false);
    }
  };

  // Calculate the current odds based on total money wagered
  const calculateCurrentOdds = (optionKey: string) => {
    // Get total wagered across all options
    const totalWagered = Object.values(bet.bet_options).reduce(
      (sum, option) => sum + option.total_wagered, 0
    );
    
    if (totalWagered === 0) {
      return bet.bet_options[optionKey].initial_odds;
    }
    
    // Calculate odds based on proportion of total wagered
    const optionWagered = bet.bet_options[optionKey].total_wagered;
    
    // If nothing wagered on this option, return high odds
    if (optionWagered === 0) {
      return 10.0; // High odds for options with no bets
    }
    
    // Calculate odds as inverse of proportion
    const proportion = optionWagered / totalWagered;
    const calculatedOdds = 1 / proportion;
    
    // Round to 2 decimal places
    return Math.round(calculatedOdds * 100) / 100;
  };

  return (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContentContainer}
      showsVerticalScrollIndicator={true}
      bounces={true}
      alwaysBounceVertical={true}
    >
      <View style={styles.container}>
        <View style={styles.dragIndicator} />
        
        <ThemedText style={styles.title}>Place a Bet</ThemedText>
        
        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
        
        <View style={styles.eventContainer}>
          <ThemedText style={styles.eventDescription}>{bet.event_description}</ThemedText>
          
          <View style={styles.creatorContainer}>
            <Image 
              source={{ uri: `https://i.pravatar.cc/150?u=${bet.creator_id}` }} 
              style={styles.creatorAvatar} 
            />
            <ThemedText style={styles.creatorName}>
              Created by {bet.creator_name || 'Anonymous'}
            </ThemedText>
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color="#888" />
              <ThemedText style={styles.infoText}>
                Closes: {new Date(bet.bet_closing_time).toLocaleDateString()} at {new Date(bet.bet_closing_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </ThemedText>
            </View>
            
            {bet.minimum_wager && bet.minimum_wager > 0 && (
              <View style={styles.infoItem}>
                <Ionicons name="cash-outline" size={16} color="#888" />
                <ThemedText style={styles.infoText}>
                  Min wager: ${bet.minimum_wager.toFixed(2)}
                </ThemedText>
              </View>
            )}
          </View>
          
          {!betStatus.isActive && (
            <View style={styles.matchingContainer}>
              <ThemedText style={styles.matchingTitle}>
                This bet needs more action!
              </ThemedText>
              <ThemedText style={styles.matchingDescription}>
                The creator bet ${betStatus.creatorAmount.toFixed(2)} on "{betStatus.creatorOption}"
              </ThemedText>
              <ThemedText style={styles.matchingAmount}>
                ${betStatus.requiredMatchingAmount.toFixed(2)} more needed on opposite side
              </ThemedText>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${Math.min(100, (1 - betStatus.requiredMatchingAmount / betStatus.creatorAmount) * 100)}%` 
                    }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.balanceContainer}>
          <ThemedText style={styles.balanceText}>
            Your balance: ${userBalance.toFixed(2)}
          </ThemedText>
        </View>
        
        <View style={styles.optionsContainer}>
          <ThemedText style={styles.sectionTitle}>Select an option:</ThemedText>
          
          {Object.entries(bet.bet_options).map(([key, option]) => {
            const currentOdds = calculateCurrentOdds(key);
            const isCreatorOption = betStatus.creatorOption === option.option;
            
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optionButton,
                  selectedOption === option.option && styles.selectedOptionButton,
                  isCreatorOption && styles.creatorOptionButton
                ]}
                onPress={() => handleSelectOption(option.option)}
              >
                <View style={styles.optionContent}>
                  <ThemedText 
                    style={[
                      styles.optionText,
                      selectedOption === option.option && styles.selectedOptionText
                    ]}
                  >
                    {option.option}
                  </ThemedText>
                  
                  {isCreatorOption && (
                    <View style={styles.creatorBadge}>
                      <ThemedText style={styles.creatorBadgeText}>Creator's Pick</ThemedText>
                    </View>
                  )}
                </View>
                
                <View style={styles.oddsContainer}>
                  <ThemedText style={styles.oddsText}>{currentOdds.toFixed(2)}x</ThemedText>
                  <ThemedText style={styles.oddsSubtext}>
                    ${option.total_wagered.toFixed(2)} wagered
                  </ThemedText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <View style={styles.amountContainer}>
          <ThemedText style={styles.sectionTitle}>Your wager:</ThemedText>
          
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              placeholderTextColor="#666"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
            />
            <View style={styles.currencyContainer}>
              <ThemedText style={styles.currencyText}>$</ThemedText>
            </View>
          </View>
          
          {selectedOption && amount && !isNaN(parseFloat(amount)) && (
            <View style={styles.potentialWinningsContainer}>
              <ThemedText style={styles.potentialWinningsText}>
                Potential winnings: $
                {(parseFloat(amount) * calculateCurrentOdds(
                  Object.keys(bet.bet_options).find(
                    key => bet.bet_options[key].option === selectedOption
                  ) || ''
                )).toFixed(2)}
              </ThemedText>
              <ThemedText style={styles.oddsLockText}>
                * Final odds lock when betting closes
              </ThemedText>
            </View>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.fireBackButton} 
            onPress={handleFireBack}
          >
            <ThemedText style={styles.fireBackButtonText}>🔥 FIRE BACK! 🔥</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.placeBetButton, loading && styles.disabledButton]}
            onPress={handlePlaceBet}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.placeBetButtonText}>Place Bet</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <Modal
        visible={showFireBackModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFireBackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.dragIndicator} />
            
            <ThemedText style={styles.modalTitle}>🔥 FIRE BACK CHALLENGE 🔥</ThemedText>
            
            {fireBackError ? (
              <ThemedText style={styles.errorText}>{fireBackError}</ThemedText>
            ) : null}
            
            <ThemedText style={styles.modalDescription}>
              Challenge the creator with your own bet! If they accept, a new bet will be created.
            </ThemedText>
            
            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter challenge amount"
                placeholderTextColor="#666"
                value={fireBackAmount}
                onChangeText={handleFireBackAmountChange}
                keyboardType="decimal-pad"
              />
              <View style={styles.currencyContainer}>
                <ThemedText style={styles.currencyText}>$</ThemedText>
              </View>
            </View>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowFireBackModal(false)}
              >
                <ThemedText style={styles.modalCancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalSubmitButton, fireBackLoading && styles.disabledButton]}
                onPress={handleSubmitFireBack}
                disabled={fireBackLoading}
              >
                {fireBackLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.modalSubmitButtonText}>Submit Challenge</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 100, // Extra padding at bottom for better scrolling
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  eventContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  eventDescription: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  creatorName: {
    fontSize: 14,
    color: '#888',
  },
  infoContainer: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
  },
  matchingContainer: {
    backgroundColor: 'rgba(255,165,0,0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  matchingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFA500',
    marginBottom: 4,
  },
  matchingDescription: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  matchingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFA500',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFA500',
  },
  balanceContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  balanceText: {
    fontSize: 14,
    color: '#888',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedOptionButton: {
    backgroundColor: `${Colors.light.tint}30`,
    borderColor: Colors.light.tint,
    borderWidth: 1,
  },
  creatorOptionButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  creatorBadge: {
    backgroundColor: 'rgba(255,165,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  creatorBadgeText: {
    fontSize: 12,
    color: '#FFA500',
  },
  oddsContainer: {
    alignItems: 'flex-end',
  },
  oddsText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.tint,
  },
  oddsSubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  amountContainer: {
    marginBottom: 24,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  currencyContainer: {
    position: 'absolute',
    right: 12,
  },
  currencyText: {
    fontSize: 16,
    color: '#888',
  },
  potentialWinningsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
  },
  potentialWinningsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  oddsLockText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fireBackButton: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  fireBackButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  placeBetButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  placeBetButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalCancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalSubmitButton: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

// Debug note: This component allows users to select a bet option,
// enter an amount, place a bet, or fire back with a higher wager 