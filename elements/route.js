import { html, render } from "../vendor/lit-html/lib/lit-extended.js";
import totes from "../vendor/totes/index.js";
import pathToRegexp from "../vendor/path-to-regexp/index.js";

const Component = totes(render)(HTMLElement);

export default class DatRoute extends Component {
  static get observedAttributes() {
    return ["path"];
  }

  constructor() {
    super();
    this.shadow = true;

    const keys = [];
    const re = pathToRegexp(this.props.path, keys);

    this.state = {
      re,
      keys,
      params: {},
      isMatched: false
    };

    this.handlePopstate = this.handlePopstate.bind(this);
    this.updateMatch = this.updateMatch.bind(this);

    this.updateMatch();
  }

  updateMatch() {
    const result = this.state.re.exec(location.pathname);

    const matched = result && result.slice(1);

    const params = result
      ? this.state.keys.reduce((state, param, index) => {
          state[param.name] = matched[index];
          return state;
        }, {})
      : {};

    this.setState({ params, isMatched: Boolean(result) });
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
    if (this.state.isMatched) {
      return html`<style>
        :host {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
      </style><slot></slot>`;
    } else {
      return html`<template></template>`;
    }
  }
}
