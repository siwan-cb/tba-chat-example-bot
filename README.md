# TBA Chat Example Bot

An XMTP agent for testing **wallet send calls** and **transaction reference content types**. This bot demonstrates how to integrate blockchain transactions with XMTP messaging using the EIP-5792 standard.

## 🚀 Features

- **Multi-token Support**: Send ETH, USDC, and other tokens
- **Multi-network Support**: Base Sepolia, Base Mainnet, Ethereum Sepolia, Ethereum Mainnet
- **Wallet Send Calls**: EIP-5792 compliant transaction requests
- **Transaction References**: Structured transaction metadata
- **Railway Ready**: Configured for easy cloud deployment

## 🛠️ Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/send <AMOUNT> <TOKEN>` | Send tokens to the bot | `/send 0.1 USDC` |
| `/balance <TOKEN>` | Check bot's token balance | `/balance USDC` |
| `/info` | Show network and token info | `/info` |
| `/help` | Show available commands | `/help` |

## 📋 Prerequisites

- **Node.js** v20 or higher
- **Yarn** (recommended) or npm
- A crypto wallet with some testnet tokens for testing

## 🔧 Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd tba-chat-example-bot
yarn install
```

### 2. Generate Keys

```bash
yarn gen:keys
```

This creates a `.env` file with:
- `WALLET_KEY`: Private key for the bot's wallet
- `ENCRYPTION_KEY`: Encryption key for XMTP database
- `XMTP_ENV`: XMTP environment (dev/production)  
- `NETWORK_ID`: Blockchain network (base-sepolia/base-mainnet/etc.)

### 3. Start Development

```bash
yarn dev
```

The bot will start and display connection details including a chat URL.

## 🌐 Usage

1. **Start the bot** with `yarn dev`
2. **Open the chat URL** displayed in the console (e.g., `https://xmtp.chat/dm/0x...`)
3. **Send commands** to interact with the bot:

```
/help
# Shows available commands

/send 0.1 USDC  
# Creates a transaction request to send 0.1 USDC to the bot

/balance USDC
# Shows the bot's USDC balance

/info
# Displays network and token information
```

## 🔗 Networks & Tokens

### Supported Networks

| Network | Chain ID | Tokens |
|---------|----------|--------|
| Base Sepolia | 84532 | ETH, USDC |
| Base Mainnet | 8453 | ETH, USDC |  
| Ethereum Sepolia | 11155111 | ETH |
| Ethereum Mainnet | 1 | ETH, USDC |

### Getting Testnet Tokens

- **Base Sepolia ETH**: [Base Faucet](https://faucet.quicknode.com/base/sepolia)
- **USDC on Base Sepolia**: [Circle Faucet](https://faucet.circle.com)

## 🚂 Railway Deployment

### 1. Prepare for Railway

```bash
# Build the project
yarn build

# Test production build locally
yarn start
```

### 2. Deploy to Railway

1. **Connect Repository**: Link your GitHub repo to Railway
2. **Set Environment Variables** in Railway dashboard:
   ```
   WALLET_KEY=your_wallet_private_key
   ENCRYPTION_KEY=your_encryption_key  
   XMTP_ENV=production
   NETWORK_ID=base-mainnet
   PORT=3000
   ```
3. **Deploy**: Railway will automatically build and deploy

### 3. Railway Configuration

The bot includes Railway-specific features:
- **Volume mounting** for persistent XMTP database
- **Port configuration** via `PORT` environment variable
- **Graceful shutdown** handling for deployments

## 🏗️ Project Structure

```
src/
├── index.ts              # Main bot logic
├── helpers/
│   └── client.ts         # XMTP client utilities
├── handlers/
│   └── tokenHandler.ts   # Token and network management
└── types/
    └── tokens.ts         # Type definitions

scripts/
└── generateKeys.ts       # Key generation utility
```

## 🔒 Security Notes

- **Never commit** `.env` files or private keys
- **Use testnet** for development and testing
- **Secure your keys** - the bot's wallet can receive real funds
- **Test thoroughly** before mainnet deployment

## 🛠️ Development

### Adding New Tokens

Edit `src/handlers/tokenHandler.ts`:

```typescript
const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  "base-sepolia": {
    // ...existing config
    tokens: {
      // Add new token
      MYTOKEN: {
        symbol: "MYTOKEN",
        name: "My Token",
        address: "0x...",
        decimals: 18,
        networks: ["base-sepolia"],
      },
    },
  },
};
```

### Adding New Networks

1. Add network config to `NETWORK_CONFIGS`
2. Update `getViemChain()` method
3. Test with appropriate RPC endpoints

## 📚 XMTP Content Types

This bot uses two key XMTP content types:

### Wallet Send Calls (EIP-5792)
Standardized transaction requests that wallets can execute:

```typescript
{
  version: "1.0",
  from: "0x...",
  chainId: "0x14a34",
  calls: [{
    to: "0x...",
    data: "0x...",
    metadata: {
      description: "Transfer 0.1 USDC",
      transactionType: "transfer",
      currency: "USDC",
      amount: 100000,
      decimals: 6,
      networkId: "base-sepolia"
    }
  }]
}
```

### Transaction Reference
Metadata about completed or pending transactions for tracking and display.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [XMTP Documentation](https://docs.xmtp.org/)
- [EIP-5792: Wallet Send Calls](https://eips.ethereum.org/EIPS/eip-5792)
- [XMTP Web Chat](https://xmtp.chat)
- [Railway Deployment](https://railway.app)

---

Built with ❤️ using XMTP for secure, decentralized messaging and transaction coordination. 