import m from "mithril"
import { ethers } from "ethers"
import type { Network } from "@ethersproject/providers"
import { WebBundlr } from "@bundlr-network/client"
import axios from "axios"
import {
  bundlrCurrencies,
  rpcs,
  blockExplorers,
  metamaskChains,
} from "./chains"
import { decryptFile, decodeLink, encryptFile, encodeLink } from "./crypto"
import { defaultChainId } from "../config"
import state from "../state"
// import contractJson from "../../build/contracts/Arshare.json"

// Types

declare global {
  interface Window {
    ethereum: any
  }
}

interface ConnectInfo {
  chainId: string
}

// Variables

const provider = new ethers.providers.Web3Provider(window.ethereum, "any")

// const contract = new ethers.Contract("address", contractJson.abi, provider)

const bundlr: WebBundlr = new WebBundlr(
  "https://devnet.bundlr.network",
  bundlrCurrencies[defaultChainId],
  provider,
  { providerUrl: rpcs[defaultChainId] },
)

if (window.ethereum.isConnected())
  state.setAccount(window.ethereum.selectedAddress)
provider.getNetwork().then(handleNetwork)

// Events

async function handleConnect(connectInfo?: ConnectInfo) {
  if (!state.account) {
    state.setConnectPending(true)
    m.redraw()

    try {
      const accounts = await provider.send("eth_requestAccounts", [])
      await provider._ready()
      await bundlr.ready()

      state.setAccount(accounts[0])
      if (connectInfo)
        state.setChain(ethers.BigNumber.from(connectInfo.chainId).toNumber())

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

function handleNetwork(network: Network) {
  state.setChain(network.chainId)
  m.redraw()
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
  const price = await bundlr.getPrice(size)
  const balance = await bundlr.getLoadedBalance()

  if (balance.isLessThan(price)) {
    const amount = price.minus(balance).multipliedBy(1.1)
    await bundlr.fund(amount.minus(amount.modulo(1)))
  }
}

export async function uploadFile(
  file: Readonly<File>,
): Promise<Readonly<string>> {
  const tags = [{ name: "Content-Type", value: "application/octet-stream" }]
  const { data, key } = await encryptFile(file)
  await lazyFund(data.length)
  const tx = bundlr.createTransaction(data, { tags })
  await tx.sign()
  await tx.upload()
  return await encodeLink(tx.id, key)
}

export async function downloadFile(
  link: Readonly<string>,
): Promise<
  Readonly<{ data: Uint8Array; contentType: string; filename: string }>
> {
  const { id, key } = await decodeLink(link)
  const res = await axios.get<Blob>(`https://arweave.net/${id}`, {
    responseType: "blob",
  })
  const cipher = new Uint8Array(await res.data.arrayBuffer())
  return await decryptFile(cipher, key)
}
