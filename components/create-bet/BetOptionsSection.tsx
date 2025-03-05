// BetOptionsSection.tsx - Component for managing bet options
// Following rule: Adding debug logs & comments for easier readability

import React from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { BetType } from './BetTypeSelector';

export interface BetOption {
  option: string;
  initial_odds: number;
}

interface BetOptionsSectionProps {
  betType: BetType;
  options: BetOption[];
  lineValue: string;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onOptionChange: (text: string, index: number) => void;
  onLineValueChange: (text: string) => void;
}

export const BetOptionsSection: React.FC<BetOptionsSectionProps> = ({
  betType,
  options,
  lineValue,
  onAddOption,
  onRemoveOption,
  onOptionChange,
  onLineValueChange,
}) => {
  // Debug log
  console.debug(`[BetOptionsSection] Rendering with ${options.length} options, bet type: ${betType}`);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Bet Options</ThemedText>
      
      {betType === 'yesno' && (
        <View>
          <ThemedText style={styles.optionLabel}>Yes/No Question</ThemedText>
          <View style={styles.optionContainer}>
            <TextInput
              style={styles.optionInput}
              value={options[0]?.option || ''}
              onChangeText={(text) => onOptionChange(text, 0)}
              placeholder="e.g., Will Atticus go to bed before 10pm?"
              placeholderTextColor="#999"
            />
          </View>
        </View>
      )}
      
      {betType === 'overunder' && (
        <View>
          <ThemedText style={styles.optionLabel}>Line Value</ThemedText>
          <View style={styles.optionContainer}>
            <TextInput
              style={styles.optionInput}
              value={lineValue}
              onChangeText={onLineValueChange}
              placeholder="e.g., 10:00 PM"
              placeholderTextColor="#999"
              keyboardType="default"
            />
          </View>
        </View>
      )}
      
      {betType === 'multiple' && (
        <View>
          {options.map((option, index) => (
            <View key={index} style={styles.optionRow}>
              <View style={styles.optionContainer}>
                <TextInput
                  style={styles.optionInput}
                  value={option.option}
                  onChangeText={(text) => onOptionChange(text, index)}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor="#999"
                />
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => onRemoveOption(index)}
              >
                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={onAddOption}
          >
            <Ionicons name="add-circle" size={20} color="#0a7ea4" />
            <ThemedText style={styles.addButtonText}>Add Option</ThemedText>
          </TouchableOpacity>
        </View>
      )}
      
      {betType === 'custom' && (
        <View>
          {options.map((option, index) => (
            <View key={index} style={styles.optionRow}>
              <View style={styles.optionContainer}>
                <TextInput
                  style={styles.optionInput}
                  value={option.option}
                  onChangeText={(text) => onOptionChange(text, index)}
                  placeholder={`Custom Option ${index + 1}`}
                  placeholderTextColor="#999"
                />
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => onRemoveOption(index)}
              >
                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={onAddOption}
          >
            <Ionicons name="add-circle" size={20} color="#0a7ea4" />
            <ThemedText style={styles.addButtonText}>Add Custom Option</ThemedText>
          </TouchableOpacity>
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
  optionLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  optionContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginBottom: 12,
    flex: 1,
  },
  optionInput: {
    height: 45,
    color: '#FFFFFF',
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeButton: {
    marginLeft: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  addButtonText: {
    color: '#0a7ea4',
    marginLeft: 5,
    fontSize: 16,
  },
}); 