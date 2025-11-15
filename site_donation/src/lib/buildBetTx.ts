// site_donation/src/lib/buildBetTx.ts

import { Transaction } from "@mysten/sui/transactions";
import {
  PACKAGE_ID,
  MODULE_NAME,
  EVENT_ID,
  MIST_PER_SUI,
} from "../config/contract";

export type Side = "A" | "B";

type BuildBetTxParams = {
  side: Side;
  amountSui: number;
};

export function buildBetTx({ side, amountSui }: BuildBetTxParams) {
  const tx = new Transaction();

  // SUI → MIST（整数）
  const amountMist = Math.round(amountSui * MIST_PER_SUI);
  if (amountMist <= 0) {
    throw new Error("Bet amount must be positive");
  }

  // ガスコインから支払い用のコインを取り出す
  const [betCoin] = tx.splitCoins(tx.gas, [amountMist]);

  // サイドに応じて呼ぶ関数を切り替え
  const fnName = side === "A" ? "donate_for_a" : "donate_for_b";
  const target: string = `${PACKAGE_ID}::${MODULE_NAME}::${fnName}`;
  console.log("moveCall target =", target, "amountMist =", amountMist);

  // Move: public entry fun donate_for_a(event: &mut CharityBetEvent, payment: Coin<SUI>, ctx: &mut TxContext)
  tx.moveCall({
    target: target,
    arguments: [
      tx.object(EVENT_ID), // &mut CharityBetEvent（shared object）
      betCoin,             // Coin<SUI>
      // TxContext は自動で渡されるので何も書かなくてよい
    ],
  });

  return tx;
}
