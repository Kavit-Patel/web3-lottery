"use client";

import {
  getWeb3lotteryProgram,
  getWeb3lotteryProgramId,
} from "@project/anchor";
import {
  useConnection,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import { Cluster, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";
import {
  ICreateLottery,
  ILottery,
  ILotteryChooseWinner,
  ILotteryTransferLotteryCash,
} from "./types";
import Error from "next/error";
import { ProgramAccount, Wallet } from "@coral-xyz/anchor";
import BN from "bn.js";
import { ErrorMessage } from "../common/common-utils";

export function useWeb3lotteryProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getWeb3lotteryProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = useMemo(
    () => getWeb3lotteryProgram(provider, programId),
    [provider, programId]
  );

  const allLotteries = useQuery({
    queryKey: ["lotteryAccount", "all", { cluster }],
    queryFn: async () =>
      (await program.account.lotteryState.all()) as unknown as ProgramAccount<ILottery>[],
  });
  const createLottery = useMutation<string, Error, ICreateLottery>({
    mutationKey: ["lottery", "create", { cluster }],
    mutationFn: async ({
      wallet,
      title,
      deadline,
      platform_fee_bps,
      platform_wallet,
    }) => {
      const [lotteryPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("lottery"),
          wallet.publicKey!.toBuffer(),
          Buffer.from(title),
        ],
        program.programId
      );
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          wallet.publicKey!.toBuffer(),
          lotteryPda.toBuffer(),
        ],
        program.programId
      );
      const tx = await program.methods
        .initializeLottery(title, deadline, platform_fee_bps, platform_wallet)
        .accounts({
          lottery: lotteryPda,
          escrow: escrowPda,
          signer: wallet.publicKey!,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: tx,
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      });
      allLotteries.refetch();
      return tx;
    },
    onSuccess: (tx) => {
      transactionToast(tx);
    },
    onError: (error) => {
      console.log("Error ", error);
      toast.error(ErrorMessage(error));
    },
  });
  const buyLottery = useMutation<
    string,
    Error,
    {
      wallet: WalletContextState;
      amount: BN;
      lottery: PublicKey;
      lotteryWallet: PublicKey;
    }
  >({
    mutationKey: ["buy", { cluster }],
    mutationFn: async ({
      wallet,
      amount,
      lottery,
      lotteryWallet,
    }: {
      wallet: WalletContextState;
      amount: BN;
      lottery: PublicKey;
      lotteryWallet: PublicKey;
    }) => {
      const tx = await program.methods
        .buyTicket(amount)
        .accounts({
          lottery: lottery,
          escrowWallet: lotteryWallet,
          signer: wallet.publicKey!,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: tx,
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      });
      allLotteries.refetch();
      return tx;
    },
    onSuccess: (tx) => {
      transactionToast(tx);
    },
    onError: (error) => {
      console.log("Error :", error);
      toast.error(ErrorMessage(error));
    },
  });
  const executeLottery = useMutation<
    ILotteryTransferLotteryCash,
    Error,
    ILotteryChooseWinner
  >({
    mutationKey: ["execute", "lottery", { cluster }],
    mutationFn: async ({ wallet, lottery }) => {
      let lotteryAcc = await program.account.lotteryState.fetch(lottery);
      if (!lotteryAcc.winner) {
        const randomness_helper = Math.floor(
          (Math.random() * 10000 * Date.now()) / 1000000
        );
        console.log("rand helper ", randomness_helper);
        const choose_winner_tx = await program.methods
          .chooseWinner(new BN(randomness_helper))
          .accounts({
            lottery,
            signer: wallet.publicKey!,
          })
          .rpc();
        const latestBlockHash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
          signature: choose_winner_tx,
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        });
        await allLotteries.refetch();
        toast("Winner has been choosen !");
        transactionToast(choose_winner_tx);
      }
      lotteryAcc = await program.account.lotteryState.fetch(lottery);
      return {
        wallet: wallet,
        lottery,
        winner: lotteryAcc.winner!,
        escrowWallet: lotteryAcc.escrowWallet,
        platformWallet: lotteryAcc.platformWallet,
      };
    },
    onSuccess: async ({
      wallet,
      lottery,
      winner,
      escrowWallet,
      platformWallet,
    }) => {
      const claimableWalletPda = PublicKey.findProgramAddressSync(
        [Buffer.from("winner"), lottery.toBuffer(), winner.toBuffer()],
        programId
      )[0];
      const lottery_cash_tx = await program.methods
        .transferToClaimableWallet()
        .accounts({
          lottery,
          escrowWallet,
          platformWallet,
          signer: wallet.publicKey!,
          claimableWallet: claimableWalletPda,
        } as any)
        .rpc();
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: lottery_cash_tx,
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      });
      allLotteries.refetch();
      toast.success("Lottery cash transfered to claimable wallet !");
      transactionToast(lottery_cash_tx);
    },
    onError: (error) => {
      console.log("Error :", error);
      toast.error(ErrorMessage(error));
    },
  });
  return {
    createLottery,
    program,
    allLotteries,
    buyLottery,
    executeLottery,
  };
}
export const useLotteryAccounts = (walletPubKey: PublicKey) => {
  const { allLotteries } = useWeb3lotteryProgram();
  const lotteryAccounts = useQuery({
    queryKey: [
      "lotteryAccounts",
      { allLotteries: allLotteries.data?.length },
      walletPubKey,
    ],
    queryFn: async () => {
      const lotteriesIOwn = allLotteries.data?.filter(
        (lottery) => lottery.account.owner.toBase58() == walletPubKey.toString()
      );
      const lotteriesIPurchased = allLotteries.data?.filter((lottery) =>
        lottery.account.participants.some(
          (participate) =>
            participate.pubkey.toBase58() == walletPubKey.toString()
        )
      );
      return { allLotteries, lotteriesIOwn, lotteriesIPurchased };
    },
    enabled: !!walletPubKey && !!allLotteries.data,
  });
  return {
    lotteryAccounts,
  };
};
