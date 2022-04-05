import _sodium from "libsodium-wrappers"

const headerSize = 24
const encryptContentTypeSize = 32
const encryptFilenameSize = 64
const encryptMetadataSize =
  headerSize + encryptContentTypeSize + encryptFilenameSize
const decryptContentTypeSize = encryptContentTypeSize + 17
const decryptFilenameSize = encryptFilenameSize + 17
const decryptMetadataSize =
  headerSize + decryptContentTypeSize + decryptFilenameSize
const encryptChunkSize = 1024 * 1024 * 4
const decryptChunkSize = encryptChunkSize + 17

function encryptBytes(
  sodium: typeof _sodium,
  state_out: _sodium.StateAddress,
  bytes: Uint8Array,
  final: boolean,
): Uint8Array {
  const tag = final
    ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
    : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE

  return sodium.crypto_secretstream_xchacha20poly1305_push(
    state_out,
    bytes,
    null,
    tag,
  )
}

function decryptBytes(
  sodium: typeof _sodium,
  state_in: _sodium.StateAddress,
  bytes: Uint8Array,
): Uint8Array {
  const res = sodium.crypto_secretstream_xchacha20poly1305_pull(state_in, bytes)
  if (!res) throw Error("error during decryption")
  return res.message
}

export async function encryptFile(
  file: Readonly<File>,
  update: (progress: number) => void,
): Promise<Readonly<{ data: Uint8Array; key: Uint8Array }>> {
  await _sodium.ready
  const sodium = _sodium

  const key = sodium.crypto_secretstream_xchacha20poly1305_keygen()

  const res = sodium.crypto_secretstream_xchacha20poly1305_init_push(key)
  const [state_out, header] = [res.state, res.header]

  const totalChunks = Math.ceil(file.size / encryptChunkSize)
  const data = new Uint8Array(
    decryptMetadataSize + totalChunks * decryptChunkSize,
  )
  let dataSize = decryptMetadataSize

  data.set(header)
  update(headerSize / data.length)

  const contentType = new Uint8Array(encryptContentTypeSize)
  contentType.set(
    sodium.from_string(file.type).slice(0, encryptContentTypeSize),
  )
  data.set(encryptBytes(sodium, state_out, contentType, false), headerSize)
  update((headerSize + decryptContentTypeSize) / data.length)

  const filename = new Uint8Array(encryptFilenameSize)
  const [name, ext] = file.name.split(".", 2).map(sodium.from_string)
  const filenameLength = Math.min(
    name.length + ext.length + 1,
    encryptFilenameSize,
  )
  filename.set(name.slice(0, filenameLength - ext.length - 1))
  filename.set(sodium.from_string("."), filenameLength - ext.length - 1)
  filename.set(ext, filenameLength - ext.length)
  data.set(
    encryptBytes(sodium, state_out, filename, false),
    headerSize + decryptContentTypeSize,
  )
  update(decryptMetadataSize / data.length)

  for (let i = 0; i < totalChunks; i++) {
    const final = i == totalChunks - 1
    const start = i * encryptChunkSize
    const end = final ? file.size : (i + 1) * encryptChunkSize
    const bytes = new Uint8Array(await file.slice(start, end).arrayBuffer())
    const chunk = encryptBytes(sodium, state_out, bytes, final)
    data.set(chunk, decryptMetadataSize + i * decryptChunkSize)
    dataSize += chunk.length
    update(dataSize / data.length)
  }

  update(100)

  return {
    data: data.slice(0, dataSize),
    key,
  }
}

export async function decryptFile(
  cipher: Readonly<Uint8Array>,
  key: Readonly<Uint8Array>,
): Promise<
  Readonly<{ data: Uint8Array; contentType: string; filename: string }>
> {
  await _sodium.ready
  const sodium = _sodium

  const header = cipher.slice(0, headerSize)
  const state_in = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
    header,
    key,
  )

  const contentTypeBytes = decryptBytes(
    sodium,
    state_in,
    cipher.slice(headerSize, headerSize + decryptContentTypeSize),
  )
  const contentType = sodium.to_string(
    contentTypeBytes.slice(0, contentTypeBytes.indexOf(0)),
  )

  const filenameBytes = decryptBytes(
    sodium,
    state_in,
    cipher.slice(headerSize + decryptContentTypeSize, decryptMetadataSize),
  )
  const filename = sodium.to_string(
    filenameBytes.slice(0, filenameBytes.indexOf(0)),
  )

  const totalChunks = Math.ceil(
    (cipher.length - decryptMetadataSize) / decryptChunkSize,
  )
  const data = new Uint8Array(totalChunks * encryptChunkSize)
  let dataSize = 0

  for (let i = 0; i < totalChunks; i++) {
    const final = i == totalChunks - 1
    const start = decryptMetadataSize + i * decryptChunkSize
    const end = final
      ? cipher.length
      : decryptMetadataSize + (i + 1) * decryptChunkSize
    const chunk = decryptBytes(sodium, state_in, cipher.slice(start, end))
    data.set(chunk, i * encryptChunkSize)
    dataSize += chunk.length
  }

  return { data: data.slice(0, dataSize), contentType, filename }
}

export async function encodeLink(
  id: Readonly<string>,
  key: Readonly<Uint8Array>,
): Promise<Readonly<string>> {
  await _sodium.ready
  const sodium = _sodium

  const idArr = sodium.from_string(id)
  const data = new Uint8Array(idArr.length + key.length)
  data.set(idArr)
  data.set(key, idArr.length)
  return sodium.to_base64(data)
}

export async function decodeLink(
  link: Readonly<string>,
): Promise<Readonly<{ id: string; key: Uint8Array }>> {
  await _sodium.ready
  const sodium = _sodium

  const data = sodium.from_base64(link)
  return {
    id: sodium.to_string(data.slice(0, 43)),
    key: data.slice(43, 75),
  }
}

export function encode(data: Readonly<Uint8Array>): Readonly<string> {
  return _sodium.to_base64(data)
}

export function decode(s: Readonly<string>): Readonly<Uint8Array> {
  return _sodium.from_base64(s)
}

export function bytesToString(data: Readonly<Uint8Array>): Readonly<string> {
  return _sodium.to_string(data)
}

export function stringToBytes(s: Readonly<string>): Readonly<Uint8Array> {
  return _sodium.from_string(s)
}
