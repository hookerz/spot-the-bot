function parseQueryString() {

  // Adapted from https://github.com/sindresorhus/query-string

  const obj = {};
  const str = location.search.trim().replace(/^(\?|#|&)/, '');

  str.split('&').forEach(pair => {

    const split = pair.replace(/\+/g, ' ').split('=', 2);

    const key = decodeURIComponent(split[0]);
    const val = (split[1] === undefined) ? null : decodeURIComponent(split[1]);

    // Any preexisting value for this key.
    const pre = obj[key];

    if (Array.isArray(pre)) {

      pre.push(val);

    } else if (pre !== undefined) {

      obj[key] = [ pre, val ];

    } else {

      obj[key] = val;

    }

  });

  return obj;

}

export const query = parseQueryString();
