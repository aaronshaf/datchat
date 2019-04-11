import React, { Component } from "react";
import { Button } from "@instructure/ui-buttons";

const DatArchive = window.DatArchive;

export default class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoggedIn: false,
      privateArchive: null,
      publicArchive: null
    };
  }

  async componentDidMount() {
    if (
      localStorage.publicArchiveUrl != null &&
      localStorage.privateArchiveUrl != null
    ) {
      const publicArchive = await DatArchive.load(
        localStorage.publicArchiveUrl
      );
      const privateArchive = await DatArchive.load(
        localStorage.privateArchiveUrl
      );
      this.setState({ publicArchive, privateArchive, isLoggedIn: true }, () =>
        this.props.onProfileChange(privateArchive, publicArchive)
      );
    }
  }

  handleLogout = () => {
    this.setState(
      { publicArchive: null, privateArchive: null, isLoggedIn: false },
      () => {
        this.props.onProfileChange(null);
        localStorage.clear();
      }
    );
  };

  handleCreateProfile = async () => {
    const username = window.prompt("Username?");
    if (username == null) return;
    const privateArchive = await DatArchive.create({
      title: `Private DatChat: ${username}`,
      description: "Private archive for DatChat",
      prompt: false,
      type: ["datchat-private"]
    });
    await privateArchive.writeFile(
      "/profile.json",
      JSON.stringify({
        username
      }),
      "utf8"
    );
    const publicArchive = await DatArchive.create({
      title: `Public DatChat: ${username}`,
      description: "Public archive for DatChat",
      prompt: false,
      type: ["datchat-public"]
    });
    await publicArchive.writeFile(
      "/profile.json",
      JSON.stringify({
        username
      }),
      "utf8"
    );
    localStorage.privateArchiveUrl = privateArchive.url;
    localStorage.publicArchiveUrl = publicArchive.url;
    this.props.onProfileChange(privateArchive, publicArchive);
  };

  handleLoadProfile = async () => {
    const publicArchive = await DatArchive.selectArchive({
      prompt: "Select a public DatChat profile",
      filters: { isOwner: true, type: ["datchat-public"] }
    });
    const privateArchive = await DatArchive.selectArchive({
      prompt: "Select a private DatChat profile",
      filters: { isOwner: true, type: ["datchat-private"] }
    });
    localStorage.privateArchiveUrl = privateArchive.url;
    localStorage.publicArchiveUrl = publicArchive.url;
    this.props.onProfileChange(privateArchive, publicArchive);
  };

  render() {
    const isLoggedIn = this.state.isLoggedIn;
    return (
      <>
        {isLoggedIn ? (
          <Button onClick={this.handleLogout}>Log out</Button>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={this.handleCreateProfile}
              margin="0 small"
            >
              Create profile
            </Button>
            <Button variant="ghost" onClick={this.handleLoadProfile}>
              Load profile
            </Button>
          </>
        )}
      </>
    );
  }
}
