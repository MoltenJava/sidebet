// CreateBetForm.tsx - Form component for creating new bets
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
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  Switch
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { ApiService } from '../constants/ApiService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { User } from '../constants/Models';
import { LinearGradient } from 'expo-linear-gradient';

interface CreateBetFormProps {
  userId: string;
  onBetCreated: () => void;
  onCancel: () => void;
}

// Added new bet type enum for different betting formats
type BetType = 'yesno' | 'overunder' | 'multiple' | 'custom';

// Enhanced bet option interface to support different bet types
interface BetOption {
  option: string;
  initial_odds: number;
}

// New interface for non-monetary wagers
interface NonMonetaryWager {
  type: string;
  description: string;
}

export const CreateBetForm: React.FC<CreateBetFormProps> = ({ 
  userId, 
  onBetCreated,
  onCancel
}) => {
  // Debug log
  console.debug('[CreateBetForm] Rendering form for user:', userId);

  // Core bet information
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<BetOption[]>([
    { option: '', initial_odds: 2.0 },
    { option: '', initial_odds: 2.0 }
  ]);
  const [closingDate, setClosingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [minimumWager, setMinimumWager] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends_only' | 'challenge'>('public');
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New state variables for bet types and non-monetary wagers
  const [betType, setBetType] = useState<BetType>('multiple');
  const [lineValue, setLineValue] = useState('');
  const [useNonMonetaryWager, setUseNonMonetaryWager] = useState(false);
  const [nonMonetaryWager, setNonMonetaryWager] = useState<NonMonetaryWager>({
    type: 'drinks',
    description: '1 round of drinks'
  });
  
  // Creator's initial bet
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [initialBetAmount, setInitialBetAmount] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  
  // Fetch friends and user balance on component mount
  useEffect(() => {
    fetchFriends();
    fetchUserBalance();
  }, [userId]);

  // Effect for auto-detecting bet type based on description
  useEffect(() => {
    // Only try to auto-detect if the user hasn't manually selected a type
    if (description && !description.includes('?')) {
      console.debug('[CreateBetForm] Attempting to auto-detect bet type from description');
      
      // Check for common over/under patterns
      if (
        /will.*(score|make|get|have|reach).*(more|less|over|under|above|below).*than/i.test(description) ||
        /over\/under/i.test(description) ||
        /\b[0-9]+(\.[0-9]+)?\b.*\b(over|under)\b/i.test(description)
      ) {
        console.debug('[CreateBetForm] Auto-detected Over/Under type bet');
        setBetType('overunder');
        
        // Try to extract the line value if possible
        const matches = description.match(/\b[0-9]+(\.[0-9]+)?\b/);
        if (matches && matches[0] && !lineValue) {
          setLineValue(matches[0]);
        }
      } 
      // Check for common yes/no patterns
      else if (
        /will.*\?$/i.test(description) || 
        /\b(yes|no)\b/i.test(description) ||
        /\bor not\b/i.test(description)
      ) {
        console.debug('[CreateBetForm] Auto-detected Yes/No type bet');
        setBetType('yesno');
      }
    }
  }, [description]);

  // Update options based on bet type changes
  useEffect(() => {
    console.debug(`[CreateBetForm] Bet type changed to: ${betType}`);
    
    if (betType === 'yesno') {
      setOptions([
        { option: 'Yes', initial_odds: 2.0 },
        { option: 'No', initial_odds: 2.0 }
      ]);
    } else if (betType === 'overunder') {
      setOptions([
        { option: `Over ${lineValue || '...'}`, initial_odds: 2.0 },
        { option: `Under ${lineValue || '...'}`, initial_odds: 2.0 }
      ]);
    } else if (options.length < 2) {
      // Ensure we always have at least 2 options for multiple choice
      setOptions([
        ...options,
        { option: '', initial_odds: 2.0 }
      ]);
    }
  }, [betType, lineValue]);

  // Update over/under options when line value changes
  useEffect(() => {
    if (betType === 'overunder' && lineValue) {
      setOptions([
        { option: `Over ${lineValue}`, initial_odds: 2.0 },
        { option: `Under ${lineValue}`, initial_odds: 2.0 }
      ]);
    }
  }, [lineValue]);

  const fetchFriends = async () => {
    try {
      console.debug('[CreateBetForm] Fetching available friends');
      const users = await ApiService.getUsers();
      // Filter out current user
      setFriends(users.filter(user => user.user_id !== userId));
    } catch (error) {
      console.error('[CreateBetForm] Error fetching friends:', error);
      Alert.alert('Error', 'Failed to load friends. Please try again.');
    }
  };
  
  const fetchUserBalance = async () => {
    try {
      setIsLoadingBalance(true);
      console.debug('[CreateBetForm] Fetching user balance');
      
      // First try to get balance from ApiService
      try {
        const user = await ApiService.getCurrentUser();
        if (user && user.wallet_balance !== undefined) {
          setUserBalance(user.wallet_balance);
          setIsLoadingBalance(false);
          return;
        }
      } catch (apiError) {
        console.debug('[CreateBetForm] Could not get balance from ApiService, trying direct API call');
      }
      
      // Fallback to direct API call
      const response = await fetch(`https://sidebet-api.onrender.com/api/users/${userId}/balance`);
      const data = await response.json();
      
      if (data.success) {
        setUserBalance(data.balance);
      } else {
        console.error('[CreateBetForm] Failed to fetch balance:', data.message);
      }
    } catch (error) {
      console.error('[CreateBetForm] Error fetching balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleAddOption = () => {
    console.debug('[CreateBetForm] Adding new option');
    setOptions([...options, { option: '', initial_odds: 2.0 }]);
  };
  
  const handleRemoveOption = (index: number) => {
    console.debug(`[CreateBetForm] Removing option at index ${index}`);
    
    // Don't allow removing if we have less than 2 options for multiple choice
    // or exactly 2 options for yes/no and over/under
    if ((betType === 'multiple' && options.length <= 2) || 
        ((betType === 'yesno' || betType === 'overunder') && options.length <= 2)) {
      Alert.alert('Cannot Remove', 'You need at least 2 options for this bet type.');
      return;
    }
    
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
    
    // If we removed the selected option, clear the selection
    if (selectedOptionIndex === index) {
      setSelectedOptionIndex(null);
    } else if (selectedOptionIndex !== null && selectedOptionIndex > index) {
      // Adjust the selected index if we removed an option before it
      setSelectedOptionIndex(selectedOptionIndex - 1);
    }
  };
  
  const handleOptionChange = (text: string, index: number) => {
    console.debug(`[CreateBetForm] Changing option at index ${index} to: ${text}`);
    const newOptions = [...options];
    newOptions[index].option = text;
    setOptions(newOptions);
  };
  
  const handleLineValueChange = (text: string) => {
    console.debug(`[CreateBetForm] Changing line value to: ${text}`);
    // Only allow numbers and a single decimal point
    if (/^[0-9]*\.?[0-9]*$/.test(text)) {
      setLineValue(text);
    }
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      console.debug(`[CreateBetForm] Setting closing date to: ${selectedDate.toISOString()}`);
      setClosingDate(selectedDate);
    }
  };
  
  const handleVisibilityChange = (newVisibility: 'public' | 'friends_only' | 'challenge') => {
    console.debug(`[CreateBetForm] Changing visibility to: ${newVisibility}`);
    setVisibility(newVisibility);
    
    // When changing to challenge, preselect the first friend
    if (newVisibility === 'challenge' && friends.length > 0 && selectedFriends.length === 0) {
      setSelectedFriends([friends[0].user_id]);
    }
    
    // Reset non-monetary wager if not in challenge mode
    if (newVisibility !== 'challenge') {
      setUseNonMonetaryWager(false);
    }
  };
  
  const handleToggleFriend = (friendId: string) => {
    console.debug(`[CreateBetForm] Toggling friend: ${friendId}`);
    // For challenge, we can only select one friend
    if (visibility === 'challenge') {
      setSelectedFriends([friendId]);
      return;
    }
    
    // For friends_only, we can select multiple
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };
  
  const handleSelectOption = (index: number) => {
    console.debug(`[CreateBetForm] Selecting option at index ${index}`);
    setSelectedOptionIndex(index);
  };
  
  const handleInitialBetAmountChange = (text: string) => {
    console.debug(`[CreateBetForm] Setting initial bet amount to: ${text}`);
    // Ensure the amount is a valid number
    if (/^[0-9]*\.?[0-9]*$/.test(text)) {
      setInitialBetAmount(text);
    }
  };
  
  const handleNonMonetaryTypeChange = (text: string) => {
    setNonMonetaryWager({
      ...nonMonetaryWager,
      type: text
    });
  };
  
  const handleNonMonetaryDescriptionChange = (text: string) => {
    setNonMonetaryWager({
      ...nonMonetaryWager,
      description: text
    });
  };
  
  const handleToggleBetType = (type: BetType) => {
    console.debug(`[CreateBetForm] Switching bet type to: ${type}`);
    setBetType(type);
  };
  
  const validateForm = (): boolean => {
    // Validate description
    if (!description.trim()) {
      setError('Please provide a description for your bet');
      return false;
    }
    
    // Validate options based on bet type
    if (betType === 'overunder' && !lineValue) {
      setError('Please set a line value for Over/Under');
      return false;
    }
    
    // Validate that all options have text
    for (let i = 0; i < options.length; i++) {
      if (!options[i].option.trim()) {
        setError(`Please fill in all bet options`);
        return false;
      }
    }
    
    // Validate minimum wager
    if (!minimumWager.trim() || isNaN(parseFloat(minimumWager)) || parseFloat(minimumWager) <= 0) {
      setError('Please set a valid minimum wager amount');
      return false;
    }
    
    // Validate friends selection for friends_only visibility
    if (visibility === 'friends_only' && selectedFriends.length === 0) {
      setError('Please select at least one friend');
      return false;
    }
    
    // Validate friends selection for challenge visibility
    if (visibility === 'challenge' && selectedFriends.length !== 1) {
      setError('Please select exactly one friend to challenge');
      return false;
    }
    
    // Validate non-monetary wager for challenge bets
    if (visibility === 'challenge' && useNonMonetaryWager) {
      if (!nonMonetaryWager.type.trim() || !nonMonetaryWager.description.trim()) {
        setError('Please provide details for your non-monetary wager');
        return false;
      }
    }
    
    // Validate initial bet
    if (selectedOptionIndex === null) {
      setError('Please select your initial bet option');
      return false;
    }
    
    // Validate initial bet amount
    if (!useNonMonetaryWager) {
      if (!initialBetAmount.trim() || isNaN(parseFloat(initialBetAmount)) || parseFloat(initialBetAmount) <= 0) {
        setError('Please set a valid initial bet amount');
        return false;
      }
      
      // Check if user has enough balance
      if (parseFloat(initialBetAmount) > userBalance) {
        setError('You don\'t have enough balance for this bet');
        return false;
      }
    }
    
    return true;
  };

  const handleCreateBet = async () => {
    // Validate the form
    if (!validateForm()) {
      return;
    }
    
    // Debug log
    console.debug('[CreateBetForm] Creating new bet');
    setLoading(true);
    setError('');
    
    try {
      // Prepare bet options
      const betOptions: Record<string, { option: string, initial_odds: number }> = {};
      options.forEach((option, index) => {
        betOptions[`option${index + 1}`] = {
          option: option.option,
          initial_odds: option.initial_odds
        };
      });
      
      // Calculate closing date (ensure it's in the future)
      const now = new Date();
      const adjustedClosingDate = closingDate < now ? new Date(now.getTime() + 60 * 60 * 1000) : closingDate;
      
      // Prepare bet data
      const betData = {
        creator_id: userId,
        event_description: description,
        bet_options: betOptions,
        bet_closing_time: adjustedClosingDate.toISOString(),
        minimum_wager: parseFloat(minimumWager),
        visibility: visibility,
        invited_friends: selectedFriends,
        bet_type: betType,
        is_non_monetary: useNonMonetaryWager && visibility === 'challenge',
        non_monetary_wager: useNonMonetaryWager && visibility === 'challenge' ? nonMonetaryWager : null,
        line_value: betType === 'overunder' ? parseFloat(lineValue) : null
      };
      
      console.debug('[CreateBetForm] Sending bet data:', JSON.stringify(betData));
      
      // Create the bet - use a mock response for now since ApiService is not properly implemented
      // const newBet = await ApiService.createBet(betData);
      // Use direct API call instead of ApiService to avoid argument errors
      const createResponse = await fetch('https://sidebet-api.onrender.com/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(betData),
      });
      
      const newBet = await createResponse.json();
      
      // Place initial bet
      if (selectedOptionIndex !== null) {
        // Prepare the selected option key
        const selectedOptionKey = `option${selectedOptionIndex + 1}`;
        
        // Place the bet
        const placeBetData = {
          user_id: userId,
          bet_id: newBet.bet_id,
          selected_option: selectedOptionKey,
          amount: useNonMonetaryWager ? 0 : parseFloat(initialBetAmount),
          is_non_monetary: useNonMonetaryWager && visibility === 'challenge',
          non_monetary_wager: useNonMonetaryWager && visibility === 'challenge' ? nonMonetaryWager : null
        };
        
        console.debug('[CreateBetForm] Placing initial bet:', JSON.stringify(placeBetData));
        // Use direct API call instead of ApiService to avoid argument errors
        await fetch('https://sidebet-api.onrender.com/api/bets/place', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(placeBetData),
        });
      }
      
      // Success
      console.debug('[CreateBetForm] Bet created successfully');
      Alert.alert('Success', 'Your bet has been created!');
      onBetCreated();
    } catch (error) {
      console.error('[CreateBetForm] Error creating bet:', error);
      setError('Failed to create bet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFriendItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={[
        styles.friendItem,
        selectedFriends.includes(item.user_id) && styles.selectedFriendItem,
        { width: visibility === 'challenge' ? 120 : '48%' }
      ]}
      onPress={() => handleToggleFriend(item.user_id)}
    >
      <Image 
        source={{ uri: item.profile_image || `https://i.pravatar.cc/150?u=${item.user_id}` }} 
        style={styles.friendAvatar} 
      />
      <ThemedText 
        style={styles.friendName}
        numberOfLines={1}
      >
        {item.username}
      </ThemedText>
      {selectedFriends.includes(item.user_id) && (
        <Ionicons name="checkmark-circle" size={20} color={Colors.light.tint} />
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.formContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Create a Bet</ThemedText>
            <TouchableOpacity 
              style={[
                styles.createButton,
                loading ? styles.disabledButton : null
              ]}
              onPress={handleCreateBet}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.createButtonText}>Create</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Balance indicator */}
          <ThemedView style={styles.balanceContainer}>
            {isLoadingBalance ? (
              <ActivityIndicator size="small" color={Colors.light.tint} />
            ) : (
              <>
                <Ionicons name="wallet-outline" size={18} color={Colors.light.tint} />
                <ThemedText style={styles.balanceText}>
                  Your Balance: ${userBalance.toFixed(2)}
                </ThemedText>
              </>
            )}
          </ThemedView>

          {/* Bet Type Selector */}
          <ThemedView style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Bet Type</ThemedText>
            <View style={styles.betTypeContainer}>
              <TouchableOpacity 
                style={[styles.betTypeButton, betType === 'yesno' && styles.activeBetTypeButton]}
                onPress={() => handleToggleBetType('yesno')}
              >
                <Ionicons 
                  name="checkmark-circle-outline" 
                  size={20} 
                  color={betType === 'yesno' ? Colors.light.tint : '#888'} 
                />
                <ThemedText style={[
                  styles.betTypeText, 
                  betType === 'yesno' && styles.activeBetTypeText
                ]}>
                  Yes/No
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.betTypeButton, betType === 'overunder' && styles.activeBetTypeButton]}
                onPress={() => handleToggleBetType('overunder')}
              >
                <Ionicons 
                  name="swap-vertical-outline" 
                  size={20} 
                  color={betType === 'overunder' ? Colors.light.tint : '#888'} 
                />
                <ThemedText style={[
                  styles.betTypeText, 
                  betType === 'overunder' && styles.activeBetTypeText
                ]}>
                  Over/Under
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.betTypeButton, betType === 'multiple' && styles.activeBetTypeButton]}
                onPress={() => handleToggleBetType('multiple')}
              >
                <Ionicons 
                  name="list-outline" 
                  size={20} 
                  color={betType === 'multiple' ? Colors.light.tint : '#888'} 
                />
                <ThemedText style={[
                  styles.betTypeText, 
                  betType === 'multiple' && styles.activeBetTypeText
                ]}>
                  Multiple Choice
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>

          {/* Description input */}
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>What are you betting on?</ThemedText>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Will the Lakers win tonight?"
              placeholderTextColor="#888"
              multiline
            />
          </ThemedView>
          
          {/* Line Value input - only for over/under */}
          {betType === 'overunder' && (
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Line Value</ThemedText>
              <View style={styles.lineValueContainer}>
                <TextInput
                  style={styles.lineValueInput}
                  value={lineValue}
                  onChangeText={handleLineValueChange}
                  placeholder="e.g. 100"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                />
                <ThemedText style={styles.lineValueHelper}>
                  This is the number that bettors will wager over or under
                </ThemedText>
              </View>
            </ThemedView>
          )}

          {/* Bet options */}
          <ThemedView style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Bet Options</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              {betType === 'yesno' 
                ? 'Simple Yes or No options for your bet'
                : betType === 'overunder'
                ? 'Over or Under the line value'
                : 'Add multiple options for your bet'
              }
            </ThemedText>
            
            {options.map((option, index) => (
              <View key={index} style={styles.optionContainer}>
                <View style={styles.optionInputContainer}>
                  <TextInput
                    style={[
                      styles.optionInput,
                      (betType === 'yesno' || betType === 'overunder') && styles.disabledOptionInput
                    ]}
                    value={option.option}
                    onChangeText={(text) => handleOptionChange(text, index)}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor="#888"
                    editable={betType === 'multiple'}
                  />
                  
                  {betType === 'multiple' && (
                    <TouchableOpacity 
                      style={styles.removeOptionButton}
                      onPress={() => handleRemoveOption(index)}
                      disabled={options.length <= 2}
                    >
                      <Ionicons name="close-circle" size={20} color={options.length <= 2 ? '#ccc' : '#ff4d4d'} />
                    </TouchableOpacity>
                  )}
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.optionSelector,
                    selectedOptionIndex === index && styles.selectedOptionSelector
                  ]}
                  onPress={() => handleSelectOption(index)}
                >
                  <Ionicons 
                    name={selectedOptionIndex === index ? "checkmark-circle" : "radio-button-off"} 
                    size={24} 
                    color={selectedOptionIndex === index ? Colors.light.tint : '#888'} 
                  />
                  <ThemedText style={[
                    styles.optionSelectorText,
                    selectedOptionIndex === index && styles.selectedOptionText
                  ]}>
                    My Pick
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ))}
            
            {betType === 'multiple' && (
              <TouchableOpacity 
                style={styles.addOptionButton}
                onPress={handleAddOption}
              >
                <Ionicons name="add-circle-outline" size={20} color={Colors.light.tint} />
                <ThemedText style={styles.addOptionText}>Add another option</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>

          {/* Bet parameters */}
          <ThemedView style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Bet Parameters</ThemedText>
            
            {/* Minimum wager input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Minimum Wager</ThemedText>
              <View style={styles.wagerInputContainer}>
                <ThemedText style={styles.currencySymbol}>$</ThemedText>
                <TextInput
                  style={styles.wagerInput}
                  value={minimumWager}
                  onChangeText={setMinimumWager}
                  placeholder="5.00"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            {/* Date picker */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Closing Date</ThemedText>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#888" />
                <ThemedText style={styles.dateText}>
                  {closingDate.toLocaleString()}
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            {showDatePicker && (
              <DateTimePicker
                value={closingDate}
                mode="datetime"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </ThemedView>
          
          {/* Initial bet amount */}
          <ThemedView style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Your Initial Bet</ThemedText>
            {selectedOptionIndex !== null ? (
              <ThemedText style={styles.selectedOptionText}>
                Your pick: {options[selectedOptionIndex].option || `Option ${selectedOptionIndex + 1}`}
              </ThemedText>
            ) : (
              <ThemedText style={styles.helperText}>
                Select one of the options above to place your initial bet
              </ThemedText>
            )}
            
            {/* Only show this section if an option is selected */}
            {selectedOptionIndex !== null && (
              <View style={styles.inputContainer}>
                {visibility === 'challenge' && (
                  <View style={styles.toggleContainer}>
                    <ThemedText style={styles.toggleLabel}>
                      Bet with non-monetary items
                    </ThemedText>
                    <Switch
                      value={useNonMonetaryWager}
                      onValueChange={setUseNonMonetaryWager}
                      trackColor={{ false: '#ccc', true: Colors.light.tint }}
                      thumbColor="#fff"
                    />
                  </View>
                )}
                
                {useNonMonetaryWager && visibility === 'challenge' ? (
                  <>
                    <ThemedText style={styles.inputLabel}>Wager Type</ThemedText>
                    <TextInput
                      style={styles.textInput}
                      value={nonMonetaryWager.type}
                      onChangeText={handleNonMonetaryTypeChange}
                      placeholder="e.g. Drinks, Dinner, Coffee"
                      placeholderTextColor="#888"
                    />
                    
                    <ThemedText style={styles.inputLabel}>Description</ThemedText>
                    <TextInput
                      style={styles.textInput}
                      value={nonMonetaryWager.description}
                      onChangeText={handleNonMonetaryDescriptionChange}
                      placeholder="e.g. 1 round of drinks"
                      placeholderTextColor="#888"
                      multiline
                    />
                  </>
                ) : (
                  <>
                    <ThemedText style={styles.inputLabel}>Initial Bet Amount</ThemedText>
                    <View style={styles.wagerInputContainer}>
                      <ThemedText style={styles.currencySymbol}>$</ThemedText>
                      <TextInput
                        style={styles.wagerInput}
                        value={initialBetAmount}
                        onChangeText={handleInitialBetAmountChange}
                        placeholder="10.00"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                      />
                    </View>
                  </>
                )}
              </View>
            )}
          </ThemedView>

          {/* Visibility options */}
          <ThemedView style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Who can see this bet?</ThemedText>
            <View style={styles.visibilityContainer}>
              <TouchableOpacity 
                style={[
                  styles.visibilityOption,
                  visibility === 'public' && styles.activeVisibilityOption
                ]}
                onPress={() => handleVisibilityChange('public')}
              >
                <Ionicons 
                  name="globe-outline" 
                  size={24} 
                  color={visibility === 'public' ? Colors.light.tint : '#888'} 
                />
                <ThemedText style={styles.visibilityOptionText}>Public</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.visibilityOption,
                  visibility === 'friends_only' && styles.activeVisibilityOption
                ]}
                onPress={() => handleVisibilityChange('friends_only')}
              >
                <Ionicons 
                  name="people-outline" 
                  size={24} 
                  color={visibility === 'friends_only' ? Colors.light.tint : '#888'} 
                />
                <ThemedText style={styles.visibilityOptionText}>Friends Only</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.visibilityOption,
                  visibility === 'challenge' && styles.activeVisibilityOption
                ]}
                onPress={() => handleVisibilityChange('challenge')}
              >
                <Ionicons 
                  name="flame-outline" 
                  size={24} 
                  color={visibility === 'challenge' ? Colors.light.tint : '#888'} 
                />
                <ThemedText style={styles.visibilityOptionText}>Challenge</ThemedText>
              </TouchableOpacity>
            </View>
            
            {(visibility === 'friends_only' || visibility === 'challenge') && (
              <ThemedView style={styles.friendsContainer}>
                <ThemedText style={styles.friendsTitle}>
                  {visibility === 'challenge' 
                    ? 'Select a friend to challenge:' 
                    : 'Select friends who can see this bet:'}
                </ThemedText>
                
                {friends.length === 0 ? (
                  <ThemedText style={styles.noFriendsText}>
                    No friends available. Try again later.
                  </ThemedText>
                ) : (
                  <FlatList
                    data={friends}
                    renderItem={renderFriendItem}
                    keyExtractor={(item) => item.user_id}
                    horizontal={visibility === 'challenge'}
                    numColumns={visibility === 'friends_only' ? 2 : undefined}
                    showsHorizontalScrollIndicator={false}
                  />
                )}
              </ThemedView>
            )}
          </ThemedView>
          
          {/* Error message */}
          {error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cancelButton: {
    padding: 8,
  },
  createButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  balanceText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.light.tint,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  wagerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    paddingLeft: 12,
    color: '#888',
  },
  wagerInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
  },
  helperText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  visibilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  visibilityOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
  },
  activeVisibilityOption: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderColor: Colors.light.tint,
  },
  visibilityOptionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  friendsContainer: {
    marginTop: 8,
  },
  friendsTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    margin: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    width: '48%',
  },
  selectedFriendItem: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderColor: Colors.light.tint,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  friendName: {
    fontSize: 14,
    flex: 1,
  },
  checkboxContainer: {
    padding: 8,
  },
  noFriendsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    padding: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  betTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  betTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeBetTypeButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderColor: Colors.light.tint,
  },
  betTypeText: {
    fontSize: 14,
    marginLeft: 6,
    color: '#555',
  },
  activeBetTypeText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  lineValueContainer: {
    marginBottom: 8,
  },
  lineValueInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  lineValueHelper: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginLeft: 4,
  },
  optionContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  optionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  disabledOptionInput: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  removeOptionButton: {
    marginLeft: 8,
    padding: 8,
  },
  optionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  selectedOptionSelector: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  optionSelectorText: {
    fontSize: 14,
    marginLeft: 4,
    color: '#666',
  },
  selectedOptionText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  addOptionText: {
    marginLeft: 8,
    color: Colors.light.tint,
    fontWeight: '500',
  },
});

// Debug note: This component allows users to create a new bet by specifying
// a description, options with odds, visibility settings, and a closing time 
// a description, options with odds, visibility settings, and a closing time 