import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/uptime-kuma/test-auth - Test authentication credentials
 * This endpoint helps debug authentication issues by showing what credentials are loaded
 */
export async function GET(request: NextRequest) {
  // Check environment variables
  const apiUrl = process.env.UPTIME_KUMA_API_URL || 'http://localhost:3003';
  const username = process.env.UPTIME_KUMA_USERNAME || 'admin';
  const password = process.env.UPTIME_KUMA_PASSWORD || 'admin123';
  const apiKey = process.env.UPTIME_KUMA_API_KEY || '';

  // Try to verify the connection
  let connectionTest = null;
  try {
    const testResponse = await fetch(`${apiUrl}/api/status-page`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't follow redirects, just check if server responds
      redirect: 'manual',
    });
    connectionTest = {
      status: testResponse.status,
      statusText: testResponse.statusText,
      ok: testResponse.ok,
      url: testResponse.url,
    };
  } catch (error) {
    connectionTest = {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  return NextResponse.json({
    success: true,
    credentials: {
      apiUrl,
      username,
      passwordLength: password ? password.length : 0,
      passwordFirstChars: password ? password.substring(0, 3) : '(not set)',
      passwordLastChars: password && password.length > 3 ? password.substring(password.length - 3) : '(not set)',
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
    },
    envCheck: {
      has_UPTIME_KUMA_API_URL: !!process.env.UPTIME_KUMA_API_URL,
      has_UPTIME_KUMA_USERNAME: !!process.env.UPTIME_KUMA_USERNAME,
      has_UPTIME_KUMA_PASSWORD: !!process.env.UPTIME_KUMA_PASSWORD,
      has_UPTIME_KUMA_API_KEY: !!process.env.UPTIME_KUMA_API_KEY,
    },
    connectionTest,
  });
}

