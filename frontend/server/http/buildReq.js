/**
 * Build a minimal Express-compatible request object.
 */
export function buildReq({ method, pathname, searchParams, headers, body, params }) {
  const query = {};
  searchParams.forEach((v, k) => {
    query[k] = v;
  });
  const h = {};
  for (const [k, v] of Object.entries(headers)) {
    h[String(k).toLowerCase()] = v;
  }
  const search = searchParams.toString();
  const path = pathname;
  const url = path + (search ? `?${search}` : '');
  return {
    method,
    url,
    originalUrl: url,
    path,
    headers: h,
    body: body ?? {},
    query,
    params: { ...(params || {}) },
  };
}
