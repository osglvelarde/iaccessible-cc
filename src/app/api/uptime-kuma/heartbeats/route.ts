import { NextRequest } from 'next/server';
import { uptimeKumaSocket, HeartbeatEvent } from '@/lib/uptime-kuma-socket';

/**
 * GET /api/uptime-kuma/heartbeats?monitorId=X - Server-Sent Events endpoint for real-time heartbeats
 * 
 * This endpoint streams heartbeat events from Uptime Kuma via Socket.io to the client
 * using Server-Sent Events (SSE).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const monitorIdParam = searchParams.get('monitorId');

  if (!monitorIdParam) {
    return new Response('monitorId parameter is required', { status: 400 });
  }

  const monitorId = parseInt(monitorIdParam);

  if (isNaN(monitorId)) {
    return new Response('Invalid monitorId', { status: 400 });
  }

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper to send SSE message
      const sendMessage = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Connect to Uptime Kuma
      try {
        await uptimeKumaSocket.connect();
        sendMessage({ type: 'connected', monitorId });

        // Subscribe to heartbeat events
        const unsubscribe = uptimeKumaSocket.subscribeToMonitor(monitorId, (heartbeat: HeartbeatEvent) => {
          sendMessage({
            type: 'heartbeat',
            monitorId,
            data: heartbeat,
          });
        });

        // Send initial connection status
        const status = uptimeKumaSocket.getConnectionStatus();
        sendMessage({
          type: 'status',
          monitorId,
          status,
        });

        // Keep connection alive with periodic ping
        const pingInterval = setInterval(() => {
          try {
            sendMessage({ type: 'ping', timestamp: Date.now() });
          } catch (error) {
            clearInterval(pingInterval);
            unsubscribe();
            controller.close();
          }
        }, 30000); // Every 30 seconds

        // Cleanup function
        const cleanup = () => {
          clearInterval(pingInterval);
          unsubscribe();
          try {
            controller.close();
          } catch (error) {
            // Ignore errors on close
          }
        };

        // Handle client disconnect via AbortSignal
        request.signal.addEventListener('abort', () => {
          cleanup();
        });

        // Handle stream cancellation
        if (request.signal.aborted) {
          cleanup();
          return;
        }
      } catch (error) {
        sendMessage({
          type: 'error',
          monitorId,
          error: error instanceof Error ? error.message : 'Connection failed',
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}

