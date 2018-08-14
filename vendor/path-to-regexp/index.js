// https://github.com/synaptiko/path-to-regexp/blob/d24a1ab484859468a36e03c9f99b70c971e23c1a/index.mjs
// License MIT

/**
 * Default configs.
 */
const DEFAULT_DELIMITER = "/";
const DEFAULT_DELIMITERS = "./";

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
const PATH_REGEXP = new RegExp(
  [
    // Match escaped characters that would otherwise appear in future matches.
    // This allows the user to escape special characters that won't transform.
    "(\\\\.)",
    // Match Express-style parameters and un-named parameters with a prefix
    // and optional suffixes. Matches appear as:
    //
    // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
    // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined]
    "(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?"
  ].join("|"),
  "g"
);

/**
 * Parse a string for the raw tokens.
 *
 * @param  {string}  str
 * @param  {Object=} options
 * @return {!Array}
 */
export function parse(str, options) {
  const tokens = [];
  let key = 0;
  let index = 0;
  let path = "";
  const defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER;
  const delimiters = (options && options.delimiters) || DEFAULT_DELIMITERS;
  let pathEscaped = false;
  let res;

  while ((res = PATH_REGEXP.exec(str)) !== null) {
    const m = res[0];
    const escaped = res[1];
    const offset = res.index;
    path += str.slice(index, offset);
    index = offset + m.length;

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1];
      pathEscaped = true;
      continue;
    }

    let prev = "";
    const next = str[index];
    const name = res[2];
    const capture = res[3];
    const group = res[4];
    const modifier = res[5];

    if (!pathEscaped && path.length) {
      const k = path.length - 1;

      if (delimiters.indexOf(path[k]) > -1) {
        prev = path[k];
        path = path.slice(0, k);
      }
    }

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path);
      path = "";
      pathEscaped = false;
    }

    const partial = prev !== "" && next !== undefined && next !== prev;
    const repeat = modifier === "+" || modifier === "*";
    const optional = modifier === "?" || modifier === "*";
    const delimiter = prev || defaultDelimiter;
    const pattern = capture || group;

    tokens.push({
      name: name || key++,
      prefix: prev,
      delimiter,
      optional,
      repeat,
      partial,
      pattern: pattern
        ? escapeGroup(pattern)
        : "[^" + escapeString(delimiter) + "]+?"
    });
  }

  // Push any remaining characters.
  if (path || index < str.length) {
    tokens.push(path + str.substr(index));
  }

  return tokens;
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {string}             str
 * @param  {Object=}            options
 * @return {!function(Object=, Object=)}
 */
export function compile(str, options) {
  return tokensToFunction(parse(str, options));
}

/**
 * Expose a method for transforming tokens into the path function.
 */
export function tokensToFunction(tokens) {
  // Compile all the tokens into regexps.
  const matches = new Array(tokens.length);

  // Compile all the patterns before compilation.
  for (let i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === "object") {
      matches[i] = new RegExp("^(?:" + tokens[i].pattern + ")$");
    }
  }

  return function(data, options) {
    let path = "";
    const encode = (options && options.encode) || encodeURIComponent;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (typeof token === "string") {
        path += token;
        continue;
      }

      const value = data ? data[token.name] : undefined;
      let segment;

      if (Array.isArray(value)) {
        if (!token.repeat) {
          throw new TypeError(
            'Expected "' + token.name + '" to not repeat, but got array'
          );
        }

        if (value.length === 0) {
          if (token.optional) continue;

          throw new TypeError('Expected "' + token.name + '" to not be empty');
        }

        for (let j = 0; j < value.length; j++) {
          segment = encode(value[j]);

          if (!matches[i].test(segment)) {
            throw new TypeError(
              'Expected all "' +
                token.name +
                '" to match "' +
                token.pattern +
                '"'
            );
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment;
        }

        continue;
      }

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        segment = encode(String(value));

        if (!matches[i].test(segment)) {
          throw new TypeError(
            'Expected "' +
              token.name +
              '" to match "' +
              token.pattern +
              '", but got "' +
              segment +
              '"'
          );
        }

        path += token.prefix + segment;
        continue;
      }

      if (token.optional) {
        // Prepend partial segment prefixes.
        if (token.partial) path += token.prefix;

        continue;
      }

      throw new TypeError(
        'Expected "' +
          token.name +
          '" to be ' +
          (token.repeat ? "an array" : "a string")
      );
    }

    return path;
  };
}

/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup(group) {
  return group.replace(/([=!:$/()])/g, "\\$1");
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {string}
 */
function flags(options) {
  return options && options.sensitive ? "" : "i";
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {!RegExp} path
 * @param  {Array=}  keys
 * @return {!RegExp}
 */
function regexpToRegexp(path, keys) {
  if (!keys) return path;

  // Use a negative lookahead to match only capturing groups.
  const groups = path.source.match(/\((?!\?)/g);

  if (groups) {
    for (let i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        partial: false,
        pattern: null
      });
    }
  }

  return path;
}

/**
 * Transform an array into a regexp.
 *
 * @param  {!Array}  path
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function arrayToRegexp(path, keys, options) {
  const parts = [];

  for (let i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source);
  }

  return new RegExp("(?:" + parts.join("|") + ")", flags(options));
}

/**
 * Create a path regexp from string input.
 *
 * @param  {string}  path
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function stringToRegexp(path, keys, options) {
  return tokensToRegExp(parse(path, options), keys, options);
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {!Array}  tokens
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
export function tokensToRegExp(tokens, keys, options) {
  options = options || {};

  const strict = options.strict;
  const end = options.end !== false;
  const delimiter = escapeString(options.delimiter || DEFAULT_DELIMITER);
  const delimiters = options.delimiters || DEFAULT_DELIMITERS;
  const endsWith = []
    .concat(options.endsWith || [])
    .map(escapeString)
    .concat("$")
    .join("|");
  let route = "";
  let isEndDelimited = false;

  // Iterate over the tokens and create our regexp string.
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (typeof token === "string") {
      route += escapeString(token);
      isEndDelimited =
        i === tokens.length - 1 &&
        delimiters.indexOf(token[token.length - 1]) > -1;
    } else {
      const prefix = escapeString(token.prefix);
      const capture = token.repeat
        ? "(?:" +
          token.pattern +
          ")(?:" +
          prefix +
          "(?:" +
          token.pattern +
          "))*"
        : token.pattern;

      if (keys) keys.push(token);

      if (token.optional) {
        if (token.partial) {
          route += prefix + "(" + capture + ")?";
        } else {
          route += "(?:" + prefix + "(" + capture + "))?";
        }
      } else {
        route += prefix + "(" + capture + ")";
      }
    }
  }

  if (end) {
    if (!strict) route += "(?:" + delimiter + ")?";

    route += endsWith === "$" ? "$" : "(?=" + endsWith + ")";
  } else {
    if (!strict) route += "(?:" + delimiter + "(?=" + endsWith + "))?";
    if (!isEndDelimited) route += "(?=" + delimiter + "|" + endsWith + ")";
  }

  return new RegExp("^" + route, flags(options));
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(string|RegExp|Array)} path
 * @param  {Array=}                keys
 * @param  {Object=}               options
 * @return {!RegExp}
 */
export default function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys);
  }

  if (Array.isArray(path)) {
    return arrayToRegexp(/** @type {!Array} */ (path), keys, options);
  }

  return stringToRegexp(/** @type {string} */ (path), keys, options);
}
