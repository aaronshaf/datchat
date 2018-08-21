import totes from "../vendor/totes/index.js";
import { html, render } from "../vendor/lit-html/lib/lit-extended.js";

const Component = totes(render)(HTMLElement);

export default class DatProfile extends Component {
  constructor() {
    super();
    this.shadow = true;
  }

  async componentDidMount() {}

  render() {
    return html`
    <form id="new-message-form" on-submit=${this.handleNewMessage}>
      <input placeholder="New message" type="text" id="new-message-text" autofocus />
      <button class="screenreader-only" type="submit">Add message</button>
    </form>`;
  }
}
