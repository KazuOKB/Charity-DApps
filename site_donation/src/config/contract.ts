// site_donation/src/config/contract.ts

// Vite の .env から読み込む値
// 例：
// VITE_NETWORK=testnet
// VITE_PACKAGE_ID=0x234a1e1c...
// VITE_MODULE_NAME=charity_bet
// VITE_FUNCTION_NAME=bet
// VITE_EVENT_ID=0x...  // プール or イベントのオブジェクトID
export const NETWORK =
  (import.meta.env.VITE_NETWORK as "devnet" | "testnet" | "mainnet") ?? "testnet";

export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID as string;
export const MODULE_NAME = import.meta.env.VITE_MODULE_NAME ?? "charity_bet";
export const FUNCTION_NAME = import.meta.env.VITE_FUNCTION_NAME ?? "bet";

// 試合ごとのプール（shared object 等）の ID
export const EVENT_ID = import.meta.env.VITE_EVENT_ID as string;

// 1 SUI = 10^9 MIST
export const MIST_PER_SUI = 1_000_000_000;
