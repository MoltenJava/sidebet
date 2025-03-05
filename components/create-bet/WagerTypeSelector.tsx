// WagerTypeSelector.tsx - Component for selecting wager types
// Following rule: Adding debug logs & comments for easier readability

import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';

export type WagerType = 'money' | 'lunch' | 'coffee' | 'drinks' | 'custom';

export interface NonMonetaryWager {
  type: WagerType;
  description: string;
}

interface WagerTypeSelectorProps {
  selectedWagerType: WagerType;
  nonMonetaryWager: NonMonetaryWager;
  initialBetAmount: string;
  onWagerTypeSelect: (type: WagerType) => void;
  onNonMonetaryTypeChange: (text: string) => void;
  onNonMonetaryDescriptionChange: (text: string) => void;
  onInitialBetAmountChange: (text: string) => void;
}

export const WagerTypeSelector: React.FC<WagerTypeSelectorProps> = ({
  selectedWagerType,
  nonMonetaryWager,
  initialBetAmount,
  onWagerTypeSelect,
  onNonMonetaryTypeChange,
  onNonMonetaryDescriptionChange,
  onInitialBetAmountChange,
}) => {
  // Debug log
  console.debug(`[WagerTypeSelector] Current wager type: ${selectedWagerType}`);

  // Local state to track which types are displayed
  const [showAllTypes, setShowAllTypes] = useState<boolean>(false);

  // Main wager types
  const mainWagerTypes: WagerType[] = ['money', 'lunch', 'coffee', 'drinks'];
  
  // Only show 3 options by default + custom
  const visibleTypes = showAllTypes ? mainWagerTypes : mainWagerTypes.slice(0, 3);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Wager Type</ThemedText>

      <View style={styles.wagerTypesContainer}>
        {/* Main wager types */}
        {visibleTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.wagerTypeButton,
              selectedWagerType === type && styles.selectedWagerTypeButton
            ]}
            onPress={() => onWagerTypeSelect(type)}
          >
            <ThemedText
              style={[
                styles.wagerTypeText,
                selectedWagerType === type && styles.selectedWagerTypeText
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </ThemedText>
          </TouchableOpacity>
        ))}

        {/* Toggle show more/less button */}
        {!showAllTypes && mainWagerTypes.length > 3 && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowAllTypes(true)}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Custom option */}
        <TouchableOpacity
          style={[
            styles.wagerTypeButton,
            selectedWagerType === 'custom' && styles.selectedWagerTypeButton
          ]}
          onPress={() => onWagerTypeSelect('custom')}
        >
          <ThemedText
            style={[
              styles.wagerTypeText,
              selectedWagerType === 'custom' && styles.selectedWagerTypeText
            ]}
          >
            Custom
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Monetary wager input */}
      {selectedWagerType === 'money' && (
        <View style={styles.amountContainer}>
          <ThemedText style={styles.label}>Initial Wager Amount</ThemedText>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.dollarSign}>$</ThemedText>
            <TextInput
              style={styles.amountInput}
              value={initialBetAmount}
              onChangeText={onInitialBetAmountChange}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      )}

      {/* Non-monetary wager inputs */}
      {selectedWagerType !== 'money' && (
        <View style={styles.nonMonetaryContainer}>
          {selectedWagerType === 'custom' && (
            <View style={styles.inputWrapper}>
              <ThemedText style={styles.label}>Custom Wager Type</ThemedText>
              <TextInput
                style={styles.textInput}
                value={nonMonetaryWager.type === 'custom' ? nonMonetaryWager.description : ''}
                onChangeText={onNonMonetaryTypeChange}
                placeholder="e.g., Ice Cream, Movie Ticket"
                placeholderTextColor="#999"
              />
            </View>
          )}
          
          <View style={styles.inputWrapper}>
            <ThemedText style={styles.label}>
              {selectedWagerType === 'custom' ? 'Additional Details' : 'Wager Details'}
            </ThemedText>
            <TextInput
              style={styles.textInput}
              value={nonMonetaryWager.description}
              onChangeText={onNonMonetaryDescriptionChange}
              placeholder={`Describe the ${selectedWagerType} wager details`}
              placeholderTextColor="#999"
              multiline
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  wagerTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  wagerTypeButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedWagerTypeButton: {
    backgroundColor: '#0a7ea4',
  },
  wagerTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedWagerTypeText: {
    color: '#FFFFFF',
  },
  showMoreButton: {
    backgroundColor: '#2A2A2A',
    height: 35,
    width: 35,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  amountContainer: {
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  inputContainer: {
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
  nonMonetaryContainer: {
    marginTop: 10,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  textInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 45,
  },
}); 