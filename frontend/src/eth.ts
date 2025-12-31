import { createPublicClient, createWalletClient, custom, defineChain, http } from "viem";

export const hardhat31337 = defineChain({
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] }
  }
});

export const publicClient = createPublicClient({
  chain: hardhat31337,
  transport: http("http://127.0.0.1:8545")
});

export function getWalletClient() {
  if (!window.ethereum) throw new Error("Chưa cài MetaMask");
  return createWalletClient({
    chain: hardhat31337,
    transport: custom(window.ethereum)
  });
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
