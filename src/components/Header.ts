import m from "mithril"
import state from "../state"
import { connect, disconnect, switchNetwork } from "../lib/contract"

function validChainId(chainId: number): boolean {
  return [288, 28].includes(chainId)
}

const Header = () => {
  return {
    view() {
      return m("header", { class: "uk-flex uk-flex-between uk-flex-middle" }, [
        m(
          "h1",
          { class: "uk-link-text uk-text-large uk-margin-remove" },
          m(m.route.Link, { href: "/" }, "Arshare"),
        ),
        m(
          "select",
          {
            oninput(e: InputEvent) {
              const value = (e.target as HTMLSelectElement).value
              if (value) {
                const chainId = parseInt(value)
                switchNetwork(chainId)
              }
            },
            value: validChainId(state.chainId) ? state.chainId : "",
          },
          [
            m(
              "option",
              { value: "", disabled: true, hidden: true },
              "WRONG NETWORK",
            ),
            m("option", { value: 288 }, "Boba Mainnet"),
            m("option", { value: 28 }, "Boba Rinkeby"),
          ],
        ),
        state.account
          ? [
              m("button", state.account),
              m(
                "div",
                { "uk-dropdown": "mode: click" },
                m("ul", { class: "uk-nav uk-dropdown-nav" }, [
                  m(
                    "li",
                    m(
                      m.route.Link,
                      { href: `/profile/${state.account}` },
                      "Profile",
                    ),
                  ),
                  m("li", m("button", { onclick: disconnect }, "Disconnect")),
                ]),
              ),
            ]
          : m(
              "button",
              {
                onclick: connect,
                disabled: state.isConnectPending,
              },
              "Connect",
            ),
      ])
    },
  }
}

export default Header
