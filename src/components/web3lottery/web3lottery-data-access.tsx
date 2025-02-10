'use client'

import { getWeb3lotteryProgram, getWeb3lotteryProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function useWeb3lotteryProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getWeb3lotteryProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getWeb3lotteryProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['web3lottery', 'all', { cluster }],
    queryFn: () => program.account.web3lottery.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['web3lottery', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ web3lottery: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useWeb3lotteryProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useWeb3lotteryProgram()

  const accountQuery = useQuery({
    queryKey: ['web3lottery', 'fetch', { cluster, account }],
    queryFn: () => program.account.web3lottery.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['web3lottery', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ web3lottery: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['web3lottery', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ web3lottery: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['web3lottery', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ web3lottery: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['web3lottery', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ web3lottery: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
