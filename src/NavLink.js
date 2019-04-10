import React, { PureComponent } from "react";
import { NavLink as ReactRouterNavLink } from "react-router-dom";

// Straightforward use of InstUI <Link as={NavLink}> shows
// console error:
//  "Stateless function components cannot be given refs.
//  Attempts to access this ref will fail"

export default class NavLink extends PureComponent {
  render() {
    return <ReactRouterNavLink {...this.props} />;
  }
}
