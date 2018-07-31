// https://stackoverflow.com/a/2117523
export const uuidv4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const alphanumericExp = new RegExp("^[a-zA-Z0-9_]*$");

export const isAlphanumeric = string => alphanumericExp.test(string);

export const $ = document.querySelector.bind(document);

// https://stackoverflow.com/a/6274381
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// http://gka.github.io/chroma.js/
export const userColors = shuffle([
  "#fafa6e",
  "#e0f470",
  "#c7ed73",
  "#aee678",
  "#97dd7d",
  "#81d581",
  "#6bcc86",
  "#56c28a",
  "#42b98d",
  "#2eaf8f",
  "#18a48f",
  "#009a8f",
  "#00908d",
  "#008589",
  "#007b84",
  "#0c707d",
  "#196676",
  "#215c6d",
  "#275263",
  "#2a4858"
]);
