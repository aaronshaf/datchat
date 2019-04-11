import React, { Component } from "react";
import { TextInput } from "@instructure/ui-forms";
import styled from "@emotion/styled/macro";
import { uuidv4, mkdirp, sortMessage, basename } from "./utils.js";
import Message from "./Message.js";

const DatArchive = window.DatArchive;

const Messages = styled.div`
  flex: 1;
  overflow: auto;
  padding: 16px 0;
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
    await mkdirp("/messages", publicArchive);
    const messageFiles = await publicArchive.readdir("/messages");
    const messages = [];
    for (let file of messageFiles) {
      const fileContents = await publicArchive.readFile(`/messages/${file}`);
      const message = JSON.parse(fileContents);
      messages.push({
        ...message,
        dat_archive: publicArchive.url,
        username: profile && profile.username
      });
    }
    this.setState({ messages: messages.sort(sortMessage) });

    const events = publicArchive.watch("/messages/*.json");
    events.addEventListener("invalidated", ({ path }) => {
      this.updateMessage(path, publicArchive, profile);
    });

    await mkdirp("/follows", publicArchive);
    const followFiles = await publicArchive.readdir("/follows");
    followFiles.forEach(async file => {
      const key = file.split(".json")[0];
      const followedDatUrl = `dat://${key}`;
      const followedArchive = new DatArchive(followedDatUrl);
      const followedProfileFile = await followedArchive.readFile(
        "/profile.json"
      );
      const followedProfile = JSON.parse(followedProfileFile);
      const history = await followedArchive.history({
        start: 0,
        end: 150,
        reverse: true
      });
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
        this.updateMessage(path, followedArchive, followedProfile);
      });

      const events = followedArchive.watch("/messages/*.json");
      events.addEventListener("invalidated", ({ path }) => {
        this.updateMessage(path, followedArchive, followedProfile);
      });
    });
  };

  updateMessage = async (path, followedArchive, profile) => {
    const messageFile = await followedArchive.readFile(path, "utf8");
    if (!messageFile) {
      return;
    }
    const message = JSON.parse(messageFile);
    message.username = profile.username;
    const id = basename(path);
    message.id = id;
    message.dat_archive = followedArchive.url;

    this.setState(
      {
        messages: []
          .concat(
            this.state.messages.filter(_message => _message.id !== message.id),
            message
          )
          .sort(sortMessage)
      },
      async () => {
        const messagesContainer = this.messagesRef;
        await true;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    );
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
    // this.loadMessages();
  };

  setMessagesRef = node => {
    this.messagesRef = node;
  };

  render() {
    const { publicArchive } = this.props;
    const messages = this.state.messages.map((message, i) => {
      return <Message key={i} data={message} />;
    });
    return (
      <Container>
        <Messages ref={this.setMessagesRef}>{messages}</Messages>
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
