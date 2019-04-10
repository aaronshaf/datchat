import React, { Component } from "react";
import { TextInput } from "@instructure/ui-forms";
import { Text } from "@instructure/ui-elements";
import styled from "@emotion/styled/macro";
import { Avatar } from "@instructure/ui-elements";
import { uuidv4, mkdirp, sortMessage } from "./utils.js";

const Messages = styled.div`
  flex: 1;
  overflow: auto;
  padding: 16px 0;
`;

const MessageContent = styled.span``;

const Username = styled.span`
  margin-right: 12px;
  font-weight: 700;
`;

const Message = styled.div`
  &:hover {
    background-color: #f8f8f8;
  }
  padding: 4px 20px;
`;

const NewMessage = styled.div`
  padding: 16px;
  border-top: 1px solid #eee;
`;

const Container = styled.main`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export default class Channel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: []
    };
  }

  loadMessages = async () => {
    const { publicArchive, profile } = this.props;
    console.debug(this.props);
    await mkdirp("/messages", publicArchive);
    const messageFiles = await publicArchive.readdir("/messages");
    const messages = [];
    for (let file of messageFiles) {
      const fileContents = await publicArchive.readFile(`/messages/${file}`);
      const message = JSON.parse(fileContents);
      messages.push({
        ...message,
        user_archive: publicArchive.url,
        username: profile && profile.username
      });
    }
    this.setState({ messages: messages.sort(sortMessage) });
  };

  componentDidMount() {
    if (this.props.publicArchive != null && this.props.profile != null) {
      this.loadMessages();
    }
  }

  componentDidUpdate(prevProps) {
    const shouldLoad =
      this.props.profile != null &&
      (this.props.profile !== prevProps.profile ||
        this.props.publicArchive !== prevProps.publicArchive);
    if (shouldLoad) {
      this.loadMessages();
    }
  }

  handleMessageKeyDown = async event => {
    const isCompleted = event.which === 13 && event.shiftKey === false;
    if (isCompleted === false) {
      return;
    }
    const text = event.target.value;
    event.target.value = "";
    if (text.trim().length === 0) {
      return;
    }
    await mkdirp("/messages", this.props.publicArchive);
    const id = uuidv4();
    const now = Date.now();
    const message = {
      channel: "general",
      text,
      date_created: now,
      date_modified: now
    };
    await this.props.publicArchive.writeFile(
      `messages/${id}.json`,
      JSON.stringify(message, null, 2)
    );
    this.loadMessages();
  };

  render() {
    const { publicArchive } = this.props;
    const messages = this.state.messages.map((message, i) => {
      return (
        <Message key={i}>
          <Text size="small">
            <Username>{message.username}</Username>
            <MessageContent>{message.text || " "}</MessageContent>
          </Text>
        </Message>
      );
    });
    return (
      <Container>
        <Messages>{messages}</Messages>
        {publicArchive && (
          <NewMessage>
            <TextInput
              onKeyDown={this.handleMessageKeyDown}
              label="Write a message"
            />
          </NewMessage>
        )}
      </Container>
    );
  }
}