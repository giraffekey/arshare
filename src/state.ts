import type { WebBundlr } from "@bundlr-network/client"
import { defaultChainId } from "./config"

export interface FileUpload {
  link: string
  name: string
  size: number
  date: Date
  error: string
  progress: {
    encrypted: number
    funded: boolean
    signed: boolean
    uploaded: number
  }
}

type FileProgress = "encrypted" | "funded" | "signed" | "uploaded"

export interface State {
  isConnectPending: boolean
  account: string
  chainId: number
  bundlr: WebBundlr
  files: { [id: number]: FileUpload }
  setConnectPending: (isPending: boolean) => void
  setAccount: (account: string) => void
  setChain: (chainId: number) => void
  setBundlr: (bundlr: WebBundlr) => void
  addFile: (file: File) => number
  updateFileProgress: (
    id: number,
    type: FileProgress,
    value: number | boolean,
  ) => void
  setFileLink: (id: number, link: string) => void
  setFileError: (id: number, error: string) => void
}

const State: State = {
  isConnectPending: false,
  account: null,
  chainId: defaultChainId,
  bundlr: null,
  files: [],
  setConnectPending(isPending: boolean) {
    State.isConnectPending = isPending
  },
  setAccount(account: string) {
    State.account = account
  },
  setChain(chainId: number) {
    State.chainId = chainId
  },
  setBundlr(bundlr: WebBundlr) {
    State.bundlr = bundlr
  },
  addFile(file: File): number {
    const id = Math.floor(Math.random() * Number.MAX_VALUE)
    State.files[id] = {
      link: null,
      name: file.name,
      size: file.size,
      date: new Date(),
      error: null,
      progress: {
        encrypted: 0,
        funded: false,
        signed: false,
        uploaded: 0,
      },
    }
    return id
  },
  updateFileProgress(id: number, type: FileProgress, value: number | boolean) {
    State.files[id].progress[type] = value as never
  },
  setFileLink(id: number, link: string) {
    State.files[id].link = link
  },
  setFileError(id: number, error: string) {
    State.files[id].error = error
  },
}

export default State
