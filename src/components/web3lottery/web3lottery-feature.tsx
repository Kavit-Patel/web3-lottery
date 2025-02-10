'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { AppHero, ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useWeb3lotteryProgram } from './web3lottery-data-access'
import { Web3lotteryCreate, Web3lotteryList } from './web3lottery-ui'

export default function Web3lotteryFeature() {
  const { publicKey } = useWallet()
  const { programId } = useWeb3lotteryProgram()

  return publicKey ? (
    <div>
      <AppHero
        title="Web3lottery"
        subtitle={
          'Create a new account by clicking the "Create" button. The state of a account is stored on-chain and can be manipulated by calling the program\'s methods (increment, decrement, set, and close).'
        }
      >
        <p className="mb-6">
          <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>
        <Web3lotteryCreate />
      </AppHero>
      <Web3lotteryList />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}
