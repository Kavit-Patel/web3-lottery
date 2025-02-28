import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export interface ICreateLottery {
  wallet: WalletContextState;
  title: string;
  deadline: BN;
  platform_fee_bps: BN;
  platform_wallet: PublicKey;
}
export interface ILotteryParticipant {
  pubkey: PublicKey;
  ticket: BN;
}
// export interface ILottery {
//   title: string;
//   owner: PublicKey;
//   deadline: BN;
//   total_amount: BN;
//   total_entry: BN;
//   platform_fee_bps: BN;
//   platform_wallet: PublicKey;
//   lottery_bump: number;
//   escrow_bump: number;
//   claimable_bump: number;
//   escrow_wallet: PublicKey;
//   claimable_wallet: PublicKey;
//   status: "Active" | "WinnerSelected" | "Completed";
//   winner: null | PublicKey;
//   lottery_drawer: PublicKey;
//   participants: ILotteryParticipant[];
// }
export interface ILottery {
  title: string;
  owner: PublicKey;
  deadline: BN;
  totalAmount: BN;
  totalEntry: BN;
  platformFeeBps: BN;
  platformWallet: PublicKey;
  lotteryBump: number;
  escrowBump: number;
  claimableBump: number;
  escrowWallet: PublicKey;
  claimableWallet: PublicKey;
  status: "Active" | "WinnerSelected" | "Completed";
  winner: null | PublicKey;
  lotteryDrawer: PublicKey;
  participants: ILotteryParticipant[];
}
export interface IProgramAccount<ILottery> {
  publicKey: PublicKey;
  account: ILottery;
}
export interface ILotteryChooseWinner {
  wallet: WalletContextState;
  lottery: PublicKey;
}
export interface ILotteryTransferLotteryCash {
  wallet: WalletContextState;
  lottery: PublicKey;
  winner: PublicKey;
  escrowWallet: PublicKey;
  platformWallet: PublicKey;
}
