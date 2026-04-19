import { NextResponse } from 'next/server';

export function mockResToNextResponse(res) {
  const status = res.statusCode || 200;
  const headers = new Headers();
  for (const [k, v] of Object.entries(res.headers)) {
    if (v != null) headers.set(k, String(v));
  }

  if (res._buffer) {
    return new NextResponse(res._buffer, { status, headers });
  }
  if (res._json !== undefined && res._json !== null) {
    return NextResponse.json(res._json, { status, headers });
  }
  if (res._empty) {
    return new NextResponse(null, { status, headers });
  }
  if (res._string !== undefined) {
    return new NextResponse(res._string, { status, headers });
  }
  return new NextResponse(null, { status, headers });
}
