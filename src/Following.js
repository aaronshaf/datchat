import React, { Component } from "react";
import { Button } from "@instructure/ui-buttons";
import IconAdd from "@instructure/ui-icons/lib/Solid/IconAdd";
import { TextInput } from "@instructure/ui-forms";
import { Heading } from "@instructure/ui-elements";
import { Text } from "@instructure/ui-elements";
import { mkdirp, loadFollows } from "./utils.js";

const DatArchive = window.DatArchive;

export default class Following extends Component {
  constructor(props) {
    super(props);
    this.state = {
      follows: [],
      suggestedFollows: []
    };
  }

  handleUnfollow = async (event, datKey) => {
    event.preventDefault();
    await this.props.publicArchive.unlink(
      `follows/${datKey.split("dat://")[1]}.json`
    );
    this.loadFollows();
  };

  follow = async datKey => {
    const followedDatUrl = `dat://${datKey}`;
    const followedArchive = new DatArchive(followedDatUrl);
    const followedProfileFile = await followedArchive.readFile("/profile.json");
    const followedProfile = JSON.parse(followedProfileFile);
    await mkdirp("/follows", this.props.publicArchive);
    const follow = {
      username: followedProfile.username
    };
    await this.props.publicArchive.writeFile(
      `follows/${datKey}.json`,
      JSON.stringify(follow, null, 2)
    );
    this.loadFollows();
  };

  handleFollowSubmit = async event => {
    event.preventDefault();
    if (this.inputRef.value.length === 0) {
      return false;
    }
    const datKey = await DatArchive.resolveName(this.inputRef.value);
    if (!datKey) {
      return;
    }
    this.follow(datKey);
    this.inputRef.value = "";
  };

  setInputRef = node => {
    this.inputRef = node;
  };

  loadFollows = async () => {
    const { publicArchive } = this.props;
    const follows = await loadFollows(publicArchive);
    this.setState({ follows }, this.loadSuggestions);
  };

  loadSuggestions = async () => {
    const suggestedFollows = [];
    for (const follow of this.state.follows) {
      const followedArchive = new DatArchive(follow.dat_archive);
      const otherFollows = await loadFollows(followedArchive);
      for (const otherFollow of otherFollows) {
        const isSelf = otherFollow.dat_archive === this.props.publicArchive.url;
        const isAlreadyFollowed = this.state.follows.some(
          ({ dat_archive }) => dat_archive === otherFollow.dat_archive
        );
        const isAlreadySuggested = suggestedFollows.some(
          ({ dat_archive }) => dat_archive === otherFollow.dat_archive
        );
        if (
          isSelf === false &&
          isAlreadySuggested === false &&
          isAlreadyFollowed === false
        ) {
          suggestedFollows.push(otherFollow);
        }
      }
    }
    this.setState({ suggestedFollows });
  };

  componentDidMount() {
    if (this.props.publicArchive != null && this.props.profile != null) {
      this.loadFollows();
    }
  }

  componentDidUpdate(prevProps) {
    const shouldLoad = this.props.publicArchive !== prevProps.publicArchive;
    if (shouldLoad) {
      this.loadFollows();
    }
  }

  render() {
    const follows = this.state.follows.map((follow, i) => {
      return (
        <li key={i}>
          <Text>
            {follow.username} ({follow.dat_archive}){" "}
            <button
              onClick={event => this.handleUnfollow(event, follow.dat_archive)}
            >
              Remove
            </button>
          </Text>
        </li>
      );
    });

    const _suggestedFollows =
      this.state.follows.length > 0
        ? this.state.suggestedFollows
        : [
            {
              username: "aaronshaf",
              dat_archive:
                "dat://4ce870cd06a4701293bf04c79c1071160f0e79cddd1fad7b864b087397992b51"
            }
          ];
    const suggestedFollows = _suggestedFollows.map((follow, i) => {
      return (
        <li key={i}>
          <Text>
            {follow.username} ({follow.dat_archive}){" "}
            <button
              onClick={event =>
                this.follow(follow.dat_archive.split("dat://")[1])
              }
            >
              Follow
            </button>
          </Text>
        </li>
      );
    });

    return (
      <div style={{ margin: "20px" }}>
        {this.props.publicArchive && (
          <>
            <Heading level="h2" margin="0 0 small 0">
              Your public Dat URL
            </Heading>
            <Text size="small">{this.props.publicArchive.url}</Text>
          </>
        )}

        <Heading level="h2" margin="medium 0 small 0">
          Follow someone else
        </Heading>
        <form onSubmit={this.handleFollowSubmit}>
          <TextInput inputRef={this.setInputRef} label="Paste their Dat URL" />
          <Button type="submit" margin="x-small x-small 0 0" icon={IconAdd}>
            Add
          </Button>
        </form>

        {follows.length > 0 && (
          <>
            <Heading level="h2" margin="medium 0 0 0">
              You are following
            </Heading>
            <ul>{follows}</ul>
          </>
        )}

        {suggestedFollows.length > 0 && (
          <>
            <Heading level="h2" margin="medium 0 0 0">
              Suggested
            </Heading>
            <ul>{suggestedFollows}</ul>
          </>
        )}
        <Heading level="h2" margin="medium 0 small 0">
          Reminder
        </Heading>
        <Text>
          If someone isn't following you they won't see your messages. Send them
          your Dat URL.
        </Text>
      </div>
    );
  }
}
