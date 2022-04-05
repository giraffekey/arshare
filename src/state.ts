import type { WebBundlr } from "@bundlr-network/client"
import { defaultChainId } from "./config"

interface State {
  isConnectPending: boolean
  account: string
  chainId: number
  bundlr: WebBundlr
  links: string[]
  setConnectPending: (isPending: Readonly<boolean>) => void
  setAccount: (account: Readonly<string>) => void
  setChain: (chainId: Readonly<number>) => void
  setBundlr: (bundlr: Readonly<WebBundlr>) => void
  addLink: (link: Readonly<string>) => void
}

const State: State = {
  isConnectPending: false,
  account: null,
  chainId: defaultChainId,
  bundlr: null,
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
  setBundlr(bundlr: Readonly<WebBundlr>) {
    State.bundlr = bundlr
  },
  addLink(link: Readonly<string>) {
    State.links.unshift(link)
  },
}

export default State
