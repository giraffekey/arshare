import m from "mithril"
import { ethers } from "ethers"
import type { Network } from "@ethersproject/providers"
import { WebBundlr } from "@bundlr-network/client"
import axios from "axios"
import {
  bundlrRpcs,
  bundlrCurrencies,
  rpcs,
  blockExplorers,
  metamaskChains,
} from "./chains"
import { decryptFile, decodeLink, encryptFile, encodeLink } from "./crypto"
import { defaultChainId } from "../config"
import state from "../state"

// Types

declare global {
  interface Window {
    ethereum: any
  }
}

interface ConnectInfo {
  chainId: string
}

interface UploadProgressUpdate {
  type: "encrypted" | "funded" | "signed" | "uploaded"
  value: number | boolean
}

interface DownloadProgressUpdate {
  type: "downloaded" | "decrypted"
  value: number
}

// Initialize

const provider = new ethers.providers.Web3Provider(window.ethereum, "any")

let preparing = false

if (window.ethereum.isConnected() && state.bundlr !== null)
  state.setAccount(window.ethereum.selectedAddress)
provider.getNetwork().then(handleNetwork)

// Helper functions

async function prepareBundlr() {
  if (!preparing) {
    preparing = true
    try {
      const bundlr = new WebBundlr(
        bundlrRpcs[state.chainId],
        bundlrCurrencies[state.chainId],
        provider,
        { providerUrl: rpcs[state.chainId] },
      )
      await bundlr.ready()
      state.setBundlr(bundlr)
      preparing = false
    } catch (e) {
      preparing = false
      throw e
    } 
  }
}

// Events

async function handleConnect(connectInfo?: ConnectInfo) {
  if (!state.account) {
    state.setConnectPending(true)
    m.redraw()

    if (connectInfo)
      state.setChain(ethers.BigNumber.from(connectInfo.chainId).toNumber())

    try {
      const accounts = await provider.send("eth_requestAccounts", [])
      await provider._ready()
      if (state.bundlr === null) await prepareBundlr()

      state.setAccount(accounts[0])
      state.setConnectPending(false)
      m.redraw()
    } catch (e) {
      state.setConnectPending(false)
      m.redraw()
      throw e
    }
  }
}

function handleDisconnect() {
  state.setAccount(null)
  m.redraw()
}

function handleAccounts(accounts: string[]) {
  state.setAccount(accounts[0])
  m.redraw()
}

async function handleNetwork(network: Network) {
  state.setChain(network.chainId)
  m.redraw()
  if (state.bundlr !== null) {
    await prepareBundlr()
    m.redraw()
  }
}

window.ethereum.on("connect", handleConnect)
window.ethereum.on("disconnect", handleDisconnect)
provider.on("accountsChanged", handleAccounts)
provider.on("network", handleNetwork)

// Exported functions

export function blockExplorerAccountURL(
  account: Readonly<string>,
): Readonly<string> {
  return `${
    blockExplorers[state.chainId] || blockExplorers[defaultChainId]
  }/address/${account}`
}

export async function connect() {
  await handleConnect()
}

export function disconnect() {
  state.setAccount(null)
}

export async function switchNetwork(chainId: Readonly<number>) {
  try {
    await provider.send("wallet_switchEthereumChain", [
      { chainId: ethers.utils.hexValue(chainId) },
    ])
  } catch (err) {
    if (err.code === 4902) {
      await provider.send("wallet_addEthereumChain", [metamaskChains[chainId]])
    }
  }

  state.setChain(chainId)
  m.redraw()
}

async function lazyFund(size: Readonly<number>) {
  if (state.bundlr === null) throw new Error("Bundlr not initialized")

  const price = await state.bundlr.getPrice(size)
  const balance = await state.bundlr.getLoadedBalance()

  if (balance.isLessThan(price)) {
    const amount = price.minus(balance).multipliedBy(1.1)
    await state.bundlr.fund(amount.minus(amount.modulo(1)))
  }
}

export async function uploadFile(
  file: Readonly<File>,
  update: (progress: UploadProgressUpdate) => void,
): Promise<Readonly<string>> {
  if (state.bundlr === null) throw new Error("Bundlr not initialized")

  const tags = [{ name: "Content-Type", value: "application/octet-stream" }]
  const { data, key } = await encryptFile(file, (progress) =>
    update({ type: "encrypted", value: progress * 100 }),
  )

  await lazyFund(data.length)
  update({ type: "funded", value: true })

  const tx = state.bundlr.createTransaction(data, { tags })
  await tx.sign()
  update({ type: "signed", value: true })
  await tx.upload()
  update({ type: "uploaded", value: 100 })

  return await encodeLink(tx.id, key)
}

export async function downloadFile(
  link: Readonly<string>,
  update: (progress: DownloadProgressUpdate) => void,
): Promise<
  Readonly<{ data: Uint8Array; contentType: string; filename: string }>
> {
  const { id, key } = await decodeLink(link)

  const res = await axios.get<Blob>(`https://arweave.net/${id}`, {
    responseType: "blob",
    onDownloadProgress(e) {
      update({ type: "downloaded", value: (e.loaded / e.total) * 100 })
    },
  })

  const cipher = new Uint8Array(await res.data.arrayBuffer())
  return await decryptFile(cipher, key, (progress) =>
    update({ type: "decrypted", value: progress * 100 }),
  )
}
