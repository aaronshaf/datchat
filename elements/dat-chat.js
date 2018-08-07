import { html } from "../vendor/lit-html/lib/lit-extended.js";
import { LitElement } from "../vendor/lit-element/lit-element.js";
import DatSelectArchive from "./dat-select-archive.js";
import DatChatMessage from "./dat-chat-message.js";
import DatChatNewMessage from "./dat-chat-new-message.js";
import { uuidv4 } from "../utils.js";

customElements.define("dat-select-archive", DatSelectArchive.withProperties());
customElements.define("dat-chat-message", DatChatMessage.withProperties());
customElements.define(
  "dat-chat-new-message",
  DatChatNewMessage.withProperties()
);

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
      const messagesContainer = this.$(".messages-container");

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);
  }

  async handleNewMessage(event) {
    const id = uuidv4();

    const text = event.detail.text;

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

    this.messages.push(message);

    this.invalidate();

    setTimeout(() => {
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
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          right: 0;
          display: flex;
          flex-direction: column;
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

        <dat-chat-new-message on-new-message=${
          this.handleNewMessage
        }></dat-chat-new-message>
      </main>`;
  }
}
