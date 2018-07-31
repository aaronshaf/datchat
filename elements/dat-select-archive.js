import { html } from "../vendor/lit-html/lib/lit-extended.js";
import { LitElement } from "../vendor/lit-element/lit-element.js";

const DatArchive = window.DatArchive;

export default class DatSelectArchive extends LitElement {
  constructor() {
    super();

    this.profileUrl = localStorage.userUrl;
    this.archive = null;

    if (this.profileUrl) {
      DatArchive.load(this.profileUrl).then(archive => {
        this.archive = archive;
        this.invalidate();

        this.dispatchEvent(
          new CustomEvent("load", {
            detail: { archive },
            bubbles: false
          })
        );
      });
    }

    this.createProfile = this.createProfile.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  static get properties() {
    return {
      name: {
        type: String,
        attrName: "name"
      }
    };
  }

  async createProfile() {
    const archive = await DatArchive.selectArchive({
      title: "Select an archive to use as your user profile",
      buttonLabel: "Select profile",
      filters: { isOwner: true }
    });

    this.archive = archive;

    localStorage.userUrl = archive.url;

    this.profileUrl = archive.url;

    this.invalidate();

    this.dispatchEvent(
      new CustomEvent("load", {
        detail: { archive },
        bubbles: false
      })
    );
  }

  handleLogout() {
    this.archive = null;

    delete localStorage.userUrl;

    this.profileUrl = null;

    this.invalidate();

    this.dispatchEvent(
      new CustomEvent("load", {
        detail: { archive: null },
        bubbles: false
      })
    );
  }

  render() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>

      ${
        this.profileUrl != null
          ? html`<div><button on-click=${
              this.handleLogout
            }>Logout</button></div>`
          : html`<button on-click=${this.createProfile}>Create profile</button>`
      }
    `;
  }
}
