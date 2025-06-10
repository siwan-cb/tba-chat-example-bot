import {
  createSigner,
  getEncryptionKeyFromHex,
  logAgentDetails,
  validateEnvironment,
} from "./helpers/client.js";
import { TokenHandler, getAvailableNetworks } from "./handlers/tokenHandler.js";
import { 
  TransactionReferenceCodec,
  type TransactionReference 
} from "@xmtp/content-type-transaction-reference";
import {
  ContentTypeWalletSendCalls,
  WalletSendCallsCodec,
} from "@xmtp/content-type-wallet-send-calls";
import { Client, type XmtpEnv } from "@xmtp/node-sdk";

// Validate required environment variables
const { WALLET_KEY, ENCRYPTION_KEY, XMTP_ENV, NETWORK_ID } = validateEnvironment([
  "WALLET_KEY",
  "ENCRYPTION_KEY",
  "XMTP_ENV",
  "NETWORK_ID",
]);

async function main() {
  console.log("🚀 Starting TBA Chat Example Bot...");
  
  try {
    // Initialize token handler
    const tokenHandler = new TokenHandler(NETWORK_ID);
    console.log(`📡 Connected to network: ${tokenHandler.getNetworkInfo().name}`);
    console.log(`💰 Supported tokens: ${tokenHandler.getSupportedTokens().join(", ")}`);

    // Create XMTP client
    const signer = createSigner(WALLET_KEY);
    const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);
    
    const client = await Client.create(signer, {
      dbEncryptionKey,
      env: XMTP_ENV as XmtpEnv,
      codecs: [new WalletSendCallsCodec(), new TransactionReferenceCodec()],
    });

    const identifier = await signer.getIdentifier();
    const agentAddress = identifier.identifier;
    
    void logAgentDetails(client);

    // Sync conversations
    console.log("🔄 Syncing conversations...");
    await client.conversations.sync();

    console.log("👂 Listening for messages...");
    const stream = await client.conversations.streamAllMessages();

    for await (const message of stream) {
      // Skip messages from the agent itself
      if (!message || message.senderInboxId.toLowerCase() === client.inboxId.toLowerCase()) {
        continue;
      }

      console.log(
        `📨 Received: ${message.contentType?.typeId} from ${message.senderInboxId}`
      );

      const conversation = await client.conversations.getConversationById(
        message.conversationId
      );

      if (!conversation) {
        console.log("❌ Unable to find conversation, skipping");
        continue;
      }

      // Get sender address
      const inboxState = await client.preferences.inboxStateFromInboxIds([
        message.senderInboxId,
      ]);
      const senderAddress = inboxState[0]?.identifiers[0]?.identifier;
      
      if (!senderAddress) {
        console.log("❌ Unable to find sender address, skipping");
        continue;
      }

      try {
        // Handle different message types
        if (message.contentType?.typeId === "text") {
          await handleTextMessage(
            conversation,
            message.content as string,
            senderAddress,
            agentAddress,
            tokenHandler
          );
        } else if (message.contentType?.typeId === "transactionReference") {
          console.log("🧾 Detected transaction reference message");
          console.log("📋 Raw message content:", JSON.stringify(message.content, null, 2));
          await handleTransactionReference(
            conversation,
            message.content as TransactionReference,
            senderAddress,
            tokenHandler
          );
        } else {
          continue;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("❌ Error processing message:", errorMessage);
        await conversation.send(
          `❌ Error processing message: ${errorMessage}`
        );
      }
    }
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }
}

async function handleTextMessage(
  conversation: any,
  messageContent: string,
  senderAddress: string,
  agentAddress: string,
  tokenHandler: TokenHandler
) {
  const command = messageContent.toLowerCase().trim();

  if (command === "/help" || command === "help") {
    await handleHelpCommand(conversation, tokenHandler);
  } else if (command.startsWith("/send ")) {
    await handleSendCommand(
      conversation,
      command,
      senderAddress,
      agentAddress,
      tokenHandler
    );
  } else if (command.startsWith("/balance ")) {
    await handleBalanceCommand(conversation, command, agentAddress, tokenHandler);
  } else if (command === "/info") {
    await handleInfoCommand(conversation, tokenHandler);
  } else {
    return;
  }
}

