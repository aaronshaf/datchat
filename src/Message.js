import React, { Component } from "react";
import styled from "@emotion/styled/macro";
import { Text } from "@instructure/ui-elements";
import { userColors } from "./utils.js";

const usersSeen = [];

const Container = styled.div`
  &:hover {
    background-color: #f8f8f8;
  }
  padding: 4px 20px;
`;

const Username = styled.span`
  margin-right: 12px;
  font-weight: 700;
`;

const MessageContent = styled.span``;

export default class Message extends Component {
  updateSeenUsers() {
    const url = this.props.data.dat_archive;
    if (usersSeen.includes(url) === false) {
      usersSeen.push(url);
    }
  }

  componentDidMount() {
    this.updateSeenUsers();
  }

  componentDidUpdate() {
    this.updateSeenUsers();
  }

  render() {
    const { username, text, dat_archive } = this.props.data;
    const userIndex = usersSeen.indexOf(dat_archive);
    const color = userColors[userIndex !== -1 ? userIndex : 0];

    return (
      <Container>
        <Text size="small">
          <Username style={{ color }}>{username}</Username>
          <MessageContent>{text || " "}</MessageContent>
        </Text>
      </Container>
    );
  }
}
