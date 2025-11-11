# Vercel Deployment Guide for Uptime Monitoring

## ⚠️ Important: Python Scripts Limitation

**Vercel serverless functions do NOT include Python by default.** The Uptime Kuma integration uses Python scripts for:
- Creating monitors (`add_monitor.py`)
- Getting monitor beats (`get_monitor_beats.py`)

These scripts **will not work** on Vercel unless you configure Python runtime.

## Solution Options

### Option 1: Use Vercel Python Runtime (Recommended)

You need to configure Vercel to use Python runtime for the API routes that use Python scripts.

1. **Create/Update `vercel.json`:**
```json
{
  "functions": {
    "api/uptime-kuma/monitors/route.ts": {
      "runtime": "python3.9"
    },
    "api/uptime-kuma/monitor-beats/route.ts": {
      "runtime": "python3.9"
    }
  }
}
```

**However**, this won't work because Next.js API routes are Node.js, not Python. You'd need to rewrite them as separate Python serverless functions.

### Option 2: Use External API Service (Recommended for Vercel)

Create a separate service (e.g., on Render, Railway, or Fly.io) that runs the Python scripts and call it from Vercel.

### Option 3: Rewrite Python Scripts in Node.js/TypeScript

Convert the Python scripts to TypeScript/Node.js using a Socket.io client library directly.

### Option 4: Deploy to Render Instead

Render supports both Node.js and Python, making it a better fit for this integration.

## Environment Variables Setup (Required)

Even if Python scripts don't work, you still need to set these for other parts of the integration:

### In Vercel Dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add the following variables:

```
UPTIME_KUMA_API_URL=https://uptime-monitoring-tool.onrender.com
UPTIME_KUMA_USERNAME=iaccessible-admin
UPTIME_KUMA_PASSWORD=iAccessible-Granite-Field-47*
UPTIME_KUMA_API_KEY=uk1_ovykShADuMK42QsCudzJ_S2IjPl9AKAnHrDGEMzb
```

3. **Apply to all environments** (Production, Preview, Development)
4. **Redeploy** your application

## Testing the Connection

After setting environment variables, test the connection:

1. Visit: `https://your-vercel-app.vercel.app/api/uptime-kuma/test-auth`
2. This should return connection status (even if Python scripts don't work)

## Current Limitations on Vercel

- ❌ **Monitor Creation**: Won't work (requires Python)
- ❌ **Monitor Beats (Historical Data)**: Won't work (requires Python)
- ✅ **Real-time Heartbeats (SSE)**: Should work (uses Socket.io client)
- ✅ **Monitor List**: Should work (uses Prometheus metrics API)
- ✅ **Monitor Status**: Should work (uses Prometheus metrics API)

## Recommended Solution

For full functionality, consider:

1. **Deploy to Render** (supports Python + Node.js)
2. **Or create a separate Python API service** on Render/Railway that handles monitor operations
3. **Or rewrite the Python scripts in TypeScript** using `socket.io-client` directly

## Quick Fix: Test Environment Variables

Create a test endpoint to verify environment variables are set:

Visit: `/api/uptime-kuma/test-auth` to check if variables are loaded correctly.

