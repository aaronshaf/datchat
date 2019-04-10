import React, { Component } from "react";

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
      console.debug({ publicArchive, privateArchive });
      this.setState({ publicArchive, privateArchive, isLoggedIn: true }, () =>
        this.props.onProfileChange(privateArchive, publicArchive)
      );
    }
  }

  handleLogout = () => {
    this.setState(
      { publicArchive: null, privateArchive: null, isLoggedIn: false },
      () => this.props.onProfileChange(null)
    );
  };

  handleLogin = async () => {
    const username = window.prompt("Username?");
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

  render() {
    const isLoggedIn = this.state.isLoggedIn;
    return (
      <div>
        {isLoggedIn ? (
          <button onClick={this.handleLogout}>Log out</button>
        ) : (
          <button onClick={this.handleLogin}>Log in</button>
        )}
      </div>
    );
  }
}
