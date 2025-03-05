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
  Dimensions
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

interface BetOption {
  option: string;
  initial_odds: number;
}

export const CreateBetForm: React.FC<CreateBetFormProps> = ({ 
  userId, 
  onBetCreated,
  onCancel
}) => {
  // Debug log
  console.debug('[CreateBetForm] Rendering form for user:', userId);

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
  
  // New state variables for creator's initial bet
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [initialBetAmount, setInitialBetAmount] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  
  // Fetch friends and user balance on component mount
  useEffect(() => {
    fetchFriends();
    fetchUserBalance();
  }, [userId]);

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
        // If API call fails, set a default balance for demo purposes
        console.debug('[CreateBetForm] Using default balance');
        setUserBalance(1000);
      }
    } catch (error) {
      console.error('[CreateBetForm] Error fetching user balance:', error);
      // Set a default balance for demo purposes
      setUserBalance(1000);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleAddOption = () => {
    console.debug('[CreateBetForm] Adding new bet option');
    setOptions([...options, { option: '', initial_odds: 2.0 }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      Alert.alert('Error', 'A bet must have at least 2 options');
      return;
    }
    
    console.debug(`[CreateBetForm] Removing bet option at index: ${index}`);
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleOptionChange = (text: string, index: number) => {
    const newOptions = [...options];
    newOptions[index].option = text;
    setOptions(newOptions);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      console.debug(`[CreateBetForm] Selected closing date: ${selectedDate.toISOString()}`);
      setClosingDate(selectedDate);
    }
  };

  const handleVisibilityChange = (newVisibility: 'public' | 'friends_only' | 'challenge') => {
    console.debug(`[CreateBetForm] Changed visibility to: ${newVisibility}`);
    setVisibility(newVisibility);
    if (newVisibility === 'challenge' && selectedFriends.length === 0) {
      setSelectedFriends([]);
    }
  };

  const handleToggleFriend = (friendId: string) => {
    console.debug(`[CreateBetForm] Toggling friend: ${friendId}`);
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleSelectOption = (index: number) => {
    console.debug(`[CreateBetForm] Selected option index: ${index}`);
    setSelectedOptionIndex(index);
  };
  
  const handleInitialBetAmountChange = (text: string) => {
    // Only allow numeric input with up to 2 decimal places
    if (/^\d*\.?\d{0,2}$/.test(text)) {
      console.debug(`[CreateBetForm] Initial bet amount changed: ${text}`);
      setInitialBetAmount(text);
    }
  };

  const handleCreateBet = async () => {
    try {
      // Validate inputs
      if (!description.trim()) {
        setError('Please enter a description');
        return;
      }
      
      if (options.some(opt => !opt.option.trim())) {
        setError('Please fill in all options');
        return;
      }
      
      if (selectedOptionIndex === null) {
        setError('Please select an option to bet on');
        return;
      }
      
      if (!initialBetAmount || parseFloat(initialBetAmount) <= 0) {
        setError('Please enter a valid bet amount');
        return;
      }
      
      if (parseFloat(initialBetAmount) > userBalance) {
        setError('Insufficient balance for this bet');
        return;
      }
      
      if (minimumWager && (isNaN(parseFloat(minimumWager)) || parseFloat(minimumWager) <= 0)) {
        setError('Please enter a valid minimum wager');
        return;
      }
      
      if (visibility === 'challenge' && selectedFriends.length === 0) {
        setError('Please select at least one friend to challenge');
        return;
      }
      
      setLoading(true);
      setError('');
      
      // Format options for API
      const formattedOptions: Record<string, { option: string; initial_odds: number }> = {};
      options.forEach((opt, index) => {
        formattedOptions[`option_${index + 1}`] = {
          option: opt.option,
          initial_odds: opt.initial_odds
        };
      });
      
      // Create bet payload
      const betPayload = {
        creator_id: userId,
        event_description: description,
        bet_options: formattedOptions,
        bet_closing_time: closingDate.toISOString(),
        minimum_wager: minimumWager ? parseFloat(minimumWager) : 0,
        visibility,
        challenged_users: visibility === 'challenge' ? selectedFriends : [],
        creator_bet: {
          option_key: `option_${selectedOptionIndex + 1}`,
          amount: parseFloat(initialBetAmount)
        }
      };
      
      console.debug('[CreateBetForm] Creating bet with payload:', betPayload);
      
      // Send request to create bet
      const response = await fetch('https://sidebet-api.onrender.com/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(betPayload),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.debug('[CreateBetForm] Bet created successfully:', data.bet);
        onBetCreated();
      } else {
        setError(data.message || 'Failed to create bet');
      }
    } catch (error) {
      console.error('[CreateBetForm] Error creating bet:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFriendItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.friendItem,
        selectedFriends.includes(item.user_id) && styles.selectedFriendItem
      ]}
      onPress={() => handleToggleFriend(item.user_id)}
    >
      <View style={styles.friendInfo}>
        <Image
          source={{ uri: item.profile_image || `https://i.pravatar.cc/150?u=${item.user_id}` }}
          style={styles.friendAvatar}
        />
        <ThemedText style={styles.friendName}>{item.username}</ThemedText>
      </View>
      <View style={styles.checkboxContainer}>
        {selectedFriends.includes(item.user_id) && (
          <Ionicons name="checkmark-circle" size={24} color={Colors.light.tint} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <View style={styles.formContainer}>
          <View style={styles.dragIndicator} />
          
          <LinearGradient
            colors={['#2a2a2a', '#1a1a1a']}
            style={styles.headerGradient}
          >
            <ThemedText style={styles.title}>Create a Bet</ThemedText>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ff4d4d" />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : null}
            
            <View style={styles.balanceContainer}>
              {isLoadingBalance ? (
                <ActivityIndicator size="small" color={Colors.light.tint} />
              ) : (
                <View style={styles.balanceContent}>
                  <Ionicons name="wallet-outline" size={18} color="#fff" />
                  <ThemedText style={styles.balanceText}>
                    Balance: ${userBalance.toFixed(2)}
                  </ThemedText>
                </View>
              )}
            </View>
          </LinearGradient>
          
          <View style={styles.formContent}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>What's the bet?</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g., Will it rain tomorrow?"
                placeholderTextColor="#666"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Options</ThemedText>
              {options.map((option, index) => (
                <View key={index} style={styles.optionContainer}>
                  <View style={styles.optionInputContainer}>
                    <TextInput
                      style={styles.optionInput}
                      placeholder={`Option ${index + 1}`}
                      placeholderTextColor="#666"
                      value={option.option}
                      onChangeText={(text) => handleOptionChange(text, index)}
                    />
                    {index > 1 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveOption(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#ff4d4d" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.optionSelectButton,
                      selectedOptionIndex === index ? styles.selectedOption : {}
                    ]}
                    onPress={() => handleSelectOption(index)}
                  >
                    <ThemedText style={styles.optionSelectText}>
                      {selectedOptionIndex === index ? 'Selected' : 'Select'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
              
              {options.length < 5 && (
                <TouchableOpacity style={styles.addButton} onPress={handleAddOption}>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <ThemedText style={styles.addButtonText}>Add Option</ThemedText>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Your Initial Bet</ThemedText>
              
              <View style={styles.betAmountContainer}>
                <TextInput
                  style={styles.betAmountInput}
                  placeholder="Enter amount"
                  placeholderTextColor="#666"
                  value={initialBetAmount}
                  onChangeText={handleInitialBetAmountChange}
                  keyboardType="decimal-pad"
                />
                <View style={styles.currencyContainer}>
                  <ThemedText style={styles.currencyText}>$</ThemedText>
                </View>
              </View>
              
              {selectedOptionIndex !== null && (
                <View style={styles.selectedBetContainer}>
                  <ThemedText style={styles.selectedBetText}>
                    You're betting on: {options[selectedOptionIndex]?.option || 'Select an option'}
                  </ThemedText>
                </View>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Closing Date</ThemedText>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#fff" />
                <ThemedText style={styles.dateText}>
                  {closingDate.toLocaleDateString()} at {closingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={closingDate}
                  mode="datetime"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Minimum Wager (Optional)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Enter minimum amount"
                placeholderTextColor="#666"
                value={minimumWager}
                onChangeText={setMinimumWager}
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Visibility</ThemedText>
              <View style={styles.visibilityContainer}>
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    visibility === 'public' ? styles.selectedVisibility : {},
                  ]}
                  onPress={() => handleVisibilityChange('public')}
                >
                  <Ionicons
                    name="globe-outline"
                    size={20}
                    color={visibility === 'public' ? '#fff' : '#888'}
                  />
                  <ThemedText
                    style={[
                      styles.visibilityText,
                      visibility === 'public' ? styles.selectedVisibilityText : {},
                    ]}
                  >
                    Public
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    visibility === 'friends_only' ? styles.selectedVisibility : {},
                  ]}
                  onPress={() => handleVisibilityChange('friends_only')}
                >
                  <Ionicons
                    name="people-outline"
                    size={20}
                    color={visibility === 'friends_only' ? '#fff' : '#888'}
                  />
                  <ThemedText
                    style={[
                      styles.visibilityText,
                      visibility === 'friends_only' ? styles.selectedVisibilityText : {},
                    ]}
                  >
                    Friends
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    visibility === 'challenge' ? styles.selectedVisibility : {},
                  ]}
                  onPress={() => handleVisibilityChange('challenge')}
                >
                  <Ionicons
                    name="flame-outline"
                    size={20}
                    color={visibility === 'challenge' ? '#fff' : '#888'}
                  />
                  <ThemedText
                    style={[
                      styles.visibilityText,
                      visibility === 'challenge' ? styles.selectedVisibilityText : {},
                    ]}
                  >
                    Challenge
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            
            {visibility === 'challenge' && (
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Select Friends to Challenge</ThemedText>
                <FlatList
                  data={friends}
                  keyExtractor={(item) => item.user_id}
                  renderItem={renderFriendItem}
                  style={styles.friendsList}
                  ListEmptyComponent={
                    <ThemedText style={styles.emptyText}>No friends found</ThemedText>
                  }
                />
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.createButton, loading ? styles.disabledButton : {}]}
                onPress={handleCreateBet}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.createButtonText}>Create Bet</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    paddingBottom: 40, // Extra padding at bottom for better scrolling
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginVertical: 10,
  },
  headerGradient: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    backgroundColor: 'rgba(255,77,77,0.1)',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 14,
    marginLeft: 8,
  },
  balanceContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  balanceText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#fff',
    fontWeight: '600',
  },
  formContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    fontSize: 16,
  },
  optionContainer: {
    marginBottom: 12,
  },
  optionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    fontSize: 16,
  },
  removeButton: {
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    marginLeft: 8,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  optionSelectButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: Colors.light.tint,
  },
  optionSelectText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  betAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  betAmountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 12,
    paddingRight: 30,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  selectedBetContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedBetText: {
    fontSize: 14,
    color: '#fff',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dateText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
  },
  visibilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  visibilityOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  selectedVisibility: {
    backgroundColor: `${Colors.light.tint}30`,
    borderColor: Colors.light.tint,
  },
  visibilityText: {
    marginTop: 4,
    color: '#888',
    fontSize: 14,
  },
  selectedVisibilityText: {
    color: '#fff',
    fontWeight: '600',
  },
  friendsList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  selectedFriendItem: {
    backgroundColor: `${Colors.light.tint}20`,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  friendName: {
    fontSize: 14,
    color: '#fff',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    padding: 16,
    marginLeft: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

// Debug note: This component allows users to create a new bet by specifying
// a description, options with odds, visibility settings, and a closing time 