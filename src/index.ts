import m from "mithril"
import UIkit from "uikit"
import Home from "./pages/Home"
import FilePage from "./pages/File"
import "./styles/index.scss"

UIkit.dropdown(".uk-dropdown")

const root = document.body

m.route(root, "/", {
  "/": Home,
  "/file/:link": FilePage,
})
