import m from "mithril"
import { uploadFile } from "../lib/contract"

const Home = () => {
  let links = <string[]>[]

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
        links.map((link) => [
          m(m.route.Link, { href: `/file/${link}` }, link),
          m("br"),
        ]),
      ]
    },
  }
}

export default Home
