import _sodium from "libsodium-wrappers"

const contentTypeSize = 16
const headerSize = 24
const metadataSize = contentTypeSize + headerSize
const encryptChunkSize = 1024 * 1024 * 4
const decryptChunkSize = encryptChunkSize + 17

export async function encryptFile(
  file: File,
): Promise<{ data: Uint8Array; key: Uint8Array }> {
  await _sodium.ready
  const sodium = _sodium

  const key = sodium.crypto_secretstream_xchacha20poly1305_keygen()

  const res = sodium.crypto_secretstream_xchacha20poly1305_init_push(key)
  const [state_out, header] = [res.state, res.header]

  const totalChunks = Math.ceil(file.size / encryptChunkSize)
  const data = new Uint8Array(metadataSize + totalChunks * decryptChunkSize)
  let dataSize = metadataSize

  data.set(sodium.from_string(file.type))
  data.set(header, contentTypeSize)

  for (let i = 0; i < totalChunks; i++) {
    const final = i == totalChunks - 1
    const start = i * encryptChunkSize
    const end = final ? file.size : (i + 1) * encryptChunkSize
    const buffer = await file.slice(start, end).arrayBuffer()
    const tag = final
      ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
      : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE

    const chunk = sodium.crypto_secretstream_xchacha20poly1305_push(
      state_out,
      new Uint8Array(buffer),
      null,
      tag,
    )
    data.set(chunk, i * decryptChunkSize + metadataSize)
    dataSize += chunk.length
  }

  return {
    data: data.slice(0, dataSize),
    key,
  }
}

export async function decryptFile(
  cipher: Uint8Array,
  key: Uint8Array,
): Promise<{ data: Uint8Array; contentType: string }> {
  await _sodium.ready
  const sodium = _sodium

  const contentType = sodium
    .to_string(cipher.slice(0, cipher.indexOf(0)))
    .trim()
  const header = cipher.slice(contentTypeSize, metadataSize)
  const state_in = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
    header,
    key,
  )

  const totalChunks = Math.ceil(
    (cipher.length - metadataSize) / decryptChunkSize,
  )
  const data = new Uint8Array(totalChunks * encryptChunkSize)
  let dataSize = 0

  for (let i = 0; i < totalChunks; i++) {
    const final = i == totalChunks - 1
    const start = i * decryptChunkSize + metadataSize
    const end = final
      ? cipher.length
      : (i + 1) * decryptChunkSize + metadataSize
    const res = sodium.crypto_secretstream_xchacha20poly1305_pull(
      state_in,
      cipher.slice(start, end),
    )
    if (!res) throw Error("error during decryption")
    data.set(res.message, i * encryptChunkSize)
    dataSize += res.message.length
  }

  return { data: data.slice(0, dataSize), contentType }
}

export async function encode(data: Uint8Array): Promise<string> {
  await _sodium.ready
  const sodium = _sodium

  return sodium.to_base64(data)
}

export async function decode(s: string): Promise<Uint8Array> {
  await _sodium.ready
  const sodium = _sodium

  return sodium.from_base64(s)
}

export async function encodeLink(id: string, key: Uint8Array): Promise<string> {
  await _sodium.ready
  const sodium = _sodium

  const idArr = sodium.from_string(id)
  const data = new Uint8Array(idArr.length + key.length)
  data.set(idArr)
  data.set(key, idArr.length)
  return sodium.to_base64(data)
}

export async function decodeLink(
  link: string,
): Promise<{ id: string; key: Uint8Array }> {
  await _sodium.ready
  const sodium = _sodium

  const data = sodium.from_base64(link)
  return {
    id: sodium.to_string(data.slice(0, 43)),
    key: data.slice(43, 75),
  }
}
