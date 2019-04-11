import React, { Component } from "react";
import Profile from "./Profile.js";
import styled from "@emotion/styled/macro";
// import IconAddressBook from "@instructure/ui-icons/lib/Line/IconAddressBook";
// import IconChat from "@instructure/ui-icons/lib/Line/IconChat";
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

const Start = styled.div`
  flex: 1;
  display: flex;
`;

const End = styled.div`
  display: flex;
`;

const Nav = styled.nav`
  padding: 12px;
  display: flex;
  border-bottom: 1px solid #eee;
`;

const NavLinkContainer = styled.div`
  margin-left: 12px;
  margin-right: 12px;
  display: flex;
  align-items: center;
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

  onProfileChange = async (privateArchive, publicArchive) => {
    this.setState(
      {
        privateArchive,
        publicArchive,
        profile: publicArchive
          ? JSON.parse(await publicArchive.readFile("/profile.json"))
          : null
      },
      async () => {}
    );
  };

  render() {
    return (
      <Router>
        <Container>
          <header>
            <Nav>
              <Start>
                <NavLinkContainer>
                  <Link to="/" as={NavLink}>
                    Channels
                  </Link>
                </NavLinkContainer>
                {this.state.publicArchive && (
                  <NavLinkContainer>
                    <Link to="/following" as={NavLink}>
                      Following
                    </Link>
                  </NavLinkContainer>
                )}
              </Start>

              <End>
                <Profile
                  onProfileChange={this.onProfileChange}
                  profile={this.state.profile}
                  publicArchive={this.state.publicArchive}
                  privateArchive={this.state.privateArchive}
                />
              </End>
            </Nav>
          </header>
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
