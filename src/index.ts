import m from "mithril"
import UIkit from "uikit"
// @ts-ignore
import Icons from "uikit/dist/js/uikit-icons"
import Home from "./pages/Home"
import FilePage from "./pages/File"
import "./styles/index.scss"

// @ts-ignore
UIkit.use(Icons)

const root = document.body

m.route(root, "/", {
  "/": Home,
  "/file/:link": FilePage,
})
