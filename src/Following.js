import React, { Component } from "react";
import { Button } from "@instructure/ui-buttons";
import IconAdd from "@instructure/ui-icons/lib/Solid/IconAdd";
import { TextInput } from "@instructure/ui-forms";
import { Heading } from "@instructure/ui-elements";
import { Text } from "@instructure/ui-elements";
import { mkdirp } from "./utils.js";

const DatArchive = window.DatArchive;

export default class Following extends Component {
  constructor(props) {
    super(props);
    this.state = {
      follows: []
    };
  }

  handleUnfollow = async event => {
    event.preventDefault();
    // await this.props.publicArchive.writeFile(`follows/${datKey}.json`);
  };

  handleFollow = async event => {
    event.preventDefault();
    const datKey = await DatArchive.resolveName(this.inputRef.value);

    if (!datKey) {
      return;
    }

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
  };

  setInputRef = node => {
    this.inputRef = node;
  };

  loadFollows = async () => {
    const { publicArchive } = this.props;
    await mkdirp("/follows", publicArchive);
    const followFiles = await publicArchive.readdir("/follows");
    let follows = [];
    for (const filename of followFiles) {
      const fileContents = await publicArchive.readFile(`/follows/${filename}`);
      const follow = {
        ...JSON.parse(fileContents),
        dat_key: filename.split(".json")[0]
      };
      follows.push(follow);
    }
    this.setState({ follows });
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
            {follow.username} ({follow.dat_key})
            <button onClick={this.handleUnfollow}>Remove</button>
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
        <form onSubmit={this.handleFollow}>
          <TextInput ref={this.setInputRef} label="Paste their Dat URL" />
          <Button type="submit" margin="x-small x-small 0 0" icon={IconAdd}>
            Add
          </Button>
        </form>

        <Heading level="h2" margin="medium 0 0 0">
          You are following
        </Heading>
        <ul>{follows}</ul>
      </div>
    );
  }
}
