import { TokenHandler } from "./tokenHandler.js";
import { getExplorerUrl } from "../helpers/utils.js";
import { 
  type TransactionReference 
} from "@xmtp/content-type-transaction-reference";

export async function handleTransactionReference(
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