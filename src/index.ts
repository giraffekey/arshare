import m from "mithril"
import Home from "./pages/Home"
import FilePage from "./pages/File"
import "./lib/contract"

const root = document.body

m.route(root, "/", {
  "/": Home,
  "/file/:link": FilePage,
})
