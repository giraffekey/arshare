import * as ethers from "ethers"
import { WebBundlr } from "@bundlr-network/client"
import axios from "axios"
import { decryptFile, decodeLink, encryptFile, encodeLink } from "./crypto"
// import contractJson from "../../build/contracts/Arshare.json"

declare global {
  interface Window {
    ethereum: any
  }
}

const provider = new ethers.providers.Web3Provider(window.ethereum)

// const contract = new ethers.Contract("address", contractJson.abi, provider)

let bundlr: WebBundlr = null

export async function connect() {
  await provider.send("eth_requestAccounts", [])
  await provider._ready()

  bundlr = new WebBundlr("https://devnet.bundlr.network", "boba", provider, {
    providerUrl: "https://rinkeby.boba.network",
  })
  await bundlr.ready()
}

connect()

async function lazyFund(size: Readonly<number>) {
  if (bundlr === null) return

  const price = await bundlr.getPrice(size)
  const balance = await bundlr.getLoadedBalance()

  if (balance.isLessThan(price)) {
    await bundlr.fund(price.minus(balance).multipliedBy(2))
  }
}

export async function uploadFile(file: Readonly<File>): Promise<Readonly<string>> {
  if (bundlr === null) return

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
): Promise<Readonly<{ data: Uint8Array; contentType: string }>> {
  const { id, key } = await decodeLink(link)
  const res = await axios.get<Blob>(`https://arweave.net/${id}`, {
    responseType: "blob",
  })
  const cipher = new Uint8Array(await res.data.arrayBuffer())
  return await decryptFile(cipher, key)
}
