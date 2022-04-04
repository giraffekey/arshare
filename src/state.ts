interface State {
  isConnectPending: boolean
  account: string
  chainId: number
  links: string[]
  setConnectPending: (isPending: Readonly<boolean>) => void
  setAccount: (account: Readonly<string>) => void
  setChain: (chainId: Readonly<number>) => void
  addLink: (link: Readonly<string>) => void
}

const State: State = {
  isConnectPending: false,
  account: null,
  chainId: 80001,
  links: [],
  setConnectPending(isPending: Readonly<boolean>) {
    State.isConnectPending = isPending
  },
  setAccount(account: Readonly<string>) {
    State.account = account
  },
  setChain(chainId: Readonly<number>) {
    State.chainId = chainId
  },
  addLink(link: Readonly<string>) {
    State.links.unshift(link)
  },
}

export default State
