import m from "mithril"
import Header from "../components/Header"
import state from "../state"
import { uploadFile } from "../lib/network"

const Home = () => {
  const links = <string[]>[]

  return {
    view() {
      return [
        m(Header),
        m("main", [
          m("p", "Welcome to Arshare."),
          m("input[type=file]", {
            async oninput(e: InputEvent) {
              const file = (e.target as HTMLInputElement).files[0]
              links.unshift(await uploadFile(file))
              m.redraw()
            },
            disabled: !state.account,
          }),
          m(
            "div",
            { class: "uk-flex uk-flex-column" },
            links.map((link) =>
              m(
                m.route.Link,
                { class: "uk-link-text", href: `/file/${link}` },
                link,
              ),
            ),
          ),
        ]),
      ]
    },
  }
}

export default Home
