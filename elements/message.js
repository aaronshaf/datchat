import totes from "../vendor/totes/index.js";
import { html, render } from "../vendor/lit-html/lib/lit-extended.js";
import { userColors } from "../utils.js";

const styles = html`<style>
.message {
  display: flex;
  padding: 6px 6px;
  font-size: 0.88rem;
}
.message:hover {
  background-color: #f9f9f9;
}
.displayTime {
  color: #717274;
  font-size: 0.72rem;
  width: 56px;
  padding: 2px;
  padding-right: 6px;
  text-align: right;
}
.message-content {
  flex: 1;
}
</style>`;

const Component = totes(render)(HTMLElement);
export default class DatChatMessage extends Component {
  static get observedProperties() {
    return ["message"];
  }
  constructor() {
    super();
    this.shadow = true;
  }

  render() {
    const message = this.props.message;

    const dateCreated = new Date(message.dateCreated);

    const displayTime = dateCreated
      .toLocaleDateString("en-US", {
        hourCycle: "h12",
        formatMatcher: "best fit",
        hour: "2-digit",
        minute: "2-digit"
      })
      .split(", ")[1];

    return html`
    ${styles}
    <li id="${message.url}" class="message">
      <span class="displayTime">${displayTime}</span>
      <div class="message-content">
        <span><strong style="color: ${userColors[0]}">${
      message.sender.name
    }</strong></span>
        <span class="message-text">${message.text}</span>
      </div>
    </li>`;
  }
}
