<<<<<<< HEAD
# sidebet
=======
# SideBet - Social Betting App

SideBet is a mobile application that allows friends to create and place bets on real-world events. It combines the fun of gambling with social networking features, creating an engaging platform for friendly wagers.

## Features

### 1. Setting Bets & Lines
- Create bets on friends' actions (e.g., "What time will Atticus go to bed?")
- Set initial odds for different betting options
- Dynamic odds that shift based on the betting pool
- Betting locks when the event occurs

### 2. Placing Bets & Lines
- Browse open bets
- Place bets by selecting an option and setting a wager
- See real-time odds shifting as more people bet
- View potential winnings based on current odds

### 3. Social Features
- View a feed of ongoing bets
- See your betting history
- Track your wallet balance
- User profiles with betting statistics

## Tech Stack

- **Frontend**: React Native with Expo
- **State Management**: React Hooks
- **UI Components**: Custom themed components
- **Navigation**: Expo Router

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sidebet.git
cd sidebet
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Open the app on your device using the Expo Go app or run it in a simulator.

## Project Structure

```
├── app                 # Main application screens
│   └── (tabs)          # Tab-based navigation screens
├── assets              # Static assets like images and fonts
├── components          # Reusable UI components
├── constants           # App constants, models, and mock data
├── hooks               # Custom React hooks
└── scripts             # Utility scripts
```

## Development Notes

- The app currently uses mock data and simulated API calls
- In a production environment, this would be connected to a real backend
- Wallet balances are simulated and would require real payment integration in production

## Future Enhancements

- Implement user authentication
- Add social sharing features
- Create notifications for bet updates
- Implement bet settlement with proof verification
- Add more betting options and categories

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Expo and React Native
- UI design inspired by modern betting platforms
>>>>>>> 0d30b15 (Initial commit with alpha placeholder functionality)
