import {
  createSigner,
  getEncryptionKeyFromHex,
  logAgentDetails,
  validateEnvironment,
} from "./helpers/client.js";
import { TokenHandler } from "./handlers/tokenHandler.js";
import { 
  TransactionReferenceCodec,
  type TransactionReference 
} from "@xmtp/content-type-transaction-reference";
import {
  WalletSendCallsCodec,
} from "@xmtp/content-type-wallet-send-calls";
import { Client, type XmtpEnv } from "@xmtp/node-sdk";
import {
  ActionsCodec,
} from "./types/ActionsContent.js";
import {
  IntentCodec,
  type IntentContent,
} from "./types/IntentContent.js";
import { 
  handleTextMessage, 
  handleIntentMessage 
} from "./handlers/messageHandlers.js";
import { handleTransactionReference } from "./handlers/transactionHandlers.js";

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
      codecs: [new WalletSendCallsCodec(), new TransactionReferenceCodec(), new ActionsCodec(), new IntentCodec()],
    });

    const identifier = await signer.getIdentifier();
    const agentAddress = identifier.identifier;
    
    void logAgentDetails(client);

    // Sync conversations
    console.log("🔄 Syncing conversations...");
    await client.conversations.sync();

    console.log("👂 Listening for messages...");
    
    // Keep the bot running with proper error handling
    while (true) {
      try {
        const stream = await client.conversations.streamAllMessages();

        for await (const message of stream) {
          try {
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
            } else if (message.contentType?.typeId === "intent") {
              console.log("🎯 Detected intent message");
              console.log("📋 Raw intent content:", JSON.stringify(message.content, null, 2));
              await handleIntentMessage(
                conversation,
                message.content as IntentContent,
                senderAddress,
                agentAddress,
                tokenHandler
              );
            } else {
              continue;
            }
          } catch (messageError: unknown) {
            const errorMessage = messageError instanceof Error ? messageError.message : String(messageError);
            console.error("❌ Error processing individual message:", errorMessage);
            try {
              const conversation = await client.conversations.getConversationById(
                message?.conversationId || ""
              );
              if (conversation) {
                await conversation.send(
                  `❌ Error processing message: ${errorMessage}`
                );
              }
            } catch (sendError) {
              console.error("❌ Failed to send error message to conversation:", sendError);
            }
          }
        }
      } catch (streamError: unknown) {
        const errorMessage = streamError instanceof Error ? streamError.message : String(streamError);
        console.error("❌ Stream error occurred:", errorMessage);
        console.log("🔄 Attempting to reconnect in 5 seconds...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Re-sync conversations before attempting to recreate stream
        try {
          await client.conversations.sync();
          console.log("✅ Conversations re-synced successfully");
        } catch (syncError) {
          console.error("❌ Failed to sync conversations:", syncError);
        }
      }
    }
  } catch (error) {
    console.error("💥 Initialization error:", error);
    console.log("🔄 Bot failed to initialize. Please check your configuration and try again.");
    process.exit(1);
  }
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