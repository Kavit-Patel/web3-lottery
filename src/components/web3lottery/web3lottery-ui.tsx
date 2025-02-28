"use client";

import { Keypair, PublicKey } from "@solana/web3.js";
import { Dispatch, FormEvent, SetStateAction, useMemo, useState } from "react";
import { ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import {
  useLotteryAccounts,
  useWeb3lotteryProgram,
} from "./web3lottery-data-access";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { BN } from "bn.js";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { ILottery, IProgramAccount } from "./types";

import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import { ImCancelCircle } from "react-icons/im";
import toast from "react-hot-toast";
import { unixTimeStamp } from "../common/common-utils";
import { error } from "console";
import Link from "next/link";
import { ProgramAccount } from "@coral-xyz/anchor";

export function Web3lotteryCreate({ wallet }: { wallet: WalletContextState }) {
  const { createLottery } = useWeb3lotteryProgram();
  const [title, setTitle] = useState<string>("");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [fee, setFee] = useState<string>("");
  const [platformWallet, setPlatformWallet] = useState<string>("");

  const handleCreateLottery = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !deadline || !platformWallet) {
      toast("Please fill all the details !");
      return;
    }
    await createLottery.mutateAsync({
      wallet,
      title,
      deadline: new BN(unixTimeStamp(deadline)),
      platform_fee_bps: new BN(+fee),
      platform_wallet: new PublicKey(platformWallet),
    });
    setTitle("");
    setDeadline(null);
    setFee("");
    setPlatformWallet("");
  };

  return (
    <div className="mt-24 flex flex-col w-full  justify-center items-center gap-4">
      <form
        onSubmit={(e) => handleCreateLottery(e)}
        className="w-[28rem] rounded-md flex flex-col gap-4 justify-center items-center border border-gray-500 p-20"
      >
        <h2 className="text-2xl mb-8">Create Lottery </h2>

        <input
          type="text"
          value={title || ""}
          onChange={(e) => setTitle(e.target.value)}
          className="input input-bordered w-full max-w-xs px-2 py-1 "
          placeholder="Title"
        />
        <Flatpickr
          data-enable-time
          value={deadline || ""}
          onChange={(end) => setDeadline(end[0])}
          options={{
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            disableMobile: true,
          }}
          className=" input input-bordered w-full max-w-xs px-2 py-1 "
          placeholder="Lottery Deadline"
        />
        <input
          type="text"
          value={fee || ""}
          onChange={(e) => setFee(e.target.value)}
          className="input input-bordered w-full max-w-xs px-2 py-1 "
          placeholder="Platform fee in % (max 50%)"
        />
        <input
          type="text"
          value={platformWallet || ""}
          onChange={(e) => setPlatformWallet(e.target.value)}
          className="input input-bordered w-full max-w-xs px-2 py-1 "
          placeholder="Platform Wallet key"
        />
        <button
          className="btn btn-xs lg:btn-md btn-primary w-full"
          disabled={createLottery.isPending}
        >
          {createLottery.isPending ? (
            <div className="text-xs loading loading-spinner"></div>
          ) : (
            "Create"
          )}
        </button>
      </form>
    </div>
  );
}

