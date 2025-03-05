// ApiService.ts - Mock API service for the SideBet app
// Following rule: Adding debug logs & comments for easier readability

import { Bet, PlacedBet, User, BetOption, FireBack } from './Models';
import { mockBets, mockPlacedBets, mockUsers, currentUser } from './MockData';

// In-memory storage for our mock data
let bets = [...mockBets];
let placedBets = [...mockPlacedBets];
let users = [...mockUsers];
let fireBacks: FireBack[] = [];

// Helper function to generate unique IDs
const generateId = (prefix: string) => {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`;
};

// Mock API service
export const ApiService = {
  // Get all bets
  getBets: async (): Promise<Bet[]> => {
    console.debug('[API] Fetching all bets');
    return Promise.resolve([...bets]);
  },

  // Get a specific bet by ID
  getBetById: async (betId: string): Promise<Bet | null> => {
    console.debug(`[API] Fetching bet with ID: ${betId}`);
    const bet = bets.find(b => b.bet_id === betId);
    return Promise.resolve(bet || null);
  },

  // Create a new bet
  createBet: async (
    creatorId: string,
    eventDescription: string,
    betOptions: Record<string, { option: string, initial_odds: number }>,
    betClosingTime: string,
    visibility: 'public' | 'friends_only' | 'challenge' = 'public',
    challengedUsers: string[] = [],
    minimumWager: number = 0
  ): Promise<Bet> => {
    console.debug(`[API] Creating new bet: "${eventDescription}" with visibility: ${visibility}`);
    
    // Find the creator's name
    const creator = users.find(u => u.user_id === creatorId);
    
    // Format bet options - all bets start with 50/50 odds (2.0x payout) by default
    const formattedOptions: Record<string, BetOption> = {};
    Object.keys(betOptions).forEach(key => {
      formattedOptions[key] = {
        option: betOptions[key].option,
        odds: 2.0, // Default to 50/50 odds (2.0x payout)
        total_wagered: 0
      };
    });
    
    const newBet: Bet = {
      bet_id: generateId('bet'),
      creator_id: creatorId,
      creator_name: creator?.username,
      event_description: eventDescription,
      bet_options: formattedOptions,
      bet_closing_time: betClosingTime,
      // Start as a bid until it receives opposing wagers
      status: 'bid',
      created_at: new Date().toISOString(),
      visibility: visibility,
      challenged_users: visibility === 'challenge' ? challengedUsers : undefined,
      minimum_wager: minimumWager > 0 ? minimumWager : undefined
    };
    
    bets.push(newBet);
    return Promise.resolve(newBet);
  },

  // Boost odds for a bet option
  boostOdds: async (
    betId: string,
    userId: string,
    betOption: string,
    amount: number
  ): Promise<{ new_odds: number }> => {
    console.debug(`[API] Boosting odds for bet ${betId}, option: ${betOption}, amount: ${amount}`);
    
    const bet = bets.find(b => b.bet_id === betId);
    if (!bet || !bet.bet_options[betOption]) {
      throw new Error('Bet or bet option not found');
    }
    
    // Update user's wallet
    const user = users.find(u => u.user_id === userId);
    if (!user || user.wallet_balance < amount) {
      throw new Error('Insufficient funds');
    }
    user.wallet_balance -= amount;
    
    // Update odds (simplified algorithm)
    const option = bet.bet_options[betOption];
    option.total_wagered += amount;
    
    // Adjust odds based on new wager (simplified)
    const newOdds = Math.max(1.1, option.odds - (amount / 100));
    option.odds = parseFloat(newOdds.toFixed(2));
    
    return Promise.resolve({ new_odds: option.odds });
  },

  // Place a bet (now supports partial bets and implements dynamic odds)
  placeBet: async (
    betId: string,
    userId: string,
    selectedOption: string,
    amount: number,
    isPartial: boolean = true // Default to true for partial bets
  ): Promise<{ status: string, updated_odds: number }> => {
    console.debug(`[API] Placing bet: ${betId}, user: ${userId}, option: ${selectedOption}, amount: ${amount}, partial: ${isPartial}`);
    
    const bet = bets.find(b => b.bet_id === betId);
    if (!bet || !bet.bet_options[selectedOption]) {
      throw new Error('Bet or bet option not found');
    }
    
    if (bet.status !== 'bid' && bet.status !== 'open') {
      throw new Error('Bet is not open for wagering');
    }
    
    // Update user's wallet
    const user = users.find(u => u.user_id === userId);
    if (!user || user.wallet_balance < amount) {
      throw new Error('Insufficient funds');
    }
    user.wallet_balance -= amount;
    
    // Update bet option
    const option = bet.bet_options[selectedOption];
    option.total_wagered += amount;
    
    // Calculate total wagered across all options
    const totalWagered = Object.values(bet.bet_options).reduce((sum, opt) => sum + opt.total_wagered, 0);
    
    // Check if we need to transition from 'bid' to 'open' status
    if (bet.status === 'bid') {
      // Check if all options have some money wagered on them
      const allOptionsHaveWagers = Object.values(bet.bet_options).every(opt => opt.total_wagered > 0);
      
      if (allOptionsHaveWagers) {
        console.debug(`[API] Bet ${betId} transitioning from 'bid' to 'open' status`);
        bet.status = 'open';
      }
    }
    
    // Dynamic odds calculation based on total money wagered on each outcome
    // For each option, calculate odds based on the proportion of total money wagered
    Object.keys(bet.bet_options).forEach(optKey => {
      const opt = bet.bet_options[optKey];
      if (opt.total_wagered > 0 && totalWagered > 0) {
        // Calculate odds based on proportion of total wagered
        // Higher proportion of money on an option means lower odds (less payout)
        const proportion = opt.total_wagered / totalWagered;
        
        // Adjust odds: inverse of proportion with a small margin
        // This ensures that if 50% of money is on an option, odds are ~2.0x
        const newOdds = Math.max(1.1, (1 / proportion) * 0.95); // 5% house edge
        opt.odds = parseFloat(newOdds.toFixed(2));
        
        console.debug(`[API] Updated odds for ${optKey} to ${opt.odds} (${proportion.toFixed(2)} of total wagered)`);
      }
    });
    
    // Record the placed bet
    const newPlacedBet: PlacedBet = {
      user_id: userId,
      bet_id: betId,
      selected_option: selectedOption,
      amount: amount,
      potential_winnings: amount * option.odds,
      placed_at: new Date().toISOString(),
      is_partial: isPartial
    };
    
    placedBets.push(newPlacedBet);
    
    return Promise.resolve({
      status: bet.status,
      updated_odds: option.odds
    });
  },

  // Fire Back - Raise the stakes on a bet
  fireBack: async (
    betId: string,
    userId: string,
    newWager: number
  ): Promise<{ status: string, fire_back_id: string }> => {
    console.debug(`[API] Fire Back on bet: ${betId}, user: ${userId}, new wager: ${newWager}`);
    
    const bet = bets.find(b => b.bet_id === betId);
    if (!bet) {
      throw new Error('Bet not found');
    }
    
    if (bet.status !== 'open') {
      throw new Error('Bet is not open for wagering');
    }
    
    // Check if user has enough balance
    const user = users.find(u => u.user_id === userId);
    if (!user || user.wallet_balance < newWager) {
      throw new Error('Insufficient funds');
    }
    
    // Create a new Fire Back record
    const fireBack: FireBack = {
      user_id: userId,
      bet_id: betId,
      new_wager: newWager,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    const fireBackId = generateId('fb');
    fireBacks.push(fireBack);
    
    return Promise.resolve({
      status: 'pending',
      fire_back_id: fireBackId
    });
  },

  // Respond to a Fire Back (creator matching the raised stakes)
  respondToFireBack: async (
    fireBackId: string,
    accept: boolean
  ): Promise<{ status: string }> => {
    console.debug(`[API] Responding to Fire Back: ${fireBackId}, accept: ${accept}`);
    
    const fireBack = fireBacks.find(fb => fb.bet_id === fireBackId);
    if (!fireBack) {
      throw new Error('Fire Back not found');
    }
    
    if (accept) {
      // Update Fire Back status
      fireBack.status = 'matched';
      
      // Update the bet with new stakes (simplified)
      const bet = bets.find(b => b.bet_id === fireBack.bet_id);
      if (bet) {
        // Logic to update bet with new stakes would go here
        console.debug(`[API] Fire Back accepted, updating bet ${fireBack.bet_id} with new wager: ${fireBack.new_wager}`);
      }
      
      return Promise.resolve({ status: 'matched' });
    } else {
      // Update Fire Back status
      fireBack.status = 'declined';
      
      // Trigger humiliation notification (would be implemented in a real app)
      console.debug(`[API] Fire Back declined, triggering humiliation for bet ${fireBack.bet_id}`);
      
      return Promise.resolve({ status: 'declined' });
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    console.debug('[API] Fetching current user');
    return Promise.resolve({...currentUser});
  },

  // Get user's placed bets
  getUserBets: async (userId: string): Promise<PlacedBet[]> => {
    console.debug(`[API] Fetching bets for user: ${userId}`);
    return Promise.resolve(placedBets.filter(bet => bet.user_id === userId));
  },

  // Get bet feed (all bets for now)
  getBetFeed: async (userId: string): Promise<Bet[]> => {
    console.debug(`[API] Fetching bet feed for user: ${userId}`);
    // In a real app, this would filter based on user's friends
    return Promise.resolve([...bets]);
  },

  // Get all users (for friend selection)
  getUsers: async (): Promise<User[]> => {
    console.debug('[API] Fetching all users');
    return Promise.resolve([...users]);
  },

  // Get Fire Backs for a user
  getUserFireBacks: async (userId: string): Promise<FireBack[]> => {
    console.debug(`[API] Fetching Fire Backs for user: ${userId}`);
    return Promise.resolve(fireBacks.filter(fb => {
      const bet = bets.find(b => b.bet_id === fb.bet_id);
      return bet && bet.creator_id === userId;
    }));
  }
};

// Debug note: This mock API service simulates backend functionality
// and will be replaced with real API calls in production 