import totes from "../vendor/totes/index.js";
import { html, render } from "../vendor/lit-html/lib/lit-extended.js";

const styles = html`<style>
:host {
  padding: 10px;
  display: block;
}
form {
  margin: 0;
  padding: 0;
}
#new-message-form {
  display: flex;
}
#new-message-text {
  flex: 1;
  padding: 10px;
  font-size: 0.92rem;
  box-sizing: content-box;
  border-radius: 6px;
  border: 2px solid #b2b2b3;
}
#new-message-text:focus {
  outline: none;
  border-color: #398ddc;
}
#new-message-text::placeholder {
  color: #a0a0a0;
}
.screenreader-only {
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
</style>`;

const Component = totes(render)(HTMLElement);

export default class DatChatNewMessage extends Component {
  constructor() {
    super();
    this.shadow = true;
    this.handleNewMessage = this.handleNewMessage.bind(this);
  }

  async componentDidMount() {
    this.$ = this.shadowRoot.querySelector.bind(this.shadowRoot);
  }

  handleNewMessage(event) {
    event.preventDefault();

    const text = this.$("#new-message-text").value;

    if (text.length < 1) {
      return false;
    }

    this.dispatchEvent(
      new CustomEvent("new-message", {
        detail: { text },
        bubbles: false
      })
    );

    this.$("#new-message-text").value = "";
  }

  render() {
    return html`
    ${styles}
    <form id="new-message-form" on-submit=${this.handleNewMessage}>
      <input placeholder="New message" type="text" id="new-message-text" autofocus />
      <button class="screenreader-only" type="submit">Add message</button>
    </form>`;
  }
}
