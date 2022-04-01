import m from "mithril"
import { uploadFile } from "../lib/contract"

const Home = () => {
  const links = <string[]>[]

  return {
    view() {
      return [
        m("p", "Welcome to Arshare."),
        m("input[type=file]", {
          async oninput(e: InputEvent) {
            const file = (e.target as HTMLInputElement).files[0]
            links.unshift(await uploadFile(file))
            m.redraw()
          },
        }),
        m("div",
          { class: "uk-flex uk-flex-column" },
          links.map((link) => m(m.route.Link, { class: "uk-link-text", href: `/file/${link}` }, link)),
        ),
      ]
    },
  }
}

export default Home
