export default async (path, archive) => {
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
