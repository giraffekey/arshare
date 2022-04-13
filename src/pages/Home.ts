import m from "mithril"
import type { Vnode } from "mithril"
import filesize from "filesize"
import Header from "../components/Header"
import state from "../state"
import type { FileUpload } from "../state"
import { uploadFile } from "../lib/network"

const Upload = (vnode: Vnode<{ file: FileUpload }>) => {
  const { file } = vnode.attrs
  let copied = false

  return {
    view() {
      return m("div", [
        m(
          "p",
          {
            class: "uk-flex uk-flex-between uk-margin-remove uk-text-secondary",
          },
          [
            m("span", { class: "uk-margin-auto-right" }, file.name),
            m(
              "span",
              { class: "uk-margin-medium-right uk-text-muted" },
              filesize(file.size, { base: 2, standard: "jedec" }),
            ),
            m("span", { class: "uk-text-muted" }, file.date.toDateString()),
          ],
        ),
        file.link
          ? m(
              "p",
              {
                class: "uk-flex uk-flex-between uk-margin-remove uk-text-small",
              },
              [
                m(
                  m.route.Link,
                  {
                    class: "uk-link-text uk-text-muted",
                    href: `/file/${file.link}`,
                    options: { state: { key: file.link } },
                  },
                  file.link,
                ),
                m(
                  "button",
                  {
                    async onclick() {
                      copied = true
                      await window.navigator.clipboard.writeText(file.link)
                      window.setTimeout(() => {
                        copied = false
                        m.redraw()
                      }, 500)
                    },
                    class: "uk-button uk-button-text",
                  },
                  copied ? "Copied" : "Copy Link",
                ),
              ],
            )
          : file.error
          ? m(
              "p",
              { class: "uk-margin-remove uk-text-danger" },
              `Failed to upload file: ${file.error}`,
            )
          : [
              m(
                "label",
                { class: "uk-flex uk-flex-middle" },
                m(
                  "span",
                  file.progress.encrypted === 100
                    ? "Encrypted"
                    : "Encrypting...",
                ),
                m("progress", {
                  class:
                    "uk-progress uk-flex-1 uk-margin-small-left uk-margin-remove-vertical",
                  value: file.progress.encrypted,
                  max: 100,
                }),
              ),
              file.progress.encrypted === 100 &&
                m(
                  "label",
                  { class: "uk-flex uk-flex-middle" },
                  m("input[type=checkbox]", {
                    class: "uk-checkbox",
                    checked: file.progress.funded,
                  }),
                  m(
                    "span",
                    { class: "uk-margin-small-left" },
                    file.progress.funded ? "Funded" : "Funding...",
                  ),
                ),
              file.progress.funded &&
                m(
                  "label",
                  { class: "uk-flex uk-flex-middle" },
                  m("input[type=checkbox]", {
                    class: "uk-checkbox",
                    checked: file.progress.signed,
                  }),
                  m(
                    "span",
                    { class: "uk-margin-small-left" },
                    file.progress.signed ? "Signed" : "Signing...",
                  ),
                ),
              file.progress.signed &&
                m(
                  "label",
                  { class: "uk-flex uk-flex-middle" },
                  m(
                    "span",
                    file.progress.uploaded === 100
                      ? "Uploaded"
                      : "Uploading...",
                  ),
                  m("progress", {
                    class:
                      "uk-progress uk-flex-1 uk-margin-small-left uk-margin-remove-vertical",
                    value: file.progress.uploaded,
                    max: 100,
                  }),
                ),
            ],
        m("hr"),
      ])
    },
  }
}

const Home = {
  view() {
    return [
      m(Header),
      m("main", { class: "uk-padding-medium" }, [
        m("input[type=file]", {
          async oninput(e: InputEvent) {
            const file = (e.target as HTMLInputElement).files[0]
            const id = state.addFile(file)
            try {
              const link = await uploadFile(file, (progress) => {
                state.updateFileProgress(id, progress.type, progress.value)
                m.redraw()
              })
              state.setFileLink(id, link)
              m.redraw()
            } catch (e) {
              state.setFileError(id, e.message || JSON.stringify(e))
              m.redraw()
            }
          },
          class: "uk-margin-medium-bottom",
          disabled: state.bundlr === null,
        }),
        m(
          "div",
          { class: "uk-flex uk-flex-column" },
          Object.entries(state.files)
            .sort(([, a], [, b]) => b.date.getTime() - a.date.getTime())
            .map(([id, file]) => m(Upload, { key: id, file })),
        ),
      ]),
    ]
  },
}

export default Home
