"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "../solana/solana-provider";
import { AppHero, ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { useWeb3lotteryProgram } from "./web3lottery-data-access";
import {
  Web3lotteryCreate,
  Web3lotteryList,
  Web3LotteryLive,
} from "./web3lottery-ui";
import { usePathname } from "next/navigation";

export default function Web3lotteryFeature() {
  const wallet = useWallet();
  let pathname = usePathname();
  return wallet && wallet.connected && wallet.publicKey ? (
    <>
      {pathname == "/createLottery" ? (
        <>
          <Web3lotteryCreate wallet={wallet} />
          <Web3lotteryList walletPubKey={wallet.publicKey} />
        </>
      ) : pathname == "/buyLottery" ? (
        <Web3LotteryLive wallet={wallet} />
      ) : (
        <div className="w-full h-96 flex justify-center items-center">
          Feature Under development
        </div>
      )}
    </>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  );
}
