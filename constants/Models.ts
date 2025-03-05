// Models.ts - Data models for the SideBet app
// Following rule: Adding debug logs & comments for easier readability

export interface User {
  user_id: string;
  username: string;
  wallet_balance: number;
  profile_image?: string;
}

export interface BetOption {
  option: string;
  total_wagered: number;
  odds: number;
  initial_odds: number;
}

export interface Bet {
  bet_id: string;
  creator_id: string;
  creator_name?: string; // For display purposes
  event_description: string;
  bet_options: Record<string, BetOption>;
  bet_closing_time: string;
  status: 'bid' | 'open' | 'locked' | 'settled' | 'disputed';
  created_at: string;
  winning_option?: string;
  // New fields for visibility and challenged users
  visibility: 'public' | 'friends_only' | 'challenge';
  challenged_users?: string[]; // User IDs of challenged friends
  // New field for minimum wager required to match the bet
  minimum_wager?: number;
  placed_bets?: PlacedBet[];
}

export interface PlacedBet {
  user_id: string;
  bet_id: string;
  amount: number;
  selected_option: string;
  placed_at: string;
  potential_winnings: number;
  is_partial?: boolean;
}

// New interface for Fire Back system
export interface FireBack {
  user_id: string;
  bet_id: string;
  new_wager: number;
  status: 'pending' | 'matched' | 'declined';
  created_at: string;
}

// Debug note: These models match the data structure in the requirements
// and will be used throughout the app for type safety 