// FriendSelector.tsx - Component for selecting friends to challenge
// Following rule: Adding debug logs & comments for easier readability

import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../constants/Models';

interface FriendSelectorProps {
  showFriends: boolean;
  friends: User[];
  selectedFriends: string[];
  onToggleFriend: (friendId: string) => void;
}

export const FriendSelector: React.FC<FriendSelectorProps> = ({
  showFriends,
  friends,
  selectedFriends,
  onToggleFriend,
}) => {
  // Debug log
  console.debug(`[FriendSelector] Rendering with ${friends.length} friends, ${selectedFriends.length} selected`);

  // Only render if we should show friends (challenge visibility)
  if (!showFriends) return null;

  // Render each friend item
  const renderFriendItem = ({ item }: { item: User }) => {
    const isSelected = selectedFriends.includes(item.user_id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.friendItem,
          isSelected && styles.selectedFriendItem
        ]} 
        onPress={() => onToggleFriend(item.user_id)}
      >
        {item.profile_image ? (
          <Image source={{ uri: item.profile_image }} style={styles.profileImage} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Ionicons name="person" size={20} color="#999" />
          </View>
        )}
        
        <ThemedText style={styles.friendName}>{item.username}</ThemedText>
        
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Select Friends to Challenge</ThemedText>
      
      {friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people" size={24} color="#999" />
          <ThemedText style={styles.emptyText}>No friends available</ThemedText>
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.user_id}
          style={styles.friendsList}
          contentContainerStyle={styles.friendsContent}
        />
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
  friendsList: {
    maxHeight: 200,
  },
  friendsContent: {
    paddingVertical: 5,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFriendItem: {
    backgroundColor: 'rgba(10, 126, 164, 0.2)',
    borderColor: '#0a7ea4',
    borderWidth: 1,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  profilePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendName: {
    flex: 1,
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  emptyState: {
    padding: 20,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
}); 