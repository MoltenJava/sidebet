# **Project Requirements Document (PRD) for Social Betting App**

## **1. Project Overview**
### **Objective**
Develop a social betting platform where users can create bets on real-world actions of their friends, set and adjust odds dynamically through community participation, place wagers, share bets, and settle them based on agreed-upon results. The system should prevent collusion, ensure fairness, and offer a fun and engaging user experience.

**Tech Stack:** React Native & Node.js

---

## **2. Features**
### **1. Setting Bets & Lines**
- Users create bets on a friend’s actions (e.g., "What time will Atticus go to bed?").
- Initial odds are community-driven through an **"Auction House"** system.
- Users can vote with small amounts to "boost" odds.
- Odds dynamically shift based on the betting pool.
- Betting locks when the event occurs.

### **2. Users Can Place Bets & Lines**
- Users can view open bets.
- Users can place bets by selecting an option and setting a wager.
- Users can see real-time odds shifting as more people bet.
- System ensures fairness in bet placement (e.g., locking bets at the right time).

### **3. Users Can Share & See Their Friends’ Bets**
- Users can browse a "Bet Feed" showing ongoing bets.
- Users can comment and react to bets.
- Users can share active bets to get more friends involved.
- Private vs. public bet settings.
- **"Fire Back" System:** Users can challenge the original bettor with a **higher wager**, forcing them to either **match or back down (leading to public humiliation!).**

### **4. Users Can Settle Bets & Report Outcomes**
- After a bet event happens, users report the outcome.
- Community verification: If needed, other users vote on the legitimacy.
- System settles bets and distributes winnings accordingly.
- Anti-collusion detection mechanisms in place.

---

## **3. Requirements for Each Feature**
### **1. Setting Bets & Lines**
#### **Frontend Requirements**
- Create bet UI with event details, wager options, and starting odds.
- "Boosting" interface for adjusting odds dynamically.
- Live odds update as users place bets.
- Timer that locks the bet before the event occurs.
- "Fire Back" UI to raise the stakes against the original bettor.

#### **Backend Requirements**
- **API to Create a Bet:**
  - `POST /bets`
  - Request Body:
    ```json
    {
      "creator_id": "user123",
      "event_description": "What time will Atticus go to bed?",
      "bet_options": [
        { "option": "Before 10 PM", "initial_odds": 2.0 },
        { "option": "Between 10-12 PM", "initial_odds": 1.5 },
        { "option": "After 12 AM", "initial_odds": 2.5 }
      ],
      "bet_closing_time": "2025-03-06T23:00:00Z"
    }
    ```
  - Response:
    ```json
    {
      "bet_id": "bet456",
      "status": "created"
    }
    ```
- **API to Boost Odds:**
  - `POST /bets/{bet_id}/boost`
  - Request Body:
    ```json
    {
      "user_id": "user789",
      "bet_option": "Before 10 PM",
      "amount": 5.00
    }
    ```
  - Response:
    ```json
    {
      "new_odds": 1.8
    }
    ```

---

### **2. Users Can Place Bets & Lines**
#### **Frontend Requirements**
- Bet listing page showing open bets.
- Ability to select a bet, choose an option, and place a wager.
- Display real-time odds changes.

#### **Backend Requirements**
- **API to Place a Bet:**
  - `POST /bets/{bet_id}/place`
  - Request Body:
    ```json
    {
      "user_id": "user567",
      "bet_option": "After 12 AM",
      "amount": 10.00
    }
    ```
  - Response:
    ```json
    {
      "status": "placed",
      "updated_odds": 2.3
    }
    ```

---

### **3. Users Can Share & See Their Friends’ Bets**
#### **Frontend Requirements**
- "Bet Feed" UI to display trending bets.
- Share button to send bets to friends.
- Reactions & comments section.
- **"Fire Back" functionality for raising stakes.**

#### **Backend Requirements**
- **API to Fetch Bets Feed:**
  - `GET /bets/feed?user_id=user123`
  - Response:
    ```json
    {
      "bets": [
        {
          "bet_id": "bet456",
          "event_description": "What time will Atticus go to bed?",
          "current_odds": { "Before 10 PM": 1.8, "After 12 AM": 2.3 },
          "bet_closing_time": "2025-03-06T23:00:00Z"
        }
      ]
    }
    ```

---

### **4. Users Can Settle Bets & Report Outcomes**
#### **Frontend Requirements**
- UI to mark a bet as "Completed".
- Option for users to upload proof (photo, timestamp, etc.).
- Community voting on disputed bets.

#### **Backend Requirements**
- **API to Settle a Bet:**
  - `POST /bets/{bet_id}/settle`
  - Request Body:
    ```json
    {
      "user_id": "user567",
      "winning_option": "After 12 AM",
      "proof": "screenshot_url"
    }
    ```
  - Response:
    ```json
    {
      "status": "settled",
      "payouts": {
        "user567": 23.00,
        "user789": 12.50
      }
    }
    ```

