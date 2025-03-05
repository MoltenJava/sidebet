// BetCard.tsx - Card component to display bet information
// Following rule: Adding debug logs & comments for easier readability

import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Bet } from '../constants/Models';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

interface BetCardProps {
  bet: Bet;
  onPress: (bet: Bet) => void;
}

export const BetCard: React.FC<BetCardProps> = ({ bet, onPress }) => {
  // Debug log
  console.debug(`[BetCard] Rendering card for bet: ${bet.bet_id}`);

  // Format the closing time
  const closingTime = new Date(bet.bet_closing_time);
  const formatTimeRemaining = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Closed';
    }
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h left`;
    } else if (diffHours > 0) {
      return `${diffHours}h left`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes}m left`;
    }
  };
  
  const timeRemaining = formatTimeRemaining(closingTime);
  
  // Get the top 2 options to display
  const topOptions = Object.keys(bet.bet_options).slice(0, 2);
  const hasMoreOptions = Object.keys(bet.bet_options).length > 2;

  // Calculate time remaining until bet closes
  const timeRemainingUntilClose = new Date(bet.bet_closing_time).getTime() - Date.now();
  const isExpiringSoon = timeRemainingUntilClose < 3600000; // Less than 1 hour
  
  // Get gradient colors based on bet status
  const getGradientColors = () => {
    switch (bet.status) {
      case 'bid':
        return ['#FF9800', '#F57C00'];
      case 'open':
        return ['#4CAF50', '#388E3C'];
      case 'locked':
        return ['#2196F3', '#1976D2'];
      case 'settled':
        return ['#9C27B0', '#7B1FA2'];
      case 'disputed':
        return ['#F44336', '#D32F2F'];
      default:
        return ['#607D8B', '#455A64'];
    }
  };
  
  // Get emoji for bet status
  const getStatusEmoji = () => {
    switch (bet.status) {
      case 'bid':
        return '🔥';
      case 'open':
        return '🎲';
      case 'locked':
        return '🔒';
      case 'settled':
        return '🏆';
      case 'disputed':
        return '⚠️';
      default:
        return '📊';
    }
  };
  
  // Calculate total wagered
  const totalWagered = Object.values(bet.bet_options).reduce(
    (sum, option) => sum + option.total_wagered, 0
  );

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(bet)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientHeader}
      >
        <View style={styles.statusContainer}>
          <ThemedText style={styles.statusEmoji}>{getStatusEmoji()}</ThemedText>
          <ThemedText style={styles.statusText}>
            {bet.status === 'bid' ? 'BIDDING' : bet.status.toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={16} color="#fff" />
          <ThemedText style={styles.timeText}>{timeRemaining}</ThemedText>
        </View>
      </LinearGradient>
      
      <ThemedView style={styles.card}>
        <View style={styles.creatorInfo}>
          <Image 
            source={{ uri: `https://i.pravatar.cc/150?u=${bet.creator_id}` }} 
            style={styles.avatar} 
          />
          <ThemedText style={styles.creatorName} numberOfLines={1}>
            {bet.creator_name || 'Anonymous'}
          </ThemedText>
        </View>
        
        <ThemedText style={styles.description}>{bet.event_description}</ThemedText>
        
        <View style={styles.optionsContainer}>
          {topOptions.map(key => (
            <View key={key} style={styles.optionItem}>
              <View style={styles.optionTextContainer}>
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.light.tint} />
                <ThemedText style={styles.optionText}>{bet.bet_options[key].option}</ThemedText>
              </View>
              <View style={styles.oddsContainer}>
                <ThemedText style={styles.oddsText}>{bet.bet_options[key].odds.toFixed(2)}x</ThemedText>
              </View>
            </View>
          ))}
          
          {hasMoreOptions && (
            <ThemedText style={styles.moreOptions}>
              +{Object.keys(bet.bet_options).length - 2} more options
            </ThemedText>
          )}
        </View>
        
        <View style={styles.footer}>
          {/* Minimum wager if applicable */}
          {bet.minimum_wager && bet.minimum_wager > 0 && (
            <View style={styles.minWagerContainer}>
              <Ionicons name="cash-outline" size={14} color={Colors.light.tint} />
              <ThemedText style={styles.minWagerText}>
                Min: ${bet.minimum_wager.toFixed(2)}
              </ThemedText>
            </View>
          )}
          
          {/* Total wagered */}
          <View style={styles.totalWageredContainer}>
            <Ionicons name="wallet-outline" size={14} color="#888" />
            <ThemedText style={styles.totalWageredText}>
              ${totalWagered.toFixed(2)} wagered
            </ThemedText>
          </View>
          
          {/* Visibility */}
          <View style={styles.visibilityContainer}>
            {bet.visibility === 'public' ? (
              <Ionicons name="globe-outline" size={14} color="#888" />
            ) : bet.visibility === 'friends_only' ? (
              <Ionicons name="people-outline" size={14} color="#888" />
            ) : (
              <Ionicons name="person-outline" size={14} color="#888" />
            )}
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusEmoji: {
    fontSize: 16,
    marginRight: 6,
    color: '#fff',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    padding: 16,
    backgroundColor: '#fff',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  creatorName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  description: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 22,
    color: '#333',
  },
  optionsContainer: {
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  optionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
    color: '#333',
  },
  oddsContainer: {
    backgroundColor: `${Colors.light.tint}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  oddsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  moreOptions: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  minWagerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minWagerText: {
    fontSize: 12,
    marginLeft: 4,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  totalWageredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalWageredText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#888',
  },
  visibilityContainer: {
    width: 20,
    alignItems: 'center',
  },
});

// Debug note: This component displays a bet card with creator info,
// bet description, options, and stats 