import { createStore } from "./vendor/redux/redux.js";
import rootReducer from "./reducers/index.js";

const store = createStore(rootReducer);

export default store;
