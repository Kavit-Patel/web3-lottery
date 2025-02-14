import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Lottery } from "../target/types/lottery";
import { BN } from "bn.js";
import assert from "assert";

describe("web3lottery", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.lottery as Program<Lottery>;
  const title = "loot";
  const deadline = new BN(1858911391);
  const amount = new BN(5000000000);

  let lotteryPda: PublicKey;
  let escrowPda: PublicKey;
  let buyerPda: PublicKey;
  let buyer = Keypair.generate();
  let winner: PublicKey;
  let claimableWalletPda: PublicKey;
  let platform_fee_basis = new BN(200);
  let platform_wallet = new PublicKey(
    "4KLkUmYAEiL7gLjsyjB1dye9BvzKJk2cFebwyZJFfvFU"
  );

  beforeAll(async () => {
    // buyer = Keypair.generate();
    console.log("KEYPAIR ", buyer);
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(
        buyer.publicKey,
        100000000000
      )
    );

    lotteryPda = PublicKey.findProgramAddressSync(
      [
        Buffer.from("lottery"),
        provider.wallet.publicKey.toBuffer(),
        Buffer.from(title),
      ],
      program.programId
    )[0];
    escrowPda = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        provider.wallet.publicKey.toBuffer(),
        lotteryPda.toBuffer(),
      ],
      program.programId
    )[0];
    buyerPda = PublicKey.findProgramAddressSync(
      [Buffer.from("buyer"), buyer.publicKey.toBuffer(), lotteryPda.toBuffer()],
      program.programId
    )[0];
    claimableWalletPda = PublicKey.findProgramAddressSync(
      [
        Buffer.from("winner"),
        lotteryPda.toBuffer(),
        buyer.publicKey.toBuffer(),
      ],
      program.programId
    )[0];
  });

  it("Is initialized!", async () => {
    console.log("lotery ", lotteryPda.toString());
    console.log("escrow ", escrowPda.toString());
    console.log("buyer  ", buyerPda.toString());
    // Add your test here.
    const initialized = await provider.connection.getAccountInfo(lotteryPda);
    console.log("INITIALIZED ", initialized);
    if (!initialized) {
      const tx = await program.methods
        .initializeLottery(title, deadline, platform_fee_basis, platform_wallet)
        .accounts({
          lottery: lotteryPda,
          escrowWallet: escrowPda,
          signer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
      console.log("Your transaction signature", tx);
    }
    const lottery_account = await program.account.lotteryState.fetch(
      lotteryPda
    );
    console.log("Title ", lottery_account.title.toString());
    console.log("Title ", lottery_account.deadline.toString());
    console.log("escrow bump ", lottery_account.escrowBump.toString());
    assert.equal(title, lottery_account.title, "Title mismatch");
    console.log("dead ", deadline);
    console.log("dead given", new BN(lottery_account.deadline));
    assert.ok(
      deadline.eq(new BN(lottery_account.deadline)),
      "Deadline mismatch"
    );
  });
  it("Buy Ticket ", async () => {
    const tx = await program.methods
      .buyTicket(amount)
      .accounts({
        lottery: lotteryPda,
        escrowWallet: escrowPda,
        buyer: buyerPda,
        signer: buyer.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([buyer])
      .rpc();
    console.log("buy tx ", tx);
    const lottery_account = await program.account.lotteryState.fetch(
      lotteryPda
    );
    console.log("lotery total entry ", lottery_account.totalEntry);

    lottery_account.participants.map((e) => {
      console.log("Participant", e.pubkey.toString());
      console.log("Ticket", e.ticket.toString());
    });

    console.log(
      "lottery total amount ",
      lottery_account.totalAmount.toNumber()
    );
  });
  it("Choosing Winner ", async () => {
    const randomness_helper = Math.floor(
      (Math.random() * 10000 * Date.now()) / 1000
    );
    const tx = await program.methods
      .chooseWinner(new BN(randomness_helper))
      .accounts({
        lottery: lotteryPda,
        signer: buyer.publicKey,
      })
      .signers([buyer])
      .rpc();
    console.log("Choose winner tx ", tx);
    const lottery_account = await program.account.lotteryState.fetch(
      lotteryPda
    );
    console.log("Lottery Winner ", lottery_account.winner?.toString());
    console.log(
      "Lottery Winner drawer ",
      lottery_account.lotteryDrawer.toString()
    );
    assert.ok(lottery_account.winner, "Winner not choosen");
  });
  it("Transfer to claimable wallet ", async () => {
    const tx = await program.methods
      .transferToClaimableWallet()
      .accounts({
        lottery: lotteryPda,
        escrowWallet: escrowPda,
        platformWallet: platform_wallet,
        signer: provider.wallet.publicKey,
        claimableWallet: claimableWalletPda,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
    console.log("Transfer to claimable wallet ", tx);
    console.log("claimable wallet ", claimableWalletPda.toString());
  });
  it("Claim Prize", async () => {
    const tx = await program.methods
      .claimPrize()
      .accounts({
        lottery: lotteryPda,
        claimableWallet: claimableWalletPda,
        winner: buyer.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([buyer])
      .rpc();
    console.log("Claim tx ", tx);
  });
});
