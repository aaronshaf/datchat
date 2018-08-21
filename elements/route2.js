import { html, render } from "../vendor/lit-html/lib/lit-extended.js";
import totes from "../vendor/totes/index.js";

const Component = totes(render)(HTMLElement);

export default class DatRoute2 extends Component {
  constructor() {
    super();
    this.shadow = true;
  }

  render() {
    return html`<slot></slot>`;
  }
}
