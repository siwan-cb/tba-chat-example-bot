import { generateEncryptionKeyHex } from "../src/helpers/client.js";
import { generatePrivateKey } from "viem/accounts";
import { appendFileSync, existsSync } from "fs";

console.log("🔑 Generating XMTP keys...");

const walletKey = generatePrivateKey();
const encryptionKey = generateEncryptionKeyHex();

const envContent = `
# Generated XMTP keys - ${new Date().toISOString()}
WALLET_KEY=${walletKey}
ENCRYPTION_KEY=${encryptionKey}
XMTP_ENV=dev
NETWORK_ID=base-sepolia
`;

const envFile = ".env";

try {
  if (existsSync(envFile)) {
    appendFileSync(envFile, envContent);
    console.log("✅ Keys appended to existing .env file");
  } else {
    appendFileSync(envFile, envContent.trim() + "\n");
    console.log("✅ Created .env file with new keys");
  }

  console.log("\n🔑 Generated keys:");
  console.log("WALLET_KEY:", walletKey);
  console.log("ENCRYPTION_KEY:", encryptionKey);
  console.log("\n⚠️  Keep these keys secure and never share them publicly!");
  console.log("\n📝 You can now run the bot with: yarn dev");
} catch (error) {
  console.error("❌ Error writing to .env file:", error);
  console.log("\n🔑 Generated keys (add these to your .env file manually):");
  console.log("WALLET_KEY=" + walletKey);
  console.log("ENCRYPTION_KEY=" + encryptionKey);
  console.log("XMTP_ENV=dev");
  console.log("NETWORK_ID=base-sepolia");
} 