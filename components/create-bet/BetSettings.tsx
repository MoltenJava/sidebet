// BetSettings.tsx - Component for bet timing and visibility settings
// Following rule: Adding debug logs & comments for easier readability

import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

type VisibilityType = 'public' | 'friends_only' | 'challenge';

interface BetSettingsProps {
  selectedDate: Date;
  selectedVisibility: VisibilityType;
  onDateChange: (event: any, selectedDate?: Date) => void;
  onVisibilityChange: (visibility: VisibilityType) => void;
}

export const BetSettings: React.FC<BetSettingsProps> = ({
  selectedDate,
  selectedVisibility,
  onDateChange,
  onVisibilityChange,
}) => {
  // Debug log
  console.debug(`[BetSettings] Rendering with date: ${selectedDate}, visibility: ${selectedVisibility}`);

  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Convert date to readable format
  const formatDate = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Toggle date picker visibility
  const toggleDatePicker = () => {
    setShowDatePicker(prev => !prev);
  };

  // Handle date change
  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    onDateChange(event, date);
  };

  return (
    <View style={styles.container}>
      {/* Bet Closing Time */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Bet Closing Time</ThemedText>
        
        <TouchableOpacity 
          style={styles.dateSelector}
          onPress={toggleDatePicker}
        >
          <Ionicons name="calendar-outline" size={20} color="#FFF" style={styles.icon} />
          <ThemedText style={styles.dateText}>{formatDate(selectedDate)}</ThemedText>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </View>

      {/* Visibility Settings */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Visibility</ThemedText>
        
        <View style={styles.visibilityOptions}>
          <TouchableOpacity
            style={[
              styles.visibilityButton,
              selectedVisibility === 'public' && styles.selectedVisibilityButton
            ]}
            onPress={() => onVisibilityChange('public')}
          >
            <Ionicons 
              name="globe-outline" 
              size={20} 
              color={selectedVisibility === 'public' ? '#FFF' : '#999'} 
              style={styles.visibilityIcon} 
            />
            <ThemedText 
              style={[
                styles.visibilityText,
                selectedVisibility === 'public' && styles.selectedVisibilityText
              ]}
            >
              Public
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.visibilityButton,
              selectedVisibility === 'friends_only' && styles.selectedVisibilityButton
            ]}
            onPress={() => onVisibilityChange('friends_only')}
          >
            <Ionicons 
              name="people-outline" 
              size={20} 
              color={selectedVisibility === 'friends_only' ? '#FFF' : '#999'} 
              style={styles.visibilityIcon} 
            />
            <ThemedText 
              style={[
                styles.visibilityText,
                selectedVisibility === 'friends_only' && styles.selectedVisibilityText
              ]}
            >
              Friends Only
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.visibilityButton,
              selectedVisibility === 'challenge' && styles.selectedVisibilityButton
            ]}
            onPress={() => onVisibilityChange('challenge')}
          >
            <Ionicons 
              name="flash-outline" 
              size={20} 
              color={selectedVisibility === 'challenge' ? '#FFF' : '#999'} 
              style={styles.visibilityIcon} 
            />
            <ThemedText 
              style={[
                styles.visibilityText,
                selectedVisibility === 'challenge' && styles.selectedVisibilityText
              ]}
            >
              Challenge
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
  },
  icon: {
    marginRight: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
  },
  visibilityOptions: {
    flexDirection: 'column',
    gap: 10,
  },
  visibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
  },
  selectedVisibilityButton: {
    backgroundColor: '#0a7ea4',
  },
  visibilityIcon: {
    marginRight: 10,
  },
  visibilityText: {
    fontSize: 16,
  },
  selectedVisibilityText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
}); 