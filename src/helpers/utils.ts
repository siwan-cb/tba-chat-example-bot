export function getExplorerUrl(txHash: string, networkId: string): string {
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