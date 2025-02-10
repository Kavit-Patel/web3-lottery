import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair} from '@solana/web3.js'
import {Web3lottery} from '../target/types/web3lottery'

describe('web3lottery', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Web3lottery as Program<Web3lottery>

  const web3lotteryKeypair = Keypair.generate()

  it('Initialize Web3lottery', async () => {
    await program.methods
      .initialize()
      .accounts({
        web3lottery: web3lotteryKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([web3lotteryKeypair])
      .rpc()

    const currentCount = await program.account.web3lottery.fetch(web3lotteryKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Web3lottery', async () => {
    await program.methods.increment().accounts({ web3lottery: web3lotteryKeypair.publicKey }).rpc()

    const currentCount = await program.account.web3lottery.fetch(web3lotteryKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Web3lottery Again', async () => {
    await program.methods.increment().accounts({ web3lottery: web3lotteryKeypair.publicKey }).rpc()

    const currentCount = await program.account.web3lottery.fetch(web3lotteryKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Web3lottery', async () => {
    await program.methods.decrement().accounts({ web3lottery: web3lotteryKeypair.publicKey }).rpc()

    const currentCount = await program.account.web3lottery.fetch(web3lotteryKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set web3lottery value', async () => {
    await program.methods.set(42).accounts({ web3lottery: web3lotteryKeypair.publicKey }).rpc()

    const currentCount = await program.account.web3lottery.fetch(web3lotteryKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the web3lottery account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        web3lottery: web3lotteryKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.web3lottery.fetchNullable(web3lotteryKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