async function handleTransactionReference(
  conversation: any,
  transactionRef: any,
  senderAddress: string,
  tokenHandler: TokenHandler
) {
  console.log("🧾 Processing transaction reference:", transactionRef);
  console.log("📊 Full transaction reference object:", JSON.stringify(transactionRef, null, 2));

  const networkInfo = tokenHandler.getNetworkInfo();
  
  // Extract transaction details - the data is nested under transactionReference property
  const txData = transactionRef.transactionReference || transactionRef;
  const txHash = txData.reference;
  const networkId = txData.networkId;
  const metadata = txData.metadata;
  
  console.log("🔍 Extracted data:");
  console.log(`  • txHash: ${txHash}`);
  console.log(`  • networkId: ${networkId}`);
  console.log(`  • metadata:`, metadata ? JSON.stringify(metadata, null, 4) : "null");
  console.log(`  • senderAddress: ${senderAddress}`);
  console.log(`  • currentNetwork: ${networkInfo.name} (${networkInfo.id})`);
  console.log(`  • txData structure:`, JSON.stringify(txData, null, 2));
  
  let receiptMessage = `📋 Transaction Reference Received

TRANSACTION DETAILS:
• Transaction Hash: ${txHash}
• Network ID: ${networkId}
• Transaction Type: ${metadata?.transactionType || 'Unknown'}
• From Address: ${metadata?.fromAddress || senderAddress}
• Current Network: ${networkInfo.name} (${networkInfo.id})`;

  // Add additional metadata information if available
  if (metadata) {
    receiptMessage += `\n\nADDITIONAL INFO:`;
    if (metadata.currency && metadata.amount && metadata.decimals) {
      const amount = metadata.amount / Math.pow(10, metadata.decimals);
      receiptMessage += `\n• Amount: ${amount} ${metadata.currency}`;
    }
    if (metadata.toAddress) {
      receiptMessage += `\n• To Address: ${metadata.toAddress}`;
    }
    // Add any other metadata fields that might be present
    const excludeFields = ['transactionType', 'fromAddress', 'currency', 'amount', 'decimals', 'toAddress'];
    Object.entries(metadata).forEach(([key, value]) => {
      if (!excludeFields.includes(key) && value !== undefined && value !== null) {
        receiptMessage += `\n• ${key}: ${value}`;
      }
    });
  }

  receiptMessage += `\n\n🔗 View on explorer:\n${getExplorerUrl(txHash, networkId || networkInfo.id)}`;
  receiptMessage += `\n\n✅ Thank you for sharing the transaction details!`;

  console.log("📤 Sending transaction reference response to user");
  await conversation.send(receiptMessage);
  console.log("✅ Transaction reference processing completed successfully");
}

function getExplorerUrl(txHash: string, networkId: string): string {
  // Handle hex chain IDs
  const chainId = networkId.startsWith('0x') ? parseInt(networkId, 16) : networkId;
  
  switch (chainId) {
    case 8453:
    case "8453":
    case "base-mainnet":
      return `https://basescan.org/tx/${txHash}`;
    case 84532:
    case "84532":
    case "base-sepolia":
      return `https://sepolia.basescan.org/tx/${txHash}`;
    case 1:
    case "1":
    case "ethereum-mainnet":
      return `https://etherscan.io/tx/${txHash}`;
    case 11155111:
    case "11155111":
    case "ethereum-sepolia":
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    default:
      console.log(`Unknown network ID: ${networkId} (chainId: ${chainId}), defaulting to etherscan`);
      return `https://etherscan.io/tx/${txHash}`;
  }
}

