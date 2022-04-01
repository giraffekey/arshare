const fs = require("fs")
const HDWalletProvider = require("@truffle/hdwallet-provider")

const mnemonic = fs.readFileSync(".mnemonic").toString().trim()

module.exports = {
  compilers: {
    solc: {
      version: "pragma",
    },
  },
  networks: {
    boba_testnet: {
      provider: () =>
        new HDWalletProvider(mnemonic, "https://rinkeby.boba.network"),
      network_id: 28,
      gas: 10000000,
    },
    boba_mainnet: {
      provider: () =>
        new HDWalletProvider(mnemonic, "https://mainnet.boba.network"),
      network_id: 288,
      gas: 10000000,
    },
  },
}
