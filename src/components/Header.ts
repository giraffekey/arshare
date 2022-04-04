import m from "mithril"
import state from "../state"
import { connect, disconnect, switchNetwork } from "../lib/contract"

function validChainId(chainId: number): boolean {
  return [288, 28].includes(chainId)
}

const NetworkSelect = {
  view() {
    return m(
      "select",
      {
        oninput(e: InputEvent) {
          const value = (e.target as HTMLSelectElement).value
          if (value) {
            const chainId = parseInt(value)
            switchNetwork(chainId)
          }
        },
        class: "uk-select uk-form-width-medium uk-margin-medium-right uk-margin-auto-left",
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
    )
  }
}

const ConnectButton = {
  view() {
    return m("button",
        {
          onclick: connect,
          class: "connect-button uk-button uk-button-default uk-text-bold uk-text-capitalize uk-text-nowrap",
          disabled: state.isConnectPending,
        },
        state.isConnectPending
          ? [
            m("span", { "uk-icon": "icon: clock", class: "icon" }),
            m("span",  "Connecting..."),
          ]
          : [
            m("span", { "uk-icon": "icon: sign-in", class: "icon" }),
            m("span",  "Connect Wallet"),
          ]
      )
  }
}

const AccountDropdown = {
  view() {
    return [
      m("button", { class: "uk-button uk-button-default uk-text-capitalize uk-text-nowrap" }, [
        m("span", state.account),
        m("span", { "uk-icon": "icon: triangle-down" }),
      ]),
      m(
        "div",
        { "uk-dropdown": "mode: click; pos: top-right" },
        m("ul", { class: "uk-nav uk-dropdown-nav" }, [
          m("li", m("button", { onclick: disconnect, class: "uk-button uk-text-capitalize" }, [
            m("span", { "uk-icon": "icon: sign-out", class: "icon" }),
            m("span", "Disconnect"),
          ])),
        ]),
      ),
    ]
  }
}

const Header = () => {
  return {
    view() {
      return m("header", { class: "uk-flex uk-flex-between uk-flex-middle uk-padding-medium-horizontal uk-padding-small-vertical" }, [
        m(
          "h1",
          { class: "uk-block uk-margin-remove uk-text-large" },
          m(m.route.Link, { class: "uk-link-text uk-text-decoration-none", href: "/" }, "Arshare"),
        ),
        m(NetworkSelect),
        state.account
          ? m(AccountDropdown)
          : m(ConnectButton),
      ])
    },
  }
}

export default Header
