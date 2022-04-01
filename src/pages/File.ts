import m from "mithril"
import type { Vnode } from "mithril"
import { downloadFile } from "../lib/contract"
import { encode } from "../lib/crypto"

const DisplayFile = (vnode: Vnode<{ url: string; type: string }>) => {
  const { url, type } = vnode.attrs

  return {
    view() {
      switch (type) {
        case "image":
          return m("img", { src: url })
        case "audio":
          return m("audio", { src: url, controls: true })
        case "video":
          return m("video", { src: url, controls: true })
        default:
          return m("")
      }
    },
  }
}

const FilePage = () => {
  const link = m.route.param("link")
  let url: string = null
  let type: string = null
  let filename: string = null

  const download = async (link: string) => {
    const { data, contentType } = await downloadFile(link)
    url = URL.createObjectURL(new Blob([data.buffer], { type: contentType }))
    const [type_, ext] = contentType.split("/")
    type = type_
    filename = `${link}.${ext}`
    m.redraw()
  }

  download(link)

  return {
    view() {
      return [
        url
          ? [
              m(DisplayFile, { url, type }),
              m("a", { href: url, download: filename }, "Download"),
            ]
          : m("p", "Decrypting..."),
      ]
    },
  }
}

export default FilePage