export function Web3lotteryList({ walletPubKey }: { walletPubKey: PublicKey }) {
  const { lotteryAccounts } = useLotteryAccounts(walletPubKey);
  const [showList, setShowList] = useState<boolean>(false);
  return (
    <div className="flex justify-center flex-col gap-4 mt-8">
      <div className="container mx-auto">
        <div className="md:relative flex flex-col-reverse gap-4">
          <button
            onClick={async () => {
              await lotteryAccounts.refetch();
              setShowList((prev) => !prev);
            }}
            className="btn text-xl w-full"
          >
            Past Lotteries List
          </button>
        </div>
        {showList && (
          <>
            {lotteryAccounts.data &&
            lotteryAccounts.data.lotteriesIOwn?.length ? (
              <>
                <button
                  onClick={() => setShowList(false)}
                  className="text-red-400 text-3xl absolute top-24 right-9 z-10"
                >
                  <ImCancelCircle />
                </button>
                <div className="w-full  flex justify-center items-center absolute top-20 left-0  bg-gray-800  h-[calc(100vh-100px)] ">
                  <PerfectScrollbar className="w-full h-full overflow-auto">
                    <div
                      className={`grid gap-6  ${
                        lotteryAccounts.data.lotteriesIOwn.length === 1
                          ? "grid-cols-1 justify-center"
                          : lotteryAccounts.data.lotteriesIOwn.length === 2
                          ? "grid-cols-1 md:grid-cols-2 justify-center"
                          : lotteryAccounts.data.lotteriesIOwn.length === 3
                          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 justify-center"
                          : "sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      }`}
                    >
                      {lotteryAccounts.data.lotteriesIOwn.map(
                        (lottery, index) => (
                          <Web3lotteryCard
                            key={index}
                            lottery={lottery.account}
                          />
                        )
                      )}
                    </div>
                  </PerfectScrollbar>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400">
                No lotteries found.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function Web3lotteryCard({ lottery }: { lottery: ILottery }) {
  return (
    <div className="flex justify-center items-center">
      <div className="w-full rounded-2xl shadow-xl p-4 text-gray-100 transition transform  hover:shadow-2xl ">
        <h2 className="text-3xl font-extrabold mb-4 text-center">
          {lottery.title || "N/A"}
        </h2>
        <div className="space-y-2">
          <p>
            <span className="font-semibold">Owner:</span>{" "}
            {lottery.owner?.toString() || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Deadline:</span>{" "}
            {lottery.deadline
              ? new Date(lottery.deadline.toNumber() * 1000).toLocaleString()
              : "N/A"}
          </p>
          <p>
            <span className="font-semibold">Total Amount:</span>{" "}
            {lottery.totalAmount?.toNumber() || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Total Entries:</span>{" "}
            {lottery.totalEntry?.toNumber() || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            {lottery.status && typeof lottery.status === "object" ? (
              <span
                className={`inline-block px-2 py-1 rounded-md text-sm text-black ${
                  Object.keys(lottery.status)[0] === "active"
                    ? "bg-green-500"
                    : Object.keys(lottery.status)[0] === "winnerselected"
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
              >
                {Object.keys(lottery.status)[0]}
              </span>
            ) : (
              "N/A"
            )}
          </p>
          <p className="w-inherit truncate">
            <span className="font-semibold">Winner:</span>{" "}
            {lottery.winner?.toString() || "Lottery Draw Due"}
          </p>
          <p
            className="w-inherit truncate"
            title={lottery.lotteryDrawer?.toString()}
          >
            <span className="font-semibold ">Lottery Drawer:</span>{" "}
            {(lottery.lotteryDrawer?.toString() !==
              "11111111111111111111111111111111" &&
              lottery.lotteryDrawer?.toString()) ||
              "Lottery Draw Due"}
          </p>
          <p className="w-inherit truncate">
            <span className="font-semibold ">Claimable Wallet:</span>{" "}
            {(lottery.claimableWallet?.toString() !==
              "11111111111111111111111111111111" &&
              lottery.claimableWallet?.toString()) ||
              "Transfer Pending"}
          </p>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Participants</h3>
          {lottery.participants && lottery.participants.length > 0 ? (
            <ul className="list-disc list-inside h-12 overflow-y-auto">
              <PerfectScrollbar options={{ suppressScrollX: true }}>
                {lottery.participants.map((participant, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="font-semibold">Pubkey:</span>{" "}
                    {participant.pubkey?.toString() || "N/A"} -{" "}
                    <span className="font-semibold">Ticket:</span>{" "}
                    {participant.ticket?.toString() || "N/A"}
                  </li>
                ))}
              </PerfectScrollbar>
            </ul>
          ) : (
            <p className="text-gray-400 h-12">No participants yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
export function Web3LotteryLive({ wallet }: { wallet: WalletContextState }) {
  const { allLotteries } = useWeb3lotteryProgram();
  const [selectedLottery, setSelectedLottery] =
    useState<ProgramAccount<ILottery> | null>(null);
  return allLotteries.isPending ? (
    <div className="loading loading-spinner"></div>
  ) : allLotteries.error ? (
    <div className="w-full h-full justify-center items-center">
      {allLotteries.error.message}
    </div>
  ) : allLotteries.data ? (
    <>
      <h2 className="w-full md:w-[68rem] mt-12 mb-4 text-xl md:text-3xl text-center">
        List of Live Lotteries
      </h2>
      <div className="w-full md:w-[68rem] md:text-xl h-[calc(100vh-410px)]">
        <PerfectScrollbar
          className="w-full gap-3 flex flex-col items-center overflow-auto"
          options={{
            suppressScrollX: true,
            wheelPropagation: false,
          }}
        >
          {allLotteries.data.filter(
            (lotteries) =>
              lotteries.account.deadline.toNumber() >
              Math.floor(Date.now() / 1000)
          ).length > 0 ? (
            allLotteries.data
              .filter(
                (lotteries) =>
                  lotteries.account.deadline.toNumber() >
                  Math.floor(Date.now() / 1000)
              )
              .map((activeLottery) => (
                <div
                  onClick={() => setSelectedLottery(activeLottery)}
                  key={activeLottery.publicKey.toString()}
                  className={`w-full flex gap-2 sm:grid sm:grid-cols-[1fr_3fr] px-2 md:px-8 py-3 rounded-md transition-all cursor-pointer 
                  ${
                    selectedLottery?.publicKey.toString() ===
                    activeLottery.publicKey.toString()
                      ? "bg-gray-900 scale-105 shadow-xl"
                      : "bg-gray-700 hover:bg-gray-900 hover:scale-105 hover:shadow-xl"
                  }`}
                >
                  <span className="">{activeLottery.account.title}</span>
                  <span className="truncate w-24 sm:w-full">
                    {activeLottery.account.owner.toString()}
                  </span>
                </div>
              ))
          ) : (
            <div className="w-full flex h-96 justify-center items-center">
              <span>
                {" "}
                No Live Lotteries !{" "}
                <Link
                  href="/createLottery"
                  className="text-blue-300 transition-all hover:text-blue-400 active:scale-95"
                >
                  Create One !
                </Link>
              </span>
            </div>
          )}
        </PerfectScrollbar>
      </div>
      {selectedLottery && (
        <Web3LotteryBuyCard wallet={wallet} lottery={selectedLottery} />
      )}
    </>
  ) : (
    <div>Something went wrong</div>
  );
}

export function Web3LotteryBuyCard({
  wallet,
  lottery,
}: {
  wallet: WalletContextState;
  lottery: ProgramAccount<ILottery> | null;
}) {
  const { buyLottery } = useWeb3lotteryProgram();
  const [amount, setAmount] = useState<number>(0.1);

  const handleBuyLottery = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (+amount < 0.1 || !lottery) {
      toast("Fill all the details !");
      return;
    }
    await buyLottery.mutateAsync({
      wallet,
      amount: new BN(amount * 1000000000),
      lottery: lottery.publicKey,
      lotteryWallet: lottery.account.escrowWallet,
    });
  };

  return (
    <div className="mt-10 flex flex-col w-full  justify-center items-center gap-4">
      <form
        onSubmit={(e) => handleBuyLottery(e)}
        className="w-[28rem] rounded-md flex flex-col gap-4 justify-center items-center border border-gray-500 p-10"
      >
        <h2 className="text-2xl mb-8">
          Buy Lottery - {lottery?.account.title}
        </h2>

        <input
          disabled
          type="text"
          // value={amount}
          // onChange={(e) => setAmount(+e.target.value)}
          className="input input-bordered w-full max-w-xs px-2 py-1 "
          placeholder="Ticket amount is  0.1 sol"
        />
        <button
          className="btn btn-xs lg:btn-md btn-primary w-full"
          disabled={buyLottery.isPending}
        >
          {buyLottery.isPending ? (
            <div className="text-xs loading loading-spinner"></div>
          ) : (
            "Buy"
          )}
        </button>
      </form>
    </div>
  );
}

export function Web3LotteryExecution({
  wallet,
}: {
  wallet: WalletContextState;
}) {
  const { allLotteries } = useWeb3lotteryProgram();
  const [selectedLottery, setSelectedLottery] =
    useState<ProgramAccount<ILottery> | null>(null);
  return allLotteries.isPending ? (
    <div className="loading loading-spinner"></div>
  ) : allLotteries.error ? (
    <div className="w-full h-full justify-center items-center">
      {allLotteries.error.message}
    </div>
  ) : allLotteries.data ? (
    <>
      <h2 className="w-full md:w-[68rem] mt-12 mb-4 text-xl md:text-3xl text-center">
        List of Lotteries Tobe Executed
      </h2>
      <div className="w-full md:w-[68rem] md:text-xl h-[calc(100vh-410px)]">
        <PerfectScrollbar
          className="w-full gap-3 flex flex-col items-center overflow-auto"
          options={{
            suppressScrollX: true,
            wheelPropagation: false,
          }}
        >
          {allLotteries.data.filter(
            (lotteries) =>
              Object.keys(lotteries.account.status)[0] != "completed" &&
              lotteries.account.claimableWallet.toString() ==
                "11111111111111111111111111111111" &&
              lotteries.account.participants.length &&
              lotteries.account.deadline.toNumber() <
                Math.floor(Date.now() / 1000)
          ).length > 0 ? (
            allLotteries.data
              .filter(
                (lotteries) =>
                  Object.keys(lotteries.account.status)[0] != "completed" &&
                  lotteries.account.claimableWallet.toString() ==
                    "11111111111111111111111111111111" &&
                  lotteries.account.participants.length &&
                  lotteries.account.deadline.toNumber() <
                    Math.floor(Date.now() / 1000)
              )
              .map((lotteriesTobeExecuted) => (
                <div
                  onClick={() => setSelectedLottery(lotteriesTobeExecuted)}
                  key={lotteriesTobeExecuted.publicKey.toString()}
                  className={`w-full flex gap-2 sm:grid sm:grid-cols-[1fr_3fr] px-2 md:px-8 py-3 rounded-md transition-all cursor-pointer 
                  ${
                    selectedLottery?.publicKey.toString() ===
                    lotteriesTobeExecuted.publicKey.toString()
                      ? "bg-gray-900 scale-105 shadow-xl"
                      : "bg-gray-700 hover:bg-gray-900 hover:scale-105 hover:shadow-xl"
                  }`}
                >
                  <span className="">
                    {lotteriesTobeExecuted.account.title}
                  </span>
                  <span className="truncate w-24 sm:w-full">
                    {lotteriesTobeExecuted.account.owner.toString()}
                  </span>
                </div>
              ))
          ) : (
            <div className="w-full flex h-96 justify-center items-center">
              <span> No Lotteries tobe executed ! </span>
            </div>
          )}
        </PerfectScrollbar>
      </div>
      {selectedLottery && (
        <ExecuteLotteryCard
          wallet={wallet}
          lottery={selectedLottery}
          setSelectedLottery={setSelectedLottery}
        />
      )}
    </>
  ) : (
    <div>Something went wrong</div>
  );
}

export function ExecuteLotteryCard({
  wallet,
  lottery,
  setSelectedLottery,
}: {
  wallet: WalletContextState;
  lottery: ProgramAccount<ILottery>;
  setSelectedLottery: Dispatch<SetStateAction<ProgramAccount<ILottery> | null>>;
}) {
  const { executeLottery } = useWeb3lotteryProgram();
  const handleExecuteLottery = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await executeLottery.mutateAsync({ wallet, lottery: lottery.publicKey });
    setSelectedLottery(null);
  };
  return (
    <div className="mt-10 flex flex-col w-full  justify-center items-center gap-4">
      <form
        onSubmit={(e) => handleExecuteLottery(e)}
        className="w-[28rem] rounded-md flex flex-col gap-4 justify-center items-center border border-gray-500 p-10"
      >
        <h2 className="text-2xl mb-8">
          Execute Lottery - {lottery?.account.title}
        </h2>
        <button
          className="btn btn-xs btn-md btn-primary w-full"
          disabled={executeLottery.isPending}
        >
          {executeLottery.isPending ? (
            <div className="text-xs loading loading-spinner"></div>
          ) : lottery.account.claimableWallet.toString() ==
            "11111111111111111111111111111111" ? (
            "Transfer to Claimable Wallet"
          ) : (
            "Execute"
          )}
        </button>
      </form>
    </div>
  );
}
