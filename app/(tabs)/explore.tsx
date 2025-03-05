import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator, View, Modal, TouchableWithoutFeedback, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ApiService } from '@/constants/ApiService';
import { User, PlacedBet, Bet } from '@/constants/Models';
import { Colors } from '@/constants/Colors';

export default function ProfileScreen() {
  // Debug log
  console.debug('[ProfileScreen] Rendering profile screen');

  const [user, setUser] = useState<User | null>(null);
  const [placedBets, setPlacedBets] = useState<PlacedBet[]>([]);
  const [bets, setBets] = useState<Record<string, Bet>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // New state for bet details modal
  const [selectedBet, setSelectedBet] = useState<PlacedBet | null>(null);
  const [showBetDetailsModal, setShowBetDetailsModal] = useState<boolean>(false);
  const [betDetails, setBetDetails] = useState<Bet | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState<boolean>(false);

  // Fetch user data and placed bets on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.debug('[ProfileScreen] Fetching initial data');
        
        // Get current user
        const userData = await ApiService.getCurrentUser();
        setUser(userData);
        
        // Get user's placed bets
        await fetchPlacedBets(userData.user_id);
        
        // Get all bets for reference
        const allBets = await ApiService.getBets();
        const betsMap: Record<string, Bet> = {};
        allBets.forEach(bet => {
          betsMap[bet.bet_id] = bet;
        });
        setBets(betsMap);
      } catch (error) {
        console.error('[ProfileScreen] Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch placed bets from API
  const fetchPlacedBets = async (userId: string) => {
    try {
      console.debug(`[ProfileScreen] Fetching placed bets for user: ${userId}`);
      const fetchedBets = await ApiService.getUserBets(userId);
      setPlacedBets(fetchedBets);
    } catch (error) {
      console.error('[ProfileScreen] Error fetching placed bets:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (!user) return;
    
    setRefreshing(true);
    await fetchPlacedBets(user.user_id);
    
    // Refresh bets data
    const allBets = await ApiService.getBets();
    const betsMap: Record<string, Bet> = {};
    allBets.forEach(bet => {
      betsMap[bet.bet_id] = bet;
    });
    setBets(betsMap);
    
    setRefreshing(false);
  };

  // Filter bets based on active tab
  const getFilteredBets = () => {
    if (!placedBets.length) return [];
    
    return placedBets.filter(bet => {
      const betDetails = bets[bet.bet_id];
      if (!betDetails) return false;
      
      if (activeTab === 'active') {
        return ['open', 'locked'].includes(betDetails.status);
      } else {
        return ['settled', 'disputed'].includes(betDetails.status);
      }
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Calculate potential winnings
  const calculateWinnings = (placedBet: PlacedBet) => {
    return placedBet.amount * (bets[placedBet.bet_id]?.bet_options[placedBet.selected_option]?.odds || 0);
  };

  // New function to handle bet selection
  const handleBetPress = async (bet: PlacedBet) => {
    console.debug(`[ProfileScreen] Selected bet: ${bet.bet_id}`);
    setSelectedBet(bet);
    setShowBetDetailsModal(true);
    
    // Fetch bet details
    try {
      setIsFetchingDetails(true);
      const details = await ApiService.getBetById(bet.bet_id);
      if (details) {
        setBetDetails(details);
      }
    } catch (error) {
      console.error('[ProfileScreen] Error fetching bet details:', error);
      Alert.alert('Error', 'Failed to load bet details. Please try again.');
    } finally {
      setIsFetchingDetails(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowBetDetailsModal(false);
    setSelectedBet(null);
    setBetDetails(null);
  };

  // Render loading state
  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  // Render bet item with enhanced UI
  const renderBetItem = ({ item }: { item: PlacedBet }) => {
    // Get bet status and result
    const betStatus = item.bet_id.includes('active') ? 'Active' : 'Settled';
    const betResult = item.bet_id.includes('win') ? 'Won' : item.bet_id.includes('lose') ? 'Lost' : 'Pending';
    
    // Format date
    const formattedDate = formatDate(item.placed_at);
    
    // Calculate potential winnings
    const winnings = calculateWinnings(item);
    
    return (
      <TouchableOpacity 
        style={[
          styles.betCard,
          betResult === 'Won' ? styles.wonBetCard : 
          betResult === 'Lost' ? styles.lostBetCard : 
          styles.pendingBetCard
        ]}
        onPress={() => handleBetPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.betCardContent}>
          <View style={styles.betHeader}>
            <View style={styles.betInfo}>
              <ThemedText style={styles.betAmount}>${item.amount.toFixed(2)}</ThemedText>
              <ThemedText style={styles.betOption}>{item.selected_option}</ThemedText>
            </View>
            <View style={[
              styles.statusBadge,
              betResult === 'Won' ? styles.wonBadge : 
              betResult === 'Lost' ? styles.lostBadge : 
              styles.pendingBadge
            ]}>
              <ThemedText style={styles.statusText}>{betResult}</ThemedText>
            </View>
          </View>
          
          <View style={styles.betDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#888" />
              <ThemedText style={styles.detailText}>{formattedDate}</ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={16} color={Colors.light.tint} />
              <ThemedText style={styles.detailText}>
                Potential: <ThemedText style={styles.winningsText}>${winnings.toFixed(2)}</ThemedText>
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.viewMoreContainer}>
            <ThemedText style={styles.viewMoreText}>Tap to view details</ThemedText>
            <Ionicons name="chevron-forward" size={16} color="#888" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Profile header with improved layout and aspect ratio */}
      {user && (
        <LinearGradient
          colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0)']}
          style={styles.profileHeaderGradient}
        >
          <ThemedView style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ uri: user.profile_image || `https://i.pravatar.cc/150?u=${user.user_id}` }} 
                style={styles.profileImage} 
              />
              <View style={styles.statusDot}></View>
            </View>
            
            <View style={styles.profileInfo}>
              <ThemedText style={styles.username}>{user.username}</ThemedText>
              <View style={styles.statsContainer}>
                {/* Card for wallet balance */}
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="wallet-outline" size={18} color={Colors.light.tint} />
                  </View>
                  <View>
                    <ThemedText style={styles.statValue}>
                      ${user.wallet_balance.toFixed(2)}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Balance</ThemedText>
                  </View>
                </View>
                
                {/* Card for bet count */}
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="analytics-outline" size={18} color="#ff8c00" />
                  </View>
                  <View>
                    <ThemedText style={styles.statValue}>
                      {placedBets.length}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Total Bets</ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </ThemedView>
        </LinearGradient>
      )}
      
      {/* Improved Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <ThemedText style={[
            styles.tabText,
            activeTab === 'active' && styles.activeTabText
          ]}>
            Active Bets
          </ThemedText>
          {activeTab === 'active' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <ThemedText style={[
            styles.tabText,
            activeTab === 'history' && styles.activeTabText
          ]}>
            Bet History
          </ThemedText>
          {activeTab === 'history' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>
      
      {/* Bets list with improved card design */}
      <FlatList
        data={getFilteredBets()}
        keyExtractor={(item) => `${item.user_id}-${item.bet_id}`}
        renderItem={renderBetItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={48} color="#888" />
            <ThemedText style={styles.emptyText}>
              No {activeTab === 'active' ? 'active' : 'past'} bets
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {activeTab === 'active' 
                ? 'Place a bet to see it here' 
                : 'Your bet history will appear here'}
            </ThemedText>
          </ThemedView>
        }
      />
      
      {/* Bet details modal */}
      <Modal
        visible={showBetDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Bet Details</ThemedText>
                  <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#888" />
                  </TouchableOpacity>
                </View>
                
                {isFetchingDetails ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.tint} />
                    <ThemedText style={styles.loadingText}>Loading bet details...</ThemedText>
                  </View>
                ) : selectedBet && betDetails ? (
                  <ScrollView style={styles.detailsScrollContainer}>
                    <View style={styles.betDetailsContainer}>
                      <ThemedText style={styles.betDescriptionTitle}>
                        {betDetails.event_description}
                      </ThemedText>
                      
                      <View style={styles.betDetailSection}>
                        <ThemedText style={styles.detailSectionTitle}>Your Bet</ThemedText>
                        <View style={styles.detailCard}>
                          <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Option:</ThemedText>
                            <ThemedText style={styles.detailValue}>{selectedBet.selected_option}</ThemedText>
                          </View>
                          <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Amount:</ThemedText>
                            <ThemedText style={styles.detailValue}>${selectedBet.amount.toFixed(2)}</ThemedText>
                          </View>
                          <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Potential Winnings:</ThemedText>
                            <ThemedText style={styles.detailValue}>${calculateWinnings(selectedBet).toFixed(2)}</ThemedText>
                          </View>
                          <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Placed On:</ThemedText>
                            <ThemedText style={styles.detailValue}>{formatDate(selectedBet.placed_at)}</ThemedText>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.betDetailSection}>
                        <ThemedText style={styles.detailSectionTitle}>Bet Status</ThemedText>
                        <View style={styles.detailCard}>
                          <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Status:</ThemedText>
                            <View style={[
                              styles.statusBadge,
                              betDetails.status === 'open' ? styles.openBadge :
                              betDetails.status === 'locked' ? styles.lockedBadge :
                              betDetails.status === 'settled' ? styles.settledBadge :
                              styles.pendingBadge
                            ]}>
                              <ThemedText style={styles.statusText}>
                                {betDetails.status.toUpperCase()}
                              </ThemedText>
                            </View>
                          </View>
                          <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Closing Time:</ThemedText>
                            <ThemedText style={styles.detailValue}>{formatDate(betDetails.bet_closing_time)}</ThemedText>
                          </View>
                          {betDetails.winning_option && (
                            <View style={styles.detailRow}>
                              <ThemedText style={styles.detailLabel}>Winning Option:</ThemedText>
                              <ThemedText style={styles.detailValue}>{betDetails.winning_option}</ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.betDetailSection}>
                        <ThemedText style={styles.detailSectionTitle}>All Options</ThemedText>
                        {Object.entries(betDetails.bet_options).map(([key, option]) => (
                          <View key={key} style={[
                            styles.optionCard,
                            key === selectedBet.selected_option && styles.selectedOptionCard
                          ]}>
                            <ThemedText style={styles.optionText}>{option.option}</ThemedText>
                            <View style={styles.optionDetails}>
                              <View style={styles.optionDetail}>
                                <ThemedText style={styles.optionDetailLabel}>Odds:</ThemedText>
                                <ThemedText style={styles.optionDetailValue}>{option.odds.toFixed(2)}x</ThemedText>
                              </View>
                              <View style={styles.optionDetail}>
                                <ThemedText style={styles.optionDetailLabel}>Total Wagered:</ThemedText>
                                <ThemedText style={styles.optionDetailValue}>${option.total_wagered.toFixed(2)}</ThemedText>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                ) : (
                  <ThemedView style={styles.emptyContainer}>
                    <ThemedText style={styles.emptyText}>Bet details not available</ThemedText>
                  </ThemedView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  profileHeaderGradient: {
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.light.tint,
  },
  statusDot: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletBalance: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '30%',
    backgroundColor: Colors.light.tint,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  activeTabText: {
    fontWeight: '600',
    color: Colors.light.tint,
  },
  listContent: {
    padding: 12,
    paddingBottom: 50,
  },
  betCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  wonBetCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CD964',
  },
  lostBetCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  pendingBetCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFCC00',
  },
  betCardContent: {
    padding: 16,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  betInfo: {
    flex: 1,
  },
  betAmount: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  betOption: {
    fontSize: 16,
    color: '#555',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wonBadge: {
    backgroundColor: 'rgba(76, 217, 100, 0.15)',
  },
  lostBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 204, 0, 0.15)',
  },
  openBadge: {
    backgroundColor: 'rgba(90, 200, 250, 0.15)',
  },
  lockedBadge: {
    backgroundColor: 'rgba(88, 86, 214, 0.15)',
  },
  settledBadge: {
    backgroundColor: 'rgba(76, 217, 100, 0.15)',
  },
  statusText: {
    fontWeight: '600',
    fontSize: 12,
  },
  betDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: '#666',
  },
  winningsText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  viewMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginTop: 12,
    paddingTop: 12,
  },
  viewMoreText: {
    color: '#888',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#555',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  detailsScrollContainer: {
    flex: 1,
  },
  betDetailsContainer: {
    padding: 16,
  },
  betDescriptionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  betDetailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.light.tint,
  },
  detailCard: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    padding: 16,
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  optionCard: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedOptionCard: {
    backgroundColor: 'rgba(52, 152, 219, 0.08)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionDetail: {
    flexDirection: 'column',
  },
  optionDetailLabel: {
    fontSize: 13,
    color: '#888',
  },
  optionDetailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});

// Debug note: This screen displays the user's profile and their placed bets,
// with tabs to switch between active bets and bet history
