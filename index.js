import DatChat from "./elements/dat-chat.js";

customElements.define("dat-chat", DatChat.withProperties());

const element = document.createElement("dat-chat");

document.querySelector("#app").appendChild(element);
