import totes from "../vendor/totes/index.js";
import { html, render } from "../vendor/lit-html/lib/lit-extended.js";
import ChatMessage from "./message.js";
import ChatNewMessage from "./new-message.js";
import { uuidv4 } from "../utils.js";

customElements.define("dat-chat-message", ChatMessage);
customElements.define("dat-chat-new-message", ChatNewMessage);

const DatArchive = window.DatArchive;

const styles = html`<style>
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
header {
  background-color: #fafafa;
  border-bottom: 1px solid #dfdfdf;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
}
h1 {
  font-size: 0.9rem;
  margin: 0;
  font-weight: normal;
}
</style>`;

const Component = totes(render)(HTMLElement);

export default class DatChat extends Component {
  constructor() {
    super();
    this.shadow = true;

    this.state = {
      archive: null,
      messages: [],
      channel: "general"
    };

    this.handleArchiveLoad = this.handleArchiveLoad.bind(this);
    this.handleNewMessage = this.handleNewMessage.bind(this);
    this.handleCreateProfile = this.handleCreateProfile.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  async componentDidMount() {
    this.$ = this.shadowRoot.querySelector.bind(this.shadowRoot);

    const profileUrl = localStorage.userUrl;

    if (profileUrl != null) {
      const archive = await DatArchive.load(profileUrl);
      if (archive != null) {
        this.setState({ archive, profileUrl }, this.handleArchiveLoad);
      }
    }
  }

  async handleCreateProfile() {
    const archive = await DatArchive.selectArchive({
      title: "Select an archive to use as your user profile",
      buttonLabel: "Select profile",
      filters: { isOwner: true }
    });

    localStorage.userUrl = archive.url;
    this.setState(
      { archive, profileUrl: archive.url },
      archive && this.handleArchiveLoad
    );
  }

  handleLogout() {
    delete localStorage.userUrl;
    this.setState({ archive: null, messages: [], profileUrl: null });
  }

  async handleArchiveLoad() {
    if (this.state.archive === null) {
      this.setState({
        messages: []
      });

      return;
    }

    const profileFile = await this.state.archive.readFile("/profile.json");

    this.setState({ profile: JSON.parse(profileFile) });

    const messageFiles = await this.state.archive.readdir("/messages");

    const messages = [];

    for (let file of messageFiles) {
      const fileContents = await this.state.archive.readFile(
        `/messages/${file}`
      );

      const message = JSON.parse(fileContents);

      messages.push(message);
    }

    this.setState({ messages }, async () => {
      const messagesContainer = this.$(".messages-container");
      await true;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
  }

  async handleNewMessage(event) {
    const id = uuidv4();

    const text = event.detail.text;

    const url = `${this.state.archive.url}/messages/${id}.json`;

    const appDatKey = await DatArchive.resolveName(window.location.origin);

    const message = {
      "@type": "Message",
      url,
      text,
      dateCreated: new Date().toISOString(),
      sender: {
        "@type": "Person",
        name: this.state.profile.name
      },
      audience: {
        "@type": "Audience",
        url: `dat://${appDatKey}/channels/general`,
        name: "general"
      }
    };

    await this.state.archive.writeFile(
      `messages/${id}.json`,
      JSON.stringify(message, null, 2)
    );

    this.setState({
      messages: [].concat(this.state.messages, message)
    });

    setTimeout(() => {
      const messagesContainer = this.$(".messages-container");
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);
  }

  render() {
    const messages = this.state.messages.map(message => {
      return html`<dat-chat-message message=${message}></dat-chat-message>`;
    });

    return html`
      ${styles}
      
      <header id="header">
        <h1>#${this.state.channel}</h1>
        ${
          this.state.profileUrl != null
            ? html`<div><button on-click=${
                this.handleLogout
              }>Logout</button></div>`
            : html`<button on-click=${
                this.handleCreateProfile
              }>Create profile</button>`
        }
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
