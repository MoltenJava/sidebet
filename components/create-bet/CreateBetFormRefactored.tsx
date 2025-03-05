// CreateBetFormRefactored.tsx - Refactored form component for creating new bets
// Following rule: Adding debug logs & comments for easier readability

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { BetTypeSelector, BetType } from './BetTypeSelector';
import { BetOptionsSection, BetOption } from './BetOptionsSection';
import { WagerTypeSelector, WagerType, NonMonetaryWager } from './WagerTypeSelector';
import { BetSettings } from './BetSettings';
import { FriendSelector } from './FriendSelector';
import { ApiService } from '../../constants/ApiService';
import { User } from '../../constants/Models';
import { LinearGradient } from 'expo-linear-gradient';

interface CreateBetFormRefactoredProps {
  userId: string;
  onBetCreated: () => void;
  onCancel: () => void;
}

export const CreateBetFormRefactored: React.FC<CreateBetFormRefactoredProps> = ({ 
  userId, 
  onBetCreated,
  onCancel
}) => {
  // Debug log
  console.debug(`[CreateBetFormRefactored] Rendering form for user: ${userId}`);

  // General form state
  const [eventDescription, setEventDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);

  // Bet type state
  const [betType, setBetType] = useState<BetType>('yesno');
  const [options, setOptions] = useState<BetOption[]>([
    { option: '', initial_odds: 2.0 },
    { option: '', initial_odds: 2.0 }
  ]);
  const [lineValue, setLineValue] = useState<string>('');

  // Wager type state
  const [wagerType, setWagerType] = useState<WagerType>('money');
  const [initialBetAmount, setInitialBetAmount] = useState<string>('');
  const [nonMonetaryWager, setNonMonetaryWager] = useState<NonMonetaryWager>({
    type: 'custom',
    description: '',
  });

  // Bet closing time
  const defaultClosingTime = new Date();
  defaultClosingTime.setHours(defaultClosingTime.getHours() + 24);
  const [selectedDate, setSelectedDate] = useState<Date>(defaultClosingTime);

  // Visibility and friends selection
  const [visibility, setVisibility] = useState<'public' | 'friends_only' | 'challenge'>('public');
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserBalance();
    fetchFriends();
  }, []);

  // Effect to setup options based on bet type
  useEffect(() => {
    if (betType === 'yesno') {
      setOptions([
        { option: '', initial_odds: 2.0 },
        { option: 'No', initial_odds: 2.0 }
      ]);
    } else if (betType === 'overunder') {
      setOptions([
        { option: 'Over', initial_odds: 2.0 },
        { option: 'Under', initial_odds: 2.0 }
      ]);
    } else if (betType === 'multiple' || betType === 'custom') {
      setOptions([
        { option: '', initial_odds: 2.0 },
        { option: '', initial_odds: 2.0 }
      ]);
    }
  }, [betType]);

  // Fetch user's friends
  const fetchFriends = async () => {
    try {
      console.debug('[CreateBetFormRefactored] Fetching friends');
      const friendsData = await ApiService.getFriends(userId);
      setFriends(friendsData);
    } catch (error) {
      console.error('[CreateBetFormRefactored] Error fetching friends:', error);
      setError('Failed to load friends. Please try again.');
    }
  };

  // Fetch user's balance
  const fetchUserBalance = async () => {
    try {
      console.debug('[CreateBetFormRefactored] Fetching user balance');
      const userData = await ApiService.getUser(userId);
      setUserBalance(userData.wallet_balance);
    } catch (error) {
      console.error('[CreateBetFormRefactored] Error fetching user balance:', error);
      setError('Failed to load user balance. Please try again.');
    }
  };

  // Handler for adding options
  const handleAddOption = () => {
    setOptions([...options, { option: '', initial_odds: 2.0 }]);
  };

  // Handler for removing options
  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      Alert.alert('Error', 'You need at least two options for a bet.');
      return;
    }
    
    const updatedOptions = [...options];
    updatedOptions.splice(index, 1);
    setOptions(updatedOptions);
  };

  // Handler for changing option text
  const handleOptionChange = (text: string, index: number) => {
    const updatedOptions = [...options];
    updatedOptions[index] = { ...updatedOptions[index], option: text };
    setOptions(updatedOptions);
  };

  // Handler for changing line value
  const handleLineValueChange = (text: string) => {
    setLineValue(text);
  };

  // Handler for date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  // Handler for visibility change
  const handleVisibilityChange = (newVisibility: 'public' | 'friends_only' | 'challenge') => {
    setVisibility(newVisibility);
    
    // Reset selected friends if not in challenge mode
    if (newVisibility !== 'challenge') {
      setSelectedFriends([]);
    }
  };

  // Handler for toggling friend selection
  const handleToggleFriend = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  // Handler for bet type selection
  const handleToggleBetType = (type: BetType) => {
    setBetType(type);
  };

  // Handler for wager type selection
  const handleWagerTypeSelect = (type: WagerType) => {
    setWagerType(type);
    
    // Reset relevant fields
    if (type === 'money') {
      setInitialBetAmount('');
    } else {
      setNonMonetaryWager({
        type,
        description: ''
      });
    }
  };

  // Handler for non-monetary type change
  const handleNonMonetaryTypeChange = (text: string) => {
    setNonMonetaryWager({
      ...nonMonetaryWager,
      type: 'custom',
      description: text
    });
  };

  // Handler for non-monetary description change
  const handleNonMonetaryDescriptionChange = (text: string) => {
    setNonMonetaryWager({
      ...nonMonetaryWager,
      description: text
    });
  };

  // Handler for initial bet amount change
  const handleInitialBetAmountChange = (text: string) => {
    // Only allow numeric input with decimal
    if (text === '' || /^\d+(\.\d{0,2})?$/.test(text)) {
      setInitialBetAmount(text);
    }
  };

  // Validate the form before submission
  const validateForm = (): boolean => {
    // Validate event description
    if (!eventDescription.trim()) {
      Alert.alert('Error', 'Please enter an event description.');
      return false;
    }

    // Validate bet options based on type
    if (betType === 'yesno') {
      if (!options[0].option.trim()) {
        Alert.alert('Error', 'Please enter a Yes/No question.');
        return false;
      }
    } else if (betType === 'overunder') {
      if (!lineValue.trim()) {
        Alert.alert('Error', 'Please enter a line value.');
        return false;
      }
    } else {
      // Multiple choice or custom
      for (let i = 0; i < options.length; i++) {
        if (!options[i].option.trim()) {
          Alert.alert('Error', `Please enter a value for Option ${i + 1}.`);
          return false;
        }
      }
    }

    // Validate wager
    if (wagerType === 'money') {
      if (!initialBetAmount || parseFloat(initialBetAmount) <= 0) {
        Alert.alert('Error', 'Please enter a valid initial bet amount.');
        return false;
      }
      
      if (parseFloat(initialBetAmount) > userBalance) {
        Alert.alert('Error', 'Bet amount exceeds your available balance.');
        return false;
      }
    } else {
      // Non-monetary wager
      if (wagerType === 'custom' && !nonMonetaryWager.description.trim()) {
        Alert.alert('Error', 'Please enter a custom wager type.');
        return false;
      }
      
      if (!nonMonetaryWager.description.trim()) {
        Alert.alert('Error', 'Please enter wager details.');
        return false;
      }
    }

    // Validate selected date is in the future
    const now = new Date();
    if (selectedDate <= now) {
      Alert.alert('Error', 'Bet closing time must be in the future.');
      return false;
    }

    // Validate friends selection for challenge visibility
    if (visibility === 'challenge' && selectedFriends.length === 0) {
      Alert.alert('Error', 'Please select at least one friend to challenge.');
      return false;
    }

    return true;
  };

  // Handle bet creation
  const handleCreateBet = async () => {
    // Validate form
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      console.debug('[CreateBetFormRefactored] Creating new bet');
      
      // Prepare bet options based on bet type
      let finalOptions: Record<string, BetOption> = {};
      
      if (betType === 'yesno') {
        finalOptions = {
          'Yes': { option: 'Yes', initial_odds: 2.0, total_wagered: 0, odds: 2.0 },
          'No': { option: 'No', initial_odds: 2.0, total_wagered: 0, odds: 2.0 }
        };
      } else if (betType === 'overunder') {
        finalOptions = {
          'Over': { option: 'Over', initial_odds: 2.0, total_wagered: 0, odds: 2.0 },
          'Under': { option: 'Under', initial_odds: 2.0, total_wagered: 0, odds: 2.0 }
        };
      } else {
        // Multiple choice or custom
        options.forEach(option => {
          finalOptions[option.option] = {
            ...option,
            total_wagered: 0,
            odds: option.initial_odds
          };
        });
      }
      
      // Prepare event description based on bet type
      let finalEventDescription = eventDescription;
      
      if (betType === 'yesno') {
        finalEventDescription = options[0].option || eventDescription;
      } else if (betType === 'overunder') {
        finalEventDescription = `${eventDescription} ${lineValue}`;
      }
      
      // Prepare bet data
      const betData = {
        creator_id: userId,
        event_description: finalEventDescription,
        bet_options: finalOptions,
        bet_closing_time: selectedDate.toISOString(),
        visibility: visibility,
        challenged_users: visibility === 'challenge' ? selectedFriends : undefined,
        bet_type: betType,
        // Include wager information
        wager_type: wagerType,
        initial_wager_amount: wagerType === 'money' ? parseFloat(initialBetAmount) : 0,
        non_monetary_wager: wagerType !== 'money' ? nonMonetaryWager : undefined
      };
      
      // Call API to create bet
      await ApiService.createBet(betData);
      
      // Update user balance if monetary bet
      if (wagerType === 'money' && initialBetAmount) {
        await ApiService.updateUserBalance(userId, -parseFloat(initialBetAmount));
      }
      
      console.debug('[CreateBetFormRefactored] Bet created successfully');
      
      // Call the callback to inform parent component
      onBetCreated();
    } catch (error) {
      console.error('[CreateBetFormRefactored] Error creating bet:', error);
      setError('Failed to create bet. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          <ThemedText style={styles.title}>Create New Bet</ThemedText>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        {/* Event Description */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Event Description</ThemedText>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.eventInput}
              value={eventDescription}
              onChangeText={setEventDescription}
              placeholder="e.g., Will Atticus go to bed on time?"
              placeholderTextColor="#999"
              multiline
            />
          </View>
        </View>
        
        {/* Bet Type Selector */}
        <BetTypeSelector
          selectedType={betType}
          onTypeSelect={handleToggleBetType}
        />
        
        {/* Bet Options Section */}
        <BetOptionsSection
          betType={betType}
          options={options}
          lineValue={lineValue}
          onAddOption={handleAddOption}
          onRemoveOption={handleRemoveOption}
          onOptionChange={handleOptionChange}
          onLineValueChange={handleLineValueChange}
        />
        
        {/* Wager Type Selector */}
        <WagerTypeSelector
          selectedWagerType={wagerType}
          nonMonetaryWager={nonMonetaryWager}
          initialBetAmount={initialBetAmount}
          onWagerTypeSelect={handleWagerTypeSelect}
          onNonMonetaryTypeChange={handleNonMonetaryTypeChange}
          onNonMonetaryDescriptionChange={handleNonMonetaryDescriptionChange}
          onInitialBetAmountChange={handleInitialBetAmountChange}
        />
        
        {/* Bet Settings */}
        <BetSettings
          selectedDate={selectedDate}
          selectedVisibility={visibility}
          onDateChange={handleDateChange}
          onVisibilityChange={handleVisibilityChange}
        />
        
        {/* Friend Selector (only visible if visibility is 'challenge') */}
        <FriendSelector 
          showFriends={visibility === 'challenge'}
          friends={friends}
          selectedFriends={selectedFriends}
          onToggleFriend={handleToggleFriend}
        />
        
        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}
        
        {/* Create Button */}
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateBet}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <LinearGradient
              colors={['#0a7ea4', '#0598d4']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <ThemedText style={styles.createButtonText}>Create Bet</ThemedText>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  eventInput: {
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 45,
    paddingVertical: 10,
    textAlignVertical: 'center',
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
  createButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  gradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
}); 