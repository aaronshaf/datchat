import { html } from "../vendor/lit-html/lib/lit-extended.js";
import { LitElement } from "../vendor/lit-element/lit-element.js";
import DatSelectArchive from "../elements/dat-select-archive.js";
import DatChatMessage from "../elements/dat-chat-message.js";
import { uuidv4 } from "../utils.js";

customElements.define("dat-select-archive", DatSelectArchive.withProperties());
customElements.define("dat-chat-message", DatChatMessage.withProperties());

const DatArchive = window.DatArchive;

export default class DatChat extends LitElement {
  constructor() {
    super();

    this.archive = null;
    this.messages = [];

    this.handleArchiveLoad = this.handleArchiveLoad.bind(this);
    this.handleNewMessage = this.handleNewMessage.bind(this);

    this.$ = this.shadowRoot.querySelector.bind(this.shadowRoot);
  }

  async handleArchiveLoad(event) {
    this.archive = event.detail.archive;

    if (this.archive === null) {
      this.messages = [];

      this.invalidate();

      return;
    }

    const profileFile = await this.archive.readFile("/profile.json");

    this.profile = JSON.parse(profileFile);

    const messageFiles = await this.archive.readdir("/messages");

    const messages = [];

    for (let file of messageFiles) {
      const fileContents = await this.archive.readFile(`/messages/${file}`);

      const message = JSON.parse(fileContents);

      messages.push(message);
    }

    this.messages = messages;

    this.invalidate();

    setTimeout(() => {
      this.$("#new-message-text").focus();

      const messagesContainer = this.$(".messages-container");

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);
  }

  async handleNewMessage(event) {
    event.preventDefault();

    const text = this.$("#new-message-text").value;

    if (text.length < 1) {
      return false;
    }

    this.$("#new-message-text").value = "";

    const id = uuidv4();

    const url = `${this.archive.url}/messages/${id}.json`;

    const appDatKey = await DatArchive.resolveName(window.location.origin);

    const message = {
      "@type": "Message",
      url,
      text,
      dateCreated: new Date().toISOString(),
      sender: {
        "@type": "Person",
        name: this.profile.name
      },
      audience: {
        "@type": "Audience",
        url: `dat://${appDatKey}/channels/general`,
        name: "general"
      }
    };

    await this.archive.writeFile(
      `messages/${id}.json`,
      JSON.stringify(message, null, 2)
    );

    // should be unnecessary
    this.messages.push(message);

    this.invalidate();

    setTimeout(() => {
      this.$("#new-message-text").focus();

      const messagesContainer = this.$(".messages-container");
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);
  }

  render() {
    const messages = this.messages.map(message => {
      return html`<dat-chat-message message=${message}></dat-chat-message>`;
    });

    return html`
      <style>
        :host {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        form {
          margin: 0;
          padding: 0;
        }
        main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .messages-container {
          flex: 1;
          overflow-y: auto;
        }
        .messages {
          list-style: none;
          padding: 4px 0;
          margin: 0;
        }
        #new-message-form {
          display: flex;
          padding: 10px;
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
      </style>
      
      <header id="header">
        <dat-select-archive on-load=${
          this.handleArchiveLoad
        }></dat-select-archive>
      </header>
  
      <main>
        <div class="messages-container">
          <ul class="messages">
            ${messages}
          </ul>
        </div>

        <form id="new-message-form" on-submit=${this.handleNewMessage}>
          <input placeholder="New message" type="text" id="new-message-text" autofocus />
          <button class="screenreader-only" type="submit">Add message</button>
        </form>
    </main>`;
  }
}
