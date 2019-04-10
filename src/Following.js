import React, { Component } from "react";
import { Button } from "@instructure/ui-buttons";
import IconAdd from "@instructure/ui-icons/lib/Solid/IconAdd";
import { TextInput } from "@instructure/ui-forms";
import { mkdirp } from "./utils.js";

const DatArchive = window.DatArchive;

export default class Following extends Component {
  constructor(props) {
    super(props);
    this.state = {
      follows: []
    };
  }

  handleSubmit = async event => {
    event.preventDefault();
    console.debug(this.inputRef.value);

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
          {follow.username} ({follow.dat_key})
        </li>
      );
    });
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <TextInput ref={this.setInputRef} label="Paste Dat URL" />
          <Button type="submit" margin="0 x-small 0 0" icon={IconAdd}>
            Add
          </Button>
        </form>
        <ul>{follows}</ul>
      </div>
    );
  }
}