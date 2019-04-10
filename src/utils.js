// https://stackoverflow.com/a/2117523
export const uuidv4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const mkdirp = async (path, archive) => {
  const parts = path.split("/");

  for (const index in parts) {
    const partialPath = parts.slice(0, index + 1).join("/");

    if (partialPath == null) {
      continue;
    }

    try {
      const stat = await archive.stat(partialPath);

      if (stat.isDirectory() === false) {
        throw new Error(`${partialPath} is not a directory`);
      }
    } catch (err) {
      await archive.mkdir(partialPath);
    }
  }
};

export const sortMessage = (a, b) =>
  new Date(a.date_created).getTime() < new Date(b.date_created).getTime()
    ? -1
    : 1;

function stripExtension(str) {
  return str.substr(0, str.lastIndexOf("."));
}

export const basename = path => {
  return stripExtension(path.split("/").reverse()[0]);
};
