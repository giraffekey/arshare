import m from "mithril"
import { ethers } from "ethers"
import type { Network } from "@ethersproject/providers"
import { WebBundlr } from "@bundlr-network/client"
import axios from "axios"
import { decryptFile, decodeLink, encryptFile, encodeLink } from "./crypto"
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

interface AddEthereumChainParameter {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: 18
  }
  rpcUrls: string[]
  blockExplorerUrls?: string[]
  iconUrls?: string[]
}

// Constants

const rpcs = <{ [chainId: number]: string }>{
  288: "https://mainnet.boba.network",
  28: "https://rinkeby.boba.network",
}

const blockExplorers = <{ [chainId: number]: string }>{
  288: "https://blockexplorer.boba.network",
  28: "https://blockexplorer.rinkeby.boba.network",
}

const chains = <{ [chainId: number]: AddEthereumChainParameter }>{
  288: {
    chainId: ethers.utils.hexValue(288),
    chainName: "Boba Mainnet",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [rpcs[288]],
    blockExplorerUrls: [blockExplorers[288]],
  },
  28: {
    chainId: ethers.utils.hexValue(28),
    chainName: "Boba Rinkeby",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [rpcs[28]],
    blockExplorerUrls: [blockExplorers[28]],
  },
}

// Variables

const provider = new ethers.providers.Web3Provider(window.ethereum, "any")

// const contract = new ethers.Contract("address", contractJson.abi, provider)

const bundlr: WebBundlr = new WebBundlr(
  "https://devnet.bundlr.network",
  "boba",
  provider,
  { providerUrl: rpcs[28] },
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
    blockExplorers[state.chainId] || blockExplorers[28]
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
      await provider.send("wallet_addEthereumChain", [chains[chainId]])
    }
  }
  state.setChain(chainId)
  m.redraw()
}

async function lazyFund(size: Readonly<number>) {
  const price = await bundlr.getPrice(size)
  const balance = await bundlr.getLoadedBalance()

  if (balance.isLessThan(price)) {
    await bundlr.fund(price)
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
