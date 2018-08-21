import { html, render } from "../vendor/lit-html/lib/lit-extended.js";
import totes from "../vendor/totes/index.js";
import pathToRegexp from "../vendor/path-to-regexp/index.js";

const isRouteNode = node =>
  node.nodeType === Node.ELEMENT_NODE && node.hasAttribute("path");

const Component = totes(render)(HTMLElement);

export default class DatRouter extends Component {
  constructor() {
    super();
    this.shadow = true;

    // const keys = [];
    // const re = pathToRegexp(this.props.path, keys);

    this.state = {
      // re,
      // keys,
      params: {},
      isMatched: false,
      matchedPaths: []
    };

    // this.handlePopstate = this.handlePopstate.bind(this);
    // this.updateMatch = this.updateMatch.bind(this);

    this.updateMatch();
  }

  updateMatch() {
    const routeNodes = Array.from(this.childNodes).filter(isRouteNode);

    routeNodes.forEach(node => {
      const path = node.getAttribute("path");
      const keys = [];
      const re = pathToRegexp(path, keys);
      const result = re.exec(location.pathname);

      if (result) {
        node.setAttribute("slot", "matched");
      } else {
        node.removeAttribute("slot");
      }
    });
  }

  handlePopstate() {
    this.updateMatch();
  }

  componentDidMount() {
    window.addEventListener("pushState", this.handlePopstate);
    window.addEventListener("popstate", this.handlePopstate);
  }

  componentDidUnmount() {
    window.removeEventListener("pushState", this.handlePopstate);
    window.removeEventListener("popstate", this.handlePopstate);
  }

  render() {
    return html`<slot name="matched"></slot>`;
  }
}
