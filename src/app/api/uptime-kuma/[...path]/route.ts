import { NextRequest, NextResponse } from 'next/server';

const UPTIME_KUMA_API_URL = process.env.UPTIME_KUMA_API_URL || 'http://localhost:3003';
const UPTIME_KUMA_API_KEY = process.env.UPTIME_KUMA_API_KEY || '';

async function proxy(request: NextRequest, paramsPromise: Promise<{ path: string[] }>, method: 'GET' | 'POST' | 'PUT' | 'DELETE') {
  try {
    const params = await paramsPromise;
    const path = params.path.join('/');
    const { searchParams } = new URL(request.url);

    let targetUrl = `${UPTIME_KUMA_API_URL}/${path}`;
    const queryString = searchParams.toString();
    if (queryString) targetUrl += `?${queryString}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (UPTIME_KUMA_API_KEY) {
      // For /metrics endpoint, use Basic Auth with API key as password
      if (path === 'metrics') {
        const credentials = Buffer.from(`:${UPTIME_KUMA_API_KEY}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      } else {
        // For other endpoints, use Bearer token
        headers['Authorization'] = `Bearer ${UPTIME_KUMA_API_KEY}`;
      }
    }

    const body = method === 'GET' || method === 'DELETE' ? undefined : await request.text();

    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => upstream.statusText);
      return NextResponse.json({ error: `Uptime Kuma API error: ${errorText}` }, { status: upstream.status });
    }

    // Try to pass through JSON; fallback to text
    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      return NextResponse.json(data);
    }
    const text = await upstream.text();
    return new NextResponse(text, { headers: { 'Content-Type': contentType || 'text/plain' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to connect to Uptime Kuma', message }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context.params, 'GET');
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context.params, 'POST');
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context.params, 'PUT');
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context.params, 'DELETE');
}


