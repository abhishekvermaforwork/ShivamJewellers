import { NextRequest } from 'next/server';
import { dispatchApi } from '@/server/http/apiDispatcher.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: NextRequest, params: { path?: string[] }) {
  const url = new URL(request.url);
  const segments = params.path ?? [];
  const pathname = segments.length ? `/${segments.join('/')}` : '/';

  let body: unknown = undefined;
  const method = request.method;
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    }
  }

  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headers[k] = v;
  });

  return dispatchApi({
    method,
    pathname,
    searchParams: url.searchParams,
    headers,
    body,
  });
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const p = await ctx.params;
  return handle(request, p);
}
export async function POST(request: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const p = await ctx.params;
  return handle(request, p);
}
export async function PUT(request: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const p = await ctx.params;
  return handle(request, p);
}
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const p = await ctx.params;
  return handle(request, p);
}
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const p = await ctx.params;
  return handle(request, p);
}
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    },
  });
}
