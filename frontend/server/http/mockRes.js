/**
 * Minimal Express-compatible response for API handlers (no Express dependency).
 */
export function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    _finished: false,
    status(code) {
      res.statusCode = code;
      return res;
    },
    setHeader(name, value) {
      res.headers[String(name).toLowerCase()] = value;
    },
    json(payload) {
      res._finished = true;
      res._json = payload;
      if (!res.headers['content-type']) {
        res.headers['content-type'] = 'application/json; charset=utf-8';
      }
    },
    send(data) {
      res._finished = true;
      if (Buffer.isBuffer(data)) {
        res._buffer = data;
      } else if (typeof data === 'string') {
        res._string = data;
      } else if (data === undefined || data === null) {
        res._empty = true;
      } else {
        res._json = data;
      }
    },
  };
  return res;
}
