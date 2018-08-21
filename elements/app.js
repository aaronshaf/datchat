import totes from "../vendor/totes/index.js";
import { html, render } from "../vendor/lit-html/lib/lit-extended.js";
import mkdirp from "../vendor/mkdirp/index.js";
import ChatMessage from "./message.js";
import ChatNewMessage from "./new-message.js";
import DatRoute from "./route.js";
import DatRoute2 from "./route2.js";
import DatRouter from "./router.js";
import DatProfile from "./profile.js";
import { uuidv4, listenToPushState } from "../utils.js";

listenToPushState();

customElements.define("dat-chat-message", ChatMessage);
customElements.define("dat-chat-new-message", ChatNewMessage);
customElements.define("dat-profile", DatProfile);
customElements.define("dat-route", DatRoute);
customElements.define("dat-route2", DatRoute2);
customElements.define("dat-router", DatRouter);

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
    this.handleSelectProfile = this.handleSelectProfile.bind(this);
    this.handleFollow = this.handleFollow.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.watchFollows = this.watchFollows.bind(this);
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

    if (window.location.pathname === "/") {
      setTimeout(window.history.pushState({}, "", "/channels/general"), 0);
    }
  }

  async handleSelectProfile() {
    const archive = await DatArchive.selectArchive({
      title: "Select an archive to use as your user profile",
      buttonLabel: "Select profile",
      filters: { isOwner: true, type: "dat-chat-user-profile" }
    });

    localStorage.userUrl = archive.url;
    this.setState(
      { archive, profileUrl: archive.url },
      archive && this.handleArchiveLoad
    );
  }

  async handleFollow() {
    const profileFile = await this.state.archive.readFile("/profile.json");

    const profile = JSON.parse(profileFile);

    const follow = window.prompt("Paste a Dat URL");

    if (follow == null) {
      return;
    }

    // TODO: resolve

    profile.follows = [].concat(profile.profile || [], follow);

    await this.state.archive.writeFile(
      "/profile.json",
      JSON.stringify(profile),
      "utf8"
    );
  }

  handleLogout() {
    delete localStorage.userUrl;
    this.setState({ archive: null, profileUrl: null });
  }

  async handleArchiveLoad() {
    if (this.state.archive === null) {
      return;
    }

    let profileFile;
    try {
      profileFile = await this.state.archive.readFile("/profile.json");
    } catch (err) {
      const name = window.prompt("What is your name?");
      profileFile = await this.state.archive.writeFile(
        "/profile.json",
        JSON.stringify({
          name,
          follows: []
        }),
        "utf8"
      );
    }

    const profile = JSON.parse(profileFile);

    this.setState({ profile });

    await mkdirp("/messages", this.state.archive);

    const messageFiles = await this.state.archive.readdir("/messages");

    const messages = [];

    for (let file of messageFiles) {
      const fileContents = await this.state.archive.readFile(
        `/messages/${file}`
      );

      const message = JSON.parse(fileContents);

      messages.push(message);
    }

    this.setState(
      { messages: messages.slice().sort(sortMessage) },
      async () => {
        const messagesContainer = this.$(".messages-container");
        await true;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    );

    this.watchFollows();
  }

  async watchFollows() {
    const profileFile = await this.state.archive.readFile("/profile.json");

    const profile = JSON.parse(profileFile);

    (profile.follows || []).forEach(async followedDatUrl => {
      const followedArchive = new DatArchive(followedDatUrl);
      const history = await followedArchive.history({
        start: 0,
        end: 50,
        reverse: true
      });

      // TODO: be smart about deletes/puts
      const messagePaths = history
        .filter(message => message.path.startsWith("/messages/"))
        .filter(message => message.type === "put")
        .reduce((messages, message) => {
          return [].concat(
            messages,
            messages.includes(message.path) ? [] : message
          );
        }, [])
        .map(message => message.path);

      messagePaths.forEach(async path => {
        const messageFile = await followedArchive.readFile(path, "utf8");

        if (messageFile == null) {
          return;
        }

        const message = JSON.parse(messageFile);

        message.sender.url = followedArchive.url;

        this.setState(
          {
            messages: [].concat(this.state.messages, message).sort(sortMessage)
          },
          async () => {
            const messagesContainer = this.$(".messages-container");
            await true;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        );
      });
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
      messages: [].concat(this.state.messages, message).sort(sortMessage)
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
            ? html`<div>
                <button on-click=${this.handleFollow}>Follow someone</button>

                <button on-click=${this.handleLogout}>Logout</button>
              </div>`
            : html`<button on-click=${
                this.handleSelectProfile
              }>Select profile</button>`
        }
      </header>

      <dat-route class="main" path="/profile">
        <dat-profile archive=${this.state.archive}></dat-profile>
      </dat-route>
  
      <dat-route class="main" path="/channels/general">
        <div class="messages-container">
          <ul class="messages">
            ${messages}
          </ul>
        </div>

        ${this.state.profile &&
          html`<dat-chat-new-message on-new-message=${
            this.handleNewMessage
          }></dat-chat-new-message>`}
      </dat-route>`;
  }
}

function sortMessage(a, b) {
  return new Date(a.dateCreated).getTime() < new Date(b.dateCreated).getTime()
    ? -1
    : 1;
}
