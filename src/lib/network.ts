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
  1: "https://mainnet.infura.io/v3",
  3: "https://ropsten.infura.io/v3",
  4: "https://rinkeby.infura.io/v3",
  5: "https://goerli.infura.io/v3",
  42: "https://kovan.infura.io/v3",
  137: "https://polygon-rpc.com",
  80001: "https://rpc-mumbai.maticvigil.com",
  288: "https://mainnet.boba.network",
  28: "https://rinkeby.boba.network",
}

const blockExplorers = <{ [chainId: number]: string }>{
  1: "https://etherscan.io",
  3: "https://ropsten.etherscan.io",
  4: "https://rinkeby.etherscan.io",
  5: "https://goerli.etherscan.io",
  42: "https://kovan.etherscan.io",
  137: "https://polygonscan.com",
  80001: "https://mumbai.polygonscan.com",
  288: "https://blockexplorer.boba.network",
  28: "https://blockexplorer.rinkeby.boba.network",
}

const chains = <{ [chainId: number]: AddEthereumChainParameter }>{
  1: {
    chainId: ethers.utils.hexValue(1),
    chainName: "Ethereum Mainnet",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [rpcs[1]],
    blockExplorerUrls: [blockExplorers[1]],
  },
  3: {
    chainId: ethers.utils.hexValue(3),
    chainName: "Ethereum Ropsten Testnet",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [rpcs[3]],
    blockExplorerUrls: [blockExplorers[3]],
  },
  4: {
    chainId: ethers.utils.hexValue(4),
    chainName: "Ethereum Rinkeby Testnet",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [rpcs[4]],
    blockExplorerUrls: [blockExplorers[4]],
  },
  5: {
    chainId: ethers.utils.hexValue(5),
    chainName: "Ethereum Goerli Testnet",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [rpcs[5]],
    blockExplorerUrls: [blockExplorers[5]],
  },
  42: {
    chainId: ethers.utils.hexValue(42),
    chainName: "Ethereum Kovan Testnet",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [rpcs[42]],
    blockExplorerUrls: [blockExplorers[42]],
  },
  137: {
    chainId: ethers.utils.hexValue(137),
    chainName: "Polygon Mainnet",
    nativeCurrency: {
      name: "Polygon",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: [rpcs[137]],
    blockExplorerUrls: [blockExplorers[137]],
  },
  80001: {
    chainId: ethers.utils.hexValue(80001),
    chainName: "Polygon Mumbai Testnet",
    nativeCurrency: {
      name: "Polygon",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: [rpcs[80001]],
    blockExplorerUrls: [blockExplorers[80001]],
  },
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
  "matic",
  provider,
  { providerUrl: rpcs[80001] },
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
