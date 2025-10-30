import { NextRequest, NextResponse } from 'next/server';

const WAVE_BASE_URL = "https://wave-iaccessible.com/Wave3.1.1/htdocs/request.php";
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 2;
const BACKOFF_BASE = 1.5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_WAVE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'WAVE API key is not configured' },
        { status: 500 }
      );
    }

    // URL encode the target URL properly
    const encodedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    const params = new URLSearchParams({
      key: apiKey,
      reporttype: '3',
      url: encodedUrl,
    });

    const endpoint = `${WAVE_BASE_URL}?${params.toString()}`;
    const maxRetries = DEFAULT_RETRIES;
    let lastError: Error | null = null;

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

        const response = await fetch(endpoint, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        const data = JSON.parse(text);

        // Check if the API returned a success status
        if (!data.status.success) {
          throw new Error(data.status.error || "WAVE API returned unsuccessful status");
        }

        return NextResponse.json(data);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort (timeout) or if we've exhausted retries
        if (
          (error as Error).name === 'AbortError' ||
          attempt === maxRetries
        ) {
          break;
        }

        // Exponential backoff: 1.5^attempt seconds
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(BACKOFF_BASE, attempt + 1) * 1000)
        );
      }
    }

    return NextResponse.json(
      {
        error: `WAVE scan failed after ${maxRetries + 1} attempts: ${
          lastError?.message || 'Unknown error'
        }`,
        details: lastError?.message
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('WAVE API route error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}



