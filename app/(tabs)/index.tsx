import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  View, 
  Modal, 
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BetCard } from '@/components/BetCard';
import { PlaceBetForm } from '@/components/PlaceBetForm';
import { CreateBetForm } from '@/components/CreateBetForm';
import { ApiService } from '@/constants/ApiService';
import { Bet } from '@/constants/Models';
import { Colors } from '@/constants/Colors';

export default function HomeScreen() {
  // Debug log
  console.debug('[HomeScreen] Rendering home screen');

  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [showPlaceBetModal, setShowPlaceBetModal] = useState<boolean>(false);
  const [showCreateBetModal, setShowCreateBetModal] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Fetch current user and bets on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.debug('[HomeScreen] Fetching initial data');
        
        // Get current user
        const user = await ApiService.getCurrentUser();
        setCurrentUserId(user.user_id);
        
        // Get all bets
        await fetchBets();
      } catch (error) {
        console.error('[HomeScreen] Error fetching initial data:', error);
      }
    };

    fetchData();
  }, []);

  // Fetch bets from API
  const fetchBets = async () => {
    try {
      console.debug('[HomeScreen] Fetching bets');
      setIsLoading(true);
      const allBets = await ApiService.getBets();
      
      // Filter out bids - only show active bets
      const activeBets = allBets.filter(bet => bet.status !== 'bid');
      console.debug(`[HomeScreen] Found ${activeBets.length} active bets`);
      
      setBets(activeBets);
    } catch (error) {
      console.error('[HomeScreen] Error fetching bets:', error);
      Alert.alert('Error', 'Failed to load bets. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBets();
  };

  // Handle bet card press
  const handleBetPress = (bet: Bet) => {
    console.debug(`[HomeScreen] Bet pressed: ${bet.bet_id}`);
    setSelectedBet(bet);
    setShowPlaceBetModal(true);
  };

  // Handle bet placed
  const handleBetPlaced = () => {
    console.debug('[HomeScreen] Bet placed, refreshing bets');
    setShowPlaceBetModal(false);
    fetchBets();
  };

  // Handle create bet
  const handleCreateBet = () => {
    console.debug('[HomeScreen] Opening create bet form');
    setShowCreateBetModal(true);
  };

  // Handle bet created
  const handleBetCreated = () => {
    console.debug('[HomeScreen] Bet created, refreshing bets');
    setShowCreateBetModal(false);
    fetchBets();
  };

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <ThemedText style={styles.loadingText}>Loading bets...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ThemedView style={styles.container}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerTitle}>SideBet</ThemedText>
        </ThemedView>
        
        {/* Bets list */}
        <FlatList
          data={bets}
          keyExtractor={(item) => item.bet_id}
          renderItem={({ item }) => (
            <BetCard bet={item} onPress={handleBetPress} />
          )}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={48} color="#888" />
              <ThemedText style={styles.emptyText}>No active bets available</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Create a new bet or check the Bids tab for pending bets
              </ThemedText>
            </ThemedView>
          }
        />
        
        {/* Floating action button for creating bets */}
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={handleCreateBet}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
        
        {/* Place bet modal */}
        <Modal
          visible={showPlaceBetModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPlaceBetModal(false)}
          statusBarTranslucent={true}
        >
          <TouchableWithoutFeedback onPress={() => setShowPlaceBetModal(false)}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <View style={styles.dragIndicator} />
                  <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>Place a Bet</ThemedText>
                    <TouchableOpacity 
                      onPress={() => setShowPlaceBetModal(false)}
                      style={styles.closeButton}
                      hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
                    >
                      <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  
                  {selectedBet && (
                    <PlaceBetForm
                      bet={selectedBet}
                      userId={currentUserId}
                      onBetPlaced={handleBetPlaced}
                      onCancel={() => setShowPlaceBetModal(false)}
                    />
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        
        {/* Create bet modal */}
        <Modal
          visible={showCreateBetModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateBetModal(false)}
          statusBarTranslucent={true}
        >
          <TouchableWithoutFeedback onPress={() => setShowCreateBetModal(false)}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <View style={styles.dragIndicator} />
                  <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>Create a Bet</ThemedText>
                    <TouchableOpacity 
                      onPress={() => setShowCreateBetModal(false)}
                      style={styles.closeButton}
                      hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
                    >
                      <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  
                  <CreateBetForm
                    userId={currentUserId}
                    onBetCreated={handleBetCreated}
                    onCancel={() => setShowCreateBetModal(false)}
                  />
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
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 100,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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

// Debug note: This screen displays a list of available bets and allows users
// to place bets or create new ones
