import m from "mithril"
import type { Vnode } from "mithril"
import Header from "../components/Header"
import { downloadFile } from "../lib/network"
import { bytesToString } from "../lib/crypto"

function createURL(data: Uint8Array, contentType: string): string {
  return URL.createObjectURL(new Blob([data.buffer], { type: contentType }))
}

const DisplayFile = (
  vnode: Vnode<{ data: Uint8Array; contentType: string }>,
) => {
  const { data, contentType } = vnode.attrs

  return {
    view() {
      const [type, _ext] = contentType.split("/")
      switch (type) {
        case "image":
          return m("img", {
            class: "uk-height-large",
            src: createURL(data, contentType),
          })
        case "audio":
          return m("audio", {
            src: createURL(data, contentType),
            controls: true,
          })
        case "video":
          return m("video", {
            class: "uk-height-large",
            src: createURL(data, contentType),
            controls: true,
          })
        default:
          switch (contentType) {
            case "text/plain":
              return bytesToString(data).split("\n").map((p) => m("p", p))
            default:
              return m(null)
          }
      }
    },
  }
}

const FilePage = () => {
  const link = m.route.param("link")
  let data: Uint8Array = null
  let contentType: string = null
  let filename: string = null

  const download = async (link: string) => {
    const file = await downloadFile(link)
    data = file.data
    contentType = file.contentType
    filename = file.filename
    m.redraw()
  }

  download(link)

  return {
    view() {
      return [
        m(Header),
        m("main", [
          m("h2", { class: "uk-text-default uk-text-center uk-margin-small-top" }, link),
          data
            ? m("div", { class: "uk-flex uk-flex-column uk-flex-middle" }, [
                m(DisplayFile, { data, contentType }),
                m(
                  "a",
                  {
                    class:
                      "uk-link-text uk-button uk-button-default uk-border-rounded uk-margin-small-vertical",
                    href: createURL(data, contentType),
                    download: filename,
                  },
                  `Download ${filename}`,
                ),
              ])
            : m("p", "Decrypting..."),
        ]),
      ]
    },
  }
}

export default FilePage
