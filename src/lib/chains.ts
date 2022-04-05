import { ethers } from "ethers"

interface NativeCurrency {
  name: string
  symbol: string
  decimals: number
}

interface AddEthereumChainParameter {
  chainId: string
  chainName: string
  nativeCurrency: NativeCurrency
  rpcUrls: string[]
  blockExplorerUrls: string[]
  iconUrls?: string[]
}

export const chainIds = <number[]>[1, 3, 4, 5, 42, 137, 80001, 288, 28]

export const chainNames = <{ [chainId: number]: string }>{
  1: "Ethereum Mainnet",
  3: "Ethereum Ropsten Testnet",
  4: "Ethereum Rinkeby Testnet",
  5: "Ethereum Goerli Testnet",
  42: "Ethereum Kovan Testnet",
  137: "Polygon Mainnet",
  80001: "Polygon Mumbai Testnet",
  288: "Boba Mainnet",
  28: "Boba Rinkeby Testnet",
}

export const nativeCurrencies = <{ [chainId: number]: NativeCurrency }>{
  1: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  3: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  4: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  5: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  42: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  137: {
    name: "Polygon",
    symbol: "MATIC",
    decimals: 18,
  },
  80001: {
    name: "Polygon",
    symbol: "MATIC",
    decimals: 18,
  },
  288: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  28: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
}

export const bundlrCurrencies = <{ [chainId: number]: string }>{
  1: "ethereum",
  3: "ethereum",
  4: "ethereum",
  5: "ethereum",
  42: "ethereum",
  137: "matic",
  80001: "matic",
  288: "boba",
  28: "boba",
}

export const rpcs = <{ [chainId: number]: string }>{
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

export const blockExplorers = <{ [chainId: number]: string }>{
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

export const metamaskChains: { [chainId: number]: AddEthereumChainParameter } =
  Object.fromEntries(
    chainIds.map((chainId) => [
      chainId,
      {
        chainId: ethers.utils.hexValue(chainId),
        chainName: chainNames[chainId],
        nativeCurrency: nativeCurrencies[chainId],
        rpcUrls: [rpcs[chainId]],
        blockExplorerUrls: [blockExplorers[chainId]],
      },
    ]),
  )
