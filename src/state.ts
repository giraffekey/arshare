interface State {
  isConnectPending: boolean
  account: string
  chainId: number
  setConnectPending: (isPending: Readonly<boolean>) => void
  setAccount: (account: Readonly<string>) => void
  setChain: (chainId: Readonly<number>) => void
}

const State: State = {
  isConnectPending: false,
  account: null,
  chainId: null,
  setConnectPending(isPending: Readonly<boolean>) {
    State.isConnectPending = isPending
  },
  setAccount(account: Readonly<string>) {
    State.account = account
  },
  setChain(chainId: Readonly<number>) {
    State.chainId = chainId
  },
}

export default State
