// BetTypeSelector.tsx - Component for selecting bet type
// Following rule: Adding debug logs & comments for easier readability

import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Colors } from '../../constants/Colors';

// Bet type definition
export type BetType = 'yesno' | 'overunder' | 'multiple' | 'custom';

interface BetTypeSelectorProps {
  selectedType: BetType;
  onTypeSelect: (type: BetType) => void;
}

export const BetTypeSelector: React.FC<BetTypeSelectorProps> = ({ 
  selectedType, 
  onTypeSelect 
}) => {
  // Debug log
  console.debug(`[BetTypeSelector] Current selected type: ${selectedType}`);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Bet Type</ThemedText>
      
      <View style={styles.typeRow}>
        <TouchableOpacity 
          style={[
            styles.typeButton, 
            selectedType === 'yesno' && styles.selectedTypeButton
          ]}
          onPress={() => onTypeSelect('yesno')}
        >
          <ThemedText 
            style={[
              styles.typeText, 
              selectedType === 'yesno' && styles.selectedTypeText
            ]}
          >
            Yes/No
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.typeButton, 
            selectedType === 'overunder' && styles.selectedTypeButton
          ]}
          onPress={() => onTypeSelect('overunder')}
        >
          <ThemedText 
            style={[
              styles.typeText, 
              selectedType === 'overunder' && styles.selectedTypeText
            ]}
          >
            Over/Under
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      <View style={styles.typeRow}>
        <TouchableOpacity 
          style={[
            styles.typeButton, 
            selectedType === 'multiple' && styles.selectedTypeButton
          ]}
          onPress={() => onTypeSelect('multiple')}
        >
          <ThemedText 
            style={[
              styles.typeText, 
              selectedType === 'multiple' && styles.selectedTypeText
            ]}
          >
            Multiple Choice
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.typeButton, 
            selectedType === 'custom' && styles.selectedTypeButton
          ]}
          onPress={() => onTypeSelect('custom')}
        >
          <ThemedText 
            style={[
              styles.typeText, 
              selectedType === 'custom' && styles.selectedTypeText
            ]}
          >
            Custom
          </ThemedText>
        </TouchableOpacity>
      </View>
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
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedTypeButton: {
    backgroundColor: '#0a7ea4', // Using the tintColorLight value from Colors
  },
  typeText: {
    fontSize: 15,
    fontWeight: '500',
  },
  selectedTypeText: {
    color: '#FFFFFF',
  },
}); 