async function handleHelpCommand(conversation: any, tokenHandler: TokenHandler) {
  const networkInfo = tokenHandler.getNetworkInfo();
  
  const helpMessage = `🤖 TBA Chat Example Bot

COMMANDS:
• /send <AMOUNT> <TOKEN> - Send tokens to bot
• /balance <TOKEN> - Check bot balance  
• /info - Network information
• /help - Show this help

EXAMPLES:
• /send 0.1 USDC
• /send 0.01 ETH
• /balance USDC

Current Network: ${networkInfo.name}
Supported Tokens: ${networkInfo.supportedTokens.join(", ")}

💡 Uses XMTP wallet send calls for secure transactions
📋 Can also receive transaction references you share`;

  await conversation.send(helpMessage);
}

async function handleSendCommand(
  conversation: any,
  command: string,
  senderAddress: string,
  agentAddress: string,
  tokenHandler: TokenHandler
) {
  const parts = command.split(" ");
  if (parts.length !== 3) {
    await conversation.send(
      "❌ Invalid format\n\nUse: /send <AMOUNT> <TOKEN>\nExample: /send 0.1 USDC"
    );
    return;
  }

  const amount = parseFloat(parts[1]);
  const token = parts[2].toUpperCase();

  if (isNaN(amount) || amount <= 0) {
    await conversation.send("❌ Invalid amount. Please provide a positive number.");
    return;
  }

  try {
    // Validate token is supported
    tokenHandler.getTokenConfig(token);

    const walletSendCalls = tokenHandler.createTokenTransferCalls({
      from: senderAddress,
      to: agentAddress,
      amount: amount,
      token: token,
      networkId: tokenHandler.getNetworkInfo().id,
    });

    console.log(`💸 Created transfer request: ${amount} ${token} from ${senderAddress}`);
    await conversation.send(walletSendCalls, ContentTypeWalletSendCalls);
    
    await conversation.send(
      `✅ Transaction request created!

DETAILS:
• Amount: ${amount} ${token}
• To: ${agentAddress}
• Network: ${tokenHandler.getNetworkInfo().name}

💡 Please approve the transaction in your wallet.
📋 Optionally share the transaction reference when complete.`
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await conversation.send(`❌ ${errorMessage}`);
  }
}

async function handleBalanceCommand(
  conversation: any,
  command: string,
  agentAddress: string,
  tokenHandler: TokenHandler
) {
  const parts = command.split(" ");
  if (parts.length !== 2) {
    await conversation.send(
      "❌ Invalid format\n\nUse: /balance <TOKEN>\nExample: /balance USDC"
    );
    return;
  }

  const token = parts[1].toUpperCase();

  try {
    const balance = await tokenHandler.getTokenBalance(agentAddress, token);
    await conversation.send(
      `💰 Bot Balance

Token: ${token}
Balance: ${balance} ${token}
Network: ${tokenHandler.getNetworkInfo().name}`
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await conversation.send(`❌ ${errorMessage}`);
  }
}

async function handleInfoCommand(conversation: any, tokenHandler: TokenHandler) {
  const networkInfo = tokenHandler.getNetworkInfo();
  const availableNetworks = getAvailableNetworks();
  
  const infoMessage = `ℹ️ Network Information

CURRENT NETWORK:
• Name: ${networkInfo.name}
• ID: ${networkInfo.id}
• Chain ID: ${networkInfo.chainId}

SUPPORTED TOKENS:
${networkInfo.supportedTokens.map(token => `• ${token}`).join("\n")}

AVAILABLE NETWORKS:
${availableNetworks.map(net => `• ${net}`).join("\n")}

CONTENT TYPES:
• Wallet Send Calls (EIP-5792)
• Transaction Reference

🔗 Test at: https://xmtp.chat`;

  await conversation.send(infoMessage);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down TBA Chat Example Bot...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down TBA Chat Example Bot...");
  process.exit(0);
});

// Start the bot
main().catch((error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
}); 