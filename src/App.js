import React, { Component } from "react";
import Profile from "./Profile.js";
import styled from "@emotion/styled/macro";
import { Avatar } from "@instructure/ui-elements";
import Channel from "./Channel.js";
import { FlexItem } from "@instructure/ui-layout";

const Header = styled.header`
  max-width: 850px;
  margin: auto;
`;

const Container = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
`;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      privateArchive: null,
      publicArchive: null,
      profile: null
    };
  }

  onProfileChange = (privateArchive, publicArchive) => {
    this.setState({ privateArchive, publicArchive }, async () => {
      const profile = JSON.parse(
        await this.state.publicArchive.readFile("/profile.json")
      );
      this.setState({ profile });
    });
  };

  render() {
    return (
      <Container>
        <header>
          {this.state.profile && (
            <Avatar name={this.state.profile.username} margin="0 small 0 0" />
          )}
          <Profile onProfileChange={this.onProfileChange} />
        </header>
        <Channel
          profile={this.state.profile}
          publicArchive={this.state.publicArchive}
        />
      </Container>
    );
  }
}

export default App;
