import m from "mithril"
import type { Vnode } from "mithril"
// @ts-ignore
import { renderIcon } from "@download/blockies"
import state from "../state"
import {
  connect,
  disconnect,
  switchNetwork,
  blockExplorerAccountURL,
} from "../lib/contract"
// @ts-ignore
import MetamaskIcon from "../assets/images/metamask.svg"

function validChainId(chainId: number): boolean {
  return [288, 28].includes(chainId)
}

function formatAccount(account: string): string {
  return `0x${state.account.slice(2, 6)}...${state.account.slice(
    state.account.length - 4,
  )}`
}

const Search = () => {
  let link = ""

  return {
    view() {
      return m(
        "form",
        {
          onsubmit(e: SubmitEvent) {
            e.preventDefault()
            m.route.set("/file/:link", { link })
          },
          class: "uk-search uk-search-default uk-flex-1 uk-margin-medium-left",
        },
        [
          m("button", { "uk-search-icon": true }),
          m("input[type=search]", {
            oninput: (e: InputEvent) =>
              (link = (e.target as HTMLInputElement).value),
            class: "uk-search-input",
            placeholder: "Search link...",
            value: link,
          }),
        ],
      )
    },
  }
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
        class: "uk-select uk-form-width-medium uk-margin-medium-left",
        value: validChainId(state.chainId) ? state.chainId : "",
      },
      [
        m(
          "option",
          { value: "", disabled: true, hidden: true },
          "Wrong Network!",
        ),
        m("option", { value: 288 }, "Boba Mainnet"),
        m("option", { value: 28 }, "Boba Rinkeby"),
      ],
    )
  },
}

const ConnectButton = {
  view() {
    return m(
      "button",
      {
        onclick: connect,
        class:
          "connect-button uk-button uk-button-default uk-margin-medium-left uk-text-bold uk-text-capitalize uk-text-nowrap",
        disabled: state.isConnectPending,
      },
      state.isConnectPending
        ? [
            m("span", {
              "uk-icon": "icon: clock",
              class: "uk-margin-xsmall-right",
            }),
            m("span", "Connecting..."),
          ]
        : [
            m("span", {
              "uk-icon": "icon: sign-in",
              class: "uk-margin-xsmall-right",
            }),
            m("span", "Connect Wallet"),
          ],
    )
  },
}

const Identicon = (vnode: Vnode<{ address: string; class: string }>) => {
  const { address, class: class_ } = vnode.attrs

  return {
    view() {
      return m("canvas", {
        oncreate(vnode) {
          renderIcon(
            {
              seed: address,
              size: 10,
              scale: 2,
            },
            vnode.dom,
          )
        },
        class: `${class_} uk-border-rounded`,
      })
    },
  }
}

const AccountDropdown = () => {
  let copied = false

  return {
    view() {
      return [
        m(
          "button",
          {
            class:
              "uk-button uk-button-default uk-flex uk-flex-middle uk-margin-medium-left uk-text-capitalize uk-text-nowrap",
          },
          [
            m(Identicon, {
              address: state.account,
              class: "uk-margin-small-right",
            }),
            m("span", formatAccount(state.account)),
            m("span", {
              "uk-icon": "icon: triangle-down",
              class: "uk-margin-xsmall-left",
            }),
          ],
        ),
        m(
          "div",
          { "uk-dropdown": "mode: click; pos: top-right" },
          m("ul", { class: "uk-nav uk-dropdown-nav" }, [
            m(
              "li",
              { class: "uk-flex uk-flex-middle uk-margin-small-bottom" },
              [
                m("span", "Connected with MetaMask"),
                m("img", {
                  class: "image-icon uk-margin-small-left",
                  src: MetamaskIcon,
                }),
              ],
            ),
            m(
              "li",
              { class: "uk-flex uk-flex-middle uk-margin-small-bottom" },
              [
                m(Identicon, {
                  address: state.account,
                  class: "uk-margin-xsmall-right",
                }),
                m(
                  "a",
                  {
                    class: "uk-text-primary",
                    href: blockExplorerAccountURL(state.account),
                    target: "_blank",
                    rel: "noopener noreferrer",
                  },
                  formatAccount(state.account),
                ),
                m("button", {
                  async onclick() {
                    copied = true
                    await window.navigator.clipboard.writeText(state.account)
                    window.setTimeout(() => {
                      copied = false
                      m.redraw()
                    }, 500)
                  },
                  "uk-icon": `icon: ${copied ? "check" : "copy"}; ratio: 0.8`,
                  class: "uk-margin-xsmall-left",
                }),
              ],
            ),
            m(
              "li",
              m(
                "button",
                { onclick: disconnect, class: "uk-button uk-text-capitalize" },
                [
                  m("span", {
                    "uk-icon": "icon: sign-out",
                    class: "uk-margin-xsmall-right",
                  }),
                  m("span", "Disconnect"),
                ],
              ),
            ),
          ]),
        ),
      ]
    },
  }
}

const Header = () => {
  return {
    view() {
      return m(
        "header",
        {
          class:
            "uk-flex uk-flex-between uk-flex-middle uk-padding-medium-horizontal uk-padding-small-vertical",
        },
        [
          m(
            "h1",
            { class: "uk-block uk-margin-remove uk-text-large" },
            m(
              m.route.Link,
              { class: "uk-link-text uk-text-decoration-none", href: "/" },
              "Arshare",
            ),
          ),
          m(Search),
          m(NetworkSelect),
          state.account ? m(AccountDropdown) : m(ConnectButton),
        ],
      )
    },
  }
}

export default Header
