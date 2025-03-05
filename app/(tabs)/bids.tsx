// bids.tsx - Screen for displaying bets in the bidding phase
// Following rule: Adding debug logs & comments for easier readability

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  View, 
  Platform, 
  StatusBar,
  Alert,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BetCard } from '@/components/BetCard';
import { PlaceBetForm } from '@/components/PlaceBetForm';
import { ApiService } from '@/constants/ApiService';
import { Bet } from '@/constants/Models';
import { Colors } from '@/constants/Colors';

export default function BidsScreen() {
  // Debug log
  console.debug('[BidsScreen] Rendering bids screen');

  const [bids, setBids] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [showBetModal, setShowBetModal] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>('');

  // Fetch bids on component mount
  useEffect(() => {
    fetchBids();
    fetchCurrentUser();
  }, []);

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      console.debug('[BidsScreen] Fetching current user');
      const user = await ApiService.getCurrentUser();
      setUserId(user.user_id);
    } catch (error) {
      console.error('[BidsScreen] Error fetching current user:', error);
      Alert.alert('Error', 'Failed to fetch user information. Please try again.');
    }
  };

  // Fetch bids
  const fetchBids = async () => {
    try {
      console.debug('[BidsScreen] Fetching bids');
      setIsLoading(true);
      const allBets = await ApiService.getBets();
      
      // Filter for bets in the bidding phase
      const bidsList = allBets.filter(bet => bet.status === 'bid');
      console.debug(`[BidsScreen] Found ${bidsList.length} bids`);
      
      setBids(bidsList);
    } catch (error) {
      console.error('[BidsScreen] Error fetching bids:', error);
      Alert.alert('Error', 'Failed to load bids. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    console.debug('[BidsScreen] Refreshing bids');
    setRefreshing(true);
    fetchBids();
  };

  // Handle bid selection
  const handleBidPress = (bid: Bet) => {
    console.debug(`[BidsScreen] Selected bid: ${bid.bet_id}`);
    setSelectedBet(bid);
    setShowBetModal(true);
  };

  // Handle bet placed
  const handleBetPlaced = () => {
    console.debug('[BidsScreen] Bet placed, closing modal and refreshing');
    setShowBetModal(false);
    setSelectedBet(null);
    fetchBids();
  };

  // Handle modal close
  const handleCloseModal = () => {
    console.debug('[BidsScreen] Closing bet modal');
    setShowBetModal(false);
    setSelectedBet(null);
  };

  // Render loading state
  if (isLoading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading bids...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ThemedView style={styles.container}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerTitle}>Bids</ThemedText>
        </ThemedView>
        
        {/* Bids list */}
        <FlatList
          data={bids}
          keyExtractor={(item) => item.bet_id}
          renderItem={({ item }) => (
            <BetCard bet={item} onPress={handleBidPress} />
          )}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="pricetag-outline" size={48} color="#888" />
              <ThemedText style={styles.emptyText}>No bids available</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Create a new bet to start a bid or check back later
              </ThemedText>
            </ThemedView>
          }
        />
        
        {/* Place bet modal */}
        <Modal
          visible={showBetModal}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseModal}
        >
          <TouchableWithoutFeedback onPress={handleCloseModal}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.dragIndicator} />
                  <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>
                      Place a Bid
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={handleCloseModal}
                    >
                      <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  
                  {selectedBet && userId && (
                    <PlaceBetForm
                      bet={selectedBet}
                      userId={userId}
                      onBetPlaced={handleBetPlaced}
                      onCancel={handleCloseModal}
                    />
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 80, // Extra padding for floating button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    height: '85%',
    width: '100%',
    overflow: 'hidden',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#000',
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
}); 