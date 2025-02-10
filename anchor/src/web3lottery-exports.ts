// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import Web3lotteryIDL from '../target/idl/web3lottery.json'
import type { Web3lottery } from '../target/types/web3lottery'

// Re-export the generated IDL and type
export { Web3lottery, Web3lotteryIDL }

// The programId is imported from the program IDL.
export const WEB3LOTTERY_PROGRAM_ID = new PublicKey(Web3lotteryIDL.address)

// This is a helper function to get the Web3lottery Anchor program.
export function getWeb3lotteryProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...Web3lotteryIDL, address: address ? address.toBase58() : Web3lotteryIDL.address } as Web3lottery, provider)
}

// This is a helper function to get the program ID for the Web3lottery program depending on the cluster.
export function getWeb3lotteryProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Web3lottery program on devnet and testnet.
      return new PublicKey('coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF')
    case 'mainnet-beta':
    default:
      return WEB3LOTTERY_PROGRAM_ID
  }
}
