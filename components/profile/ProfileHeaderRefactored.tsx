// ProfileHeaderRefactored.tsx - Refactored header component for the user profile
// Following rule: Adding debug logs & comments for easier readability

import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User } from '../../constants/Models';

interface ProfileHeaderRefactoredProps {
  user: User | null;
  activeTab: 'active' | 'history';
  onTabChange: (tab: 'active' | 'history') => void;
}

export const ProfileHeaderRefactored: React.FC<ProfileHeaderRefactoredProps> = ({
  user,
  activeTab,
  onTabChange,
}) => {
  // Debug log
  console.debug(`[ProfileHeaderRefactored] Rendering header for user: ${user?.username}`);
  
  // Get safe area insets for proper iPhone spacing
  const insets = useSafeAreaInsets();
  
  // Calculate top padding to ensure content doesn't overlap with status bar
  const topPadding = Math.max(insets.top, 20);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a7ea4', '#064C69']}
        style={[
          styles.headerGradient,
          { paddingTop: topPadding }
        ]}
      >
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          {user?.profile_image ? (
            <Image
              source={{ uri: user.profile_image }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={40} color="#FFF" />
            </View>
          )}
          
          <View style={styles.profileInfo}>
            <ThemedText style={styles.username}>
              {user?.username || 'Loading...'}
            </ThemedText>
            
            <View style={styles.balanceContainer}>
              <Ionicons name="wallet-outline" size={16} color="#FFF" />
              <ThemedText style={styles.balanceText}>
                ${user?.wallet_balance.toFixed(2) || '0.00'}
              </ThemedText>
            </View>
          </View>
        </View>
        
        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'active' && styles.activeTabButton
            ]}
            onPress={() => onTabChange('active')}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === 'active' && styles.activeTabText
              ]}
            >
              Active Bets
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'history' && styles.activeTabButton
            ]}
            onPress={() => onTabChange('history')}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === 'history' && styles.activeTabText
              ]}
            >
              Bet History
            </ThemedText>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#151718',
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    marginLeft: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  balanceText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: '600',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
}); 