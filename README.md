# TBA Chat Example Bot

An advanced XMTP agent demonstrating **wallet send calls**, **transaction reference content types**, and **interactive inline actions**. This bot showcases cutting-edge blockchain messaging integration using EIP-5792 standard and XIP-67 inline actions specification.

## 💬 Try the Live Agent

**Interact with our live agent now:** **`tbachat.base.eth`** 

- **Message the agent directly**: Open [XMTP Chat](https://xmtp.chat) or any XMTP-compatible app
- **Send to**: `tbachat.base.eth` 
- **Start with**: `/help` to see all available commands and interactive actions
- **Test features**: Send tokens, check balances, and explore interactive buttons!

*No setup required - just start chatting with our live agent to see all the features in action.*

## 🚀 Features

- **Multi-token Support**: Send ETH, USDC, and other tokens
- **Multi-network Support**: Base Sepolia, Base Mainnet, Ethereum Sepolia, Ethereum Mainnet
- **Wallet Send Calls**: EIP-5792 compliant transaction requests
- **Transaction References**: Structured transaction metadata with detailed processing
- **Interactive Inline Actions**: XIP-67 compliant button-based interactions
- **Intent Handling**: User action responses via intent messages
- **Enhanced UX**: Rich visual interactions with optional images
- **Railway Ready**: Configured for easy cloud deployment
- **Comprehensive Error Handling**: Robust error management and logging

## 🛠️ Commands

### Text Commands
| Command | Description | Example |
|---------|-------------|---------|
| `/help` | Show interactive welcome actions | `/help` |
| `/send <AMOUNT> <TOKEN>` | Send tokens to the bot | `/send 0.1 USDC` |
| `/balance <TOKEN>` | Check bot's token balance | `/balance USDC` |
| `/info` | Show network and token info | `/info` |
| `/actions` | Display inline action buttons | `/actions` |
| `/actions-with-images` | Display actions with fun images | `/actions-with-images` |

### Interactive Actions
The bot now supports **interactive button-based actions** that users can tap instead of typing commands:

- **🚀 Show me actions** - Display available action buttons
- **🖼️ Show me actions with images** - Display actions with cat images
- **💰 Check balance** - Instantly check USDC balance
- **Send 0.005 USDC** - Quick small transfer
- **Send 1 USDC** - Quick large transfer
- **ℹ️ More info** - Show detailed network information

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
3. **Interact with the bot** using either:

### Traditional Commands
```
/help
# Shows interactive welcome screen with action buttons

/send 0.1 USDC  
# Creates a transaction request to send 0.1 USDC to the bot

/balance USDC
# Shows the bot's USDC balance

/actions
# Displays interactive action buttons

/info
# Displays comprehensive network and token information
```

### Interactive Actions
- Send `/help` to see interactive buttons
- Tap any button to trigger actions instantly
- Enjoy the enhanced user experience with visual feedback

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
- **Enhanced error recovery** with automatic reconnection

## 🏗️ Project Structure

```
src/
├── index.ts              # Main bot logic with multi-content-type handling
├── helpers/
│   ├── client.ts         # XMTP client utilities
│   └── utils.ts          # Blockchain explorer utilities
├── handlers/
│   ├── actionHandlers.ts # Interactive action button handlers
│   ├── messageHandlers.ts # Text message and intent processors
│   ├── tokenHandler.ts   # Token and network management
│   └── transactionHandlers.ts # Transaction reference processing
└── types/
    ├── ActionsContent.ts # XIP-67 inline actions content type
    ├── IntentContent.ts  # Intent message content type
    └── tokens.ts         # Token and network type definitions

scripts/
└── generateKeys.ts       # Key generation utility
```

## 🔒 Security Notes

- **Never commit** `.env` files or private keys
- **Use testnet** for development and testing
- **Secure your keys** - the bot's wallet can receive real funds
- **Test thoroughly** before mainnet deployment
- **Monitor transactions** - all transaction references are logged and validated

## 🛠️ Development

### Adding New Interactive Actions

Edit `src/handlers/actionHandlers.ts`:

```typescript
export async function handleActionsCommand(conversation: any, tokenHandler: TokenHandler) {
  const actionsContent: ActionsContent = {
    id: `help-${Date.now()}`,
    description: "Choose an action:",
    actions: [
      {
        id: "my-custom-action",
        label: "My Custom Action",
        style: "primary",
        imageUrl: "https://example.com/image.png" // Optional
      }
    ]
  };
  await conversation.send(actionsContent, ContentTypeActions);
}
```

Then handle the intent in `src/handlers/messageHandlers.ts`:

```typescript
case "my-custom-action":
  // Handle your custom action
  await conversation.send("Custom action executed!");
  break;
```

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
3. Add explorer URL support in `src/helpers/utils.ts`
4. Test with appropriate RPC endpoints

## 📚 XMTP Content Types

This bot implements three advanced XMTP content types:

### 1. Wallet Send Calls (EIP-5792)
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

### 2. Transaction Reference
Enhanced metadata about completed or pending transactions with comprehensive tracking:

```typescript
{
  reference: "0x...",
  networkId: "base-sepolia", 
  metadata: {
    transactionType: "transfer",
    currency: "USDC",
    amount: 100000,
    decimals: 6,
    fromAddress: "0x...",
    toAddress: "0x..."
  }
}
```

### 3. Interactive Actions (XIP-67)
Button-based interactions for enhanced UX:

```typescript
{
  id: "actions-123",
  description: "Choose an action:",
  actions: [
    {
      id: "send-usdc",
      label: "Send USDC",
      style: "primary",
      imageUrl: "https://example.com/icon.png"
    }
  ]
}
```

### 4. Intent Messages (XIP-67)
User responses to action buttons:

```typescript
{
  id: "actions-123", // References the actions message
  actionId: "send-usdc", // The specific action selected
  metadata: {} // Optional context data
}
```

## 🎯 Advanced Features

### Interactive Button System
- **Visual Actions**: Rich button interfaces with optional images
- **Intent Processing**: Seamless handling of user button taps
- **Style Support**: Primary, secondary, and danger button styles
- **Validation**: Full XIP-67 specification compliance
- **Error Handling**: Comprehensive error management for all interactions

### Enhanced Transaction Handling
- **Detailed Logging**: Complete transaction reference processing
- **Metadata Extraction**: Rich transaction data parsing
- **Explorer Integration**: Automatic blockchain explorer links
- **Multi-network Support**: Cross-chain transaction references

### Robust Error Management
- **Stream Reconnection**: Automatic recovery from connection issues
- **Message Validation**: Content type validation and error reporting
- **Graceful Degradation**: Fallback handling for unsupported content types
- **Comprehensive Logging**: Detailed operation logging for debugging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with both text commands and interactive actions
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [XMTP Documentation](https://docs.xmtp.org/)
- [EIP-5792: Wallet Send Calls](https://eips.ethereum.org/EIPS/eip-5792)
- [XIP-67: Inline Actions](https://github.com/xmtp/XIPs/blob/main/XIPs/xip-67-inline-actions.md)
- [XMTP Web Chat](https://xmtp.chat)
- [Railway Deployment](https://railway.app)

---

Built with ❤️ using XMTP for secure, decentralized messaging and advanced transaction coordination with interactive user experiences. 