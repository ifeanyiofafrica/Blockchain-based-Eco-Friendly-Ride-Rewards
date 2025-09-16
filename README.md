# 🚗 Blockchain-based Eco-Friendly Ride Rewards

Welcome to a decentralized platform that rewards eco-friendly commuting! This project uses the Stacks blockchain and Clarity smart contracts to incentivize users for choosing electric vehicles (EVs) or other sustainable transport methods, reducing carbon emissions one ride at a time.

## ✨ Features

🌱 **Earn Tokens**: Receive ECO tokens for verified eco-friendly rides (e.g., electric vehicles, bikes, or public transport).  
🔍 **Transparent Verification**: Prove your ride’s eco-friendliness using vehicle data or IoT integration.  
💰 **Token Redemption**: Redeem ECO tokens for discounts, services, or carbon offset programs.  
📊 **Emission Tracking**: Monitor your carbon footprint reduction on the blockchain.  
🔒 **Secure Governance**: Community-driven updates to reward rates and verification rules.  
🚀 **Scalable Rewards**: Dynamic reward system based on ride distance and eco-impact.  

## 🛠 How It Works

**For Users**  
1. Register your eco-friendly vehicle (e.g., EV) or transport method on the platform.  
2. Submit ride data (distance, vehicle type, or IoT-verified metrics) to the `ride-submission` contract.  
3. Get rewarded with ECO tokens based on the ride’s eco-impact.  
4. Redeem tokens for partner services, discounts, or carbon offset contributions.  

**For Verifiers**  
- Use the `ride-verification` contract to validate ride data (e.g., EV telemetry or GPS).  
- Check user reward history via the `reward-tracking` contract.  

**For Governance**  
- Propose and vote on reward rates or verification rules using the `governance` contract.  
- Ensure fairness and transparency with immutable records on the blockchain.

## 📜 Smart Contracts (8 Total)

1. **EcoToken**: Manages the ECO token (fungible token) for rewards, including minting and transfers.  
2. **RideSubmission**: Handles user ride submissions (distance, vehicle type, timestamp).  
3. **RideVerification**: Verifies ride data using IoT, GPS, or manual checks by verifiers.  
4. **RewardCalculation**: Calculates ECO token rewards based on ride distance and eco-impact.  
5. **TokenRedemption**: Facilitates token redemption for services or carbon offsets.  
6. **UserRegistry**: Registers users and their eco-friendly vehicles or transport methods.  
7. **Governance**: Enables community proposals and voting for reward rates or rule changes.  
8. **EmissionTracker**: Tracks and logs users’ carbon footprint reductions.  

## 🚀 Getting Started

### Prerequisites
- Stacks blockchain wallet (e.g., Hiro Wallet).  
- Clarity development environment (e.g., Clarinet).  
- IoT device or app for ride data (optional for manual verification).  

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/eco-ride-rewards.git
   ```
2. Install Clarinet:
   ```bash
   npm install -g @stacks/clarinet
   ```
3. Deploy contracts using Clarinet:
   ```bash
   clarinet deploy
   ```

### Usage
1. Register your vehicle via the `UserRegistry` contract.  
2. Submit a ride with details (e.g., distance, vehicle type) using `RideSubmission`.  
3. Verifiers validate your ride via `RideVerification`.  
4. Receive ECO tokens through `RewardCalculation`.  
5. Redeem tokens using `TokenRedemption` or track emissions with `EmissionTracker`.  
6. Participate in governance via the `Governance` contract to propose changes.  

## 🌍 Impact
This project encourages sustainable transportation, reduces carbon emissions, and fosters a transparent, community-driven ecosystem. By rewarding eco-friendly choices, we aim to create a greener future, one ride at a time.

## 📚 Future Enhancements
- Integrate IoT devices for real-time ride verification.  
- Partner with local businesses for token redemption.  
- Expand to include carpooling and bike-sharing rewards.  