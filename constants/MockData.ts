// MockData.ts - Mock data for testing the SideBet app
// Following rule: Adding debug logs & comments for easier readability

import { User, Bet, PlacedBet } from './Models';

// Mock current user
export const currentUser: User = {
  user_id: 'user123',
  username: 'Arya',
  wallet_balance: 100.00,
  profile_image: 'https://i.pravatar.cc/150?img=1'
};

// Mock users
export const mockUsers: User[] = [
  currentUser,
  {
    user_id: 'user456',
    username: 'Atticus',
    wallet_balance: 75.00,
    profile_image: 'https://i.pravatar.cc/150?img=2'
  },
  {
    user_id: 'user789',
    username: 'Sophia',
    wallet_balance: 120.00,
    profile_image: 'https://i.pravatar.cc/150?img=3'
  },
  {
    user_id: 'user101',
    username: 'Jackson',
    wallet_balance: 50.00,
    profile_image: 'https://i.pravatar.cc/150?img=4'
  }
];

// Mock bets
export const mockBets: Bet[] = [
  {
    bet_id: 'bet001',
    creator_id: 'user456',
    creator_name: 'Atticus',
    event_description: 'What time will Atticus go to bed?',
    bet_options: {
      'Before 10 PM': { option: 'Before 10 PM', odds: 2.0, total_wagered: 20.00 },
      'Between 10-12 PM': { option: 'Between 10-12 PM', odds: 1.5, total_wagered: 30.00 },
      'After 12 AM': { option: 'After 12 AM', odds: 2.5, total_wagered: 15.00 }
    },
    bet_closing_time: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
    status: 'open',
    created_at: new Date().toISOString(),
    visibility: 'public'
  },
  {
    bet_id: 'bet002',
    creator_id: 'user789',
    creator_name: 'Sophia',
    event_description: 'Will Sophia finish her project by Friday?',
    bet_options: {
      'Yes': { option: 'Yes', odds: 1.8, total_wagered: 40.00 },
      'No': { option: 'No', odds: 2.2, total_wagered: 25.00 }
    },
    bet_closing_time: new Date(Date.now() + 172800000).toISOString(), // 48 hours from now
    status: 'open',
    created_at: new Date(Date.now() - 86400000).toISOString(), // Created 24 hours ago
    visibility: 'friends_only'
  },
  {
    bet_id: 'bet003',
    creator_id: 'user101',
    creator_name: 'Jackson',
    event_description: 'How many miles will Jackson run this weekend?',
    bet_options: {
      'Less than 5 miles': { option: 'Less than 5 miles', odds: 1.5, total_wagered: 30.00 },
      '5-10 miles': { option: '5-10 miles', odds: 2.0, total_wagered: 25.00 },
      'More than 10 miles': { option: 'More than 10 miles', odds: 3.0, total_wagered: 10.00 }
    },
    bet_closing_time: new Date(Date.now() + 259200000).toISOString(), // 72 hours from now
    status: 'open',
    created_at: new Date(Date.now() - 43200000).toISOString(), // Created 12 hours ago
    visibility: 'challenge',
    challenged_users: ['user123', 'user456']
  }
];

// Mock placed bets
export const mockPlacedBets: PlacedBet[] = [
  {
    user_id: 'user123',
    bet_id: 'bet002',
    selected_option: 'Yes',
    amount: 10.00,
    potential_winnings: 18.00,
    placed_at: new Date(Date.now() - 3600000).toISOString() // Placed 1 hour ago
  },
  {
    user_id: 'user789',
    bet_id: 'bet001',
    selected_option: 'After 12 AM',
    amount: 15.00,
    potential_winnings: 37.50,
    placed_at: new Date(Date.now() - 7200000).toISOString(), // Placed 2 hours ago
    is_partial: true
  }
];

// Debug note: This mock data will be used to simulate API responses
// until we connect to a real backend 