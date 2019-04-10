import React, { Component } from "react";
import Profile from "./Profile.js";
import styled from "@emotion/styled/macro";
import { ScreenReaderContent } from "@instructure/ui-a11y";
import IconAddressBook from "@instructure/ui-icons/lib/Line/IconAddressBook";
import IconChat from "@instructure/ui-icons/lib/Line/IconChat";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { Link } from "@instructure/ui-elements";
import NavLink from "./NavLink.js";
import Channel from "./Channel.js";
import Following from "./Following.js";

const Container = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
`;

const Nav = styled.nav`
  padding: 12px;
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
      <Router>
        <Container>
          <header>
            <Nav>
              <Link to="/" as={NavLink} icon={<IconChat size="small" />}>
                Chat
                <ScreenReaderContent>Chat</ScreenReaderContent>
              </Link>
              <Link
                to="/following"
                as={NavLink}
                icon={<IconAddressBook size="small" />}
              >
                Following
              </Link>
            </Nav>
          </header>
          <Profile
            onProfileChange={this.onProfileChange}
            profile={this.state.profile}
            publicArchive={this.state.publicArchive}
            privateArchive={this.state.privateArchive}
          />
          <Route
            exact
            path="/"
            render={() => (
              <Channel
                name="general"
                profile={this.state.profile}
                publicArchive={this.state.publicArchive}
              />
            )}
          />
          <Route
            exact
            path="/following"
            render={() => (
              <Following
                profile={this.state.profile}
                publicArchive={this.state.publicArchive}
                privateArchive={this.state.privateArchive}
              />
            )}
          />
        </Container>
      </Router>
    );
  }
}

export default App;
