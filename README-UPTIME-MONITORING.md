# Uptime Monitoring Integration

This document explains how to set up and use the Uptime Kuma integration for monitoring website uptime and availability in the iaccessible-cc Next.js application.

## Overview

The Uptime Monitoring Tool integrates Uptime Kuma (a self-hosted monitoring solution) to track website availability and response times. This integration:

- Automatically syncs domains from Operating Units to Uptime Kuma monitors
- Provides a custom dashboard to view monitor status and metrics
- Uses Uptime Kuma's Prometheus metrics API for real-time data
- Supports role-based access control (global_admin, operating_unit_admin, organization_admin)

## Quick Start

### Prerequisites

- Docker installed and running
- Node.js and npm installed
- Python 3.7+ installed (required for uptime-kuma-api wrapper)
- Uptime Kuma running on port 3003 (configurable)

### 1. Start Uptime Kuma with Docker

```bash
# Run Uptime Kuma in Docker
docker run -d \
  --name uptime-kuma \
  -p 3003:3001 \
  -v uptime-kuma:/app/data \
  --restart=unless-stopped \
  louislam/uptime-kuma:1

# Or use docker-compose (recommended)
docker-compose up -d uptime-kuma
```

**Note:** The container exposes Uptime Kuma on port 3003 (host) → 3001 (container runs on port 3001 separately)

### 2. Configure Uptime Kuma

1. **Access Uptime Kuma Web UI:**
   ```
   http://localhost:3003
   ```

2. **Complete initial setup:**
   - Create an admin account
   - Set your timezone and preferences

3. **Create an API Key:**
   - Navigate to **Settings** → **API Keys**
   - Click **Create API Key**
   - Name it (e.g., "iaccessible-cc-integration")
   - Copy the generated API key (starts with `uk1_`)

4. **Test the API connection:**
   ```bash
   # Test metrics endpoint (Basic Auth)
   curl -u ":YOUR_API_KEY" http://localhost:3003/metrics
   
   # Should return Prometheus format metrics
   ```

### 3. Install Python Dependencies

Install the Python wrapper for Uptime Kuma API:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Or install directly
pip install uptime-kuma-api
```

**Note:** Ensure Python 3.7+ is installed and accessible from your PATH.

### 4. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Uptime Kuma Configuration
UPTIME_KUMA_API_URL=http://localhost:3003
UPTIME_KUMA_USERNAME=admin
UPTIME_KUMA_PASSWORD=admin123

# Optional: API Key authentication (alternative to username/password)
UPTIME_KUMA_API_KEY=uk1_your_api_key_here

# Optional: For production deployments
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note:** The Python scripts will use either `UPTIME_KUMA_USERNAME`/`UPTIME_KUMA_PASSWORD` or `UPTIME_KUMA_API_KEY` for authentication. If both are provided, username/password takes precedence.

### 5. Start the Next.js Application

```bash
npm run dev
```

### 6. Access the Uptime Monitoring Dashboard

Navigate to: `http://localhost:3000/uptime-monitoring`

You should see:
- Statistics cards (Total, Up, Down, Pending monitors)
- Monitor list with status badges
- Sync button to sync domains from Operating Units

## Architecture

```
Next.js App (port 3000)
    ↓ HTTP API calls
Next.js API Routes (/api/uptime-kuma/*)
    ↓ Executes Python scripts via child_process
Python Scripts (uptime-kuma-api wrapper)
    ↓ Socket.io connection
Uptime Kuma (port 3003)
    ↓ Prometheus Metrics API
Monitor Data (JSON/Prometheus format)
    ↓ Parsed
UI Components (Dashboard)
```

### Key Components

1. **API Proxy** (`src/app/api/uptime-kuma/[...path]/route.ts`)
   - Routes requests to Uptime Kuma
   - Handles authentication (Basic Auth for `/metrics`, Bearer for others)
   - Manages CORS and error handling

2. **API Client** (`src/lib/uptime-kuma-api.ts`)
   - Fetches metrics from Uptime Kuma
   - Parses Prometheus format to TypeScript interfaces
   - Supports both client-side and server-side usage

2. **Python Integration** (`src/lib/uptime-kuma-python.ts`)
   - Executes Python scripts via Node.js child_process
   - Handles Python environment validation
   - Manages script execution and error handling

3. **Python Scripts** (`scripts/uptime-kuma/`)
   - `add_monitor.py` - Creates new monitors
   - `update_monitor.py` - Updates existing monitors
   - `delete_monitor.py` - Deletes monitors
   - Uses `uptime-kuma-api` wrapper for reliable Socket.io communication

4. **Sync Service** (`src/lib/uptime-sync-service.ts`)
   - Pulls domains from Operating Units API
   - Compares with existing Uptime Kuma monitors
   - Identifies domains needing monitoring

5. **UI Components** (`src/components/cc/uptime-monitoring/`)
   - `UptimeStatusBadge` - Status indicators
   - `MonitorCard` - Monitor information display
   - `SyncDialog` - Domain sync interface

6. **Dashboard Page** (`src/app/(cc)/uptime-monitoring/page.tsx`)
   - Main monitoring dashboard
   - Search and filter functionality
   - Statistics and monitor grid

## API Integration

### Endpoints

#### Get Monitors

```typescript
import { getMonitors } from '@/lib/uptime-kuma-api';

const monitors = await getMonitors();
// Returns: UptimeKumaMonitor[]
```

#### Get Metrics (Raw)

```typescript
import { getMetrics } from '@/lib/uptime-kuma-api';

const metrics = await getMetrics();
// Returns: string (Prometheus format)
```

#### Sync Domains

```typescript
// Via API endpoint
POST /api/uptime-kuma/sync
// Returns: SyncResult

// Or via service
import { syncOperatingUnitDomains } from '@/lib/uptime-sync-service';
const result = await syncOperatingUnitDomains();
```

### Data Structures

```typescript
interface UptimeKumaMonitor {
  id: number;
  name: string;
  url: string;
  type: 'http' | 'https' | 'tcp' | 'ping' | 'dns';
  status: 0 | 1 | 2; // where 0 = pending, 1 = up, 2 = down
  uptime?: number;
  avgResponseTime?: number;
  lastCheckTime?: number;
}

interface SyncResult {
  success: boolean;
  message: string;
  addedMonitors: string[];
  skippedMonitors: string[];
  errors: string[];
}
```

## Configuration

### Uptime Kuma Settings

- **Port**: 3003 (configurable via `UPTIME_KUMA_API_URL`)
- **Authentication**: API Key-based (Basic Auth for `/metrics`, Bearer for others)
- **Data Storage**: Docker volume `uptime-kuma` (persists across restarts)
- **Metrics Format**: Prometheus-compatible

### Next.js Integration

- **API Proxy**: `/api/uptime-kuma/*` routes to Uptime Kuma
- **Menu Access**: Available in "Reports & Dashboards" section
- **Permissions**: Requires `uptimeMonitoring` module permission
- **Roles**: `global_admin`, `operating_unit_admin`, `organization_admin`

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `UPTIME_KUMA_API_URL` | Uptime Kuma API base URL | `http://localhost:3003` | Yes |
| `UPTIME_KUMA_API_KEY` | API key for authentication | - | Yes |
| `NEXT_PUBLIC_APP_URL` | App URL for server-side requests | `http://localhost:3000` | No |

## Usage

### Syncing Domains

1. **Navigate to Uptime Monitoring Dashboard:**
   - Go to `/uptime-monitoring`
   - Click **"Sync Domains"** button

2. **Sync Process:**
   - The system fetches all Operating Units
   - Extracts unique domains from Operating Units
   - Compares with existing Uptime Kuma monitors
   - Shows preview of what will be synced

3. **Review Results:**
   - **Added Monitors**: New monitors created in Uptime Kuma
   - **Skipped Monitors**: Domains already being monitored
   - **Errors**: Any issues during sync

**Note:** Currently, the sync service identifies domains but doesn't automatically create monitors (requires Socket.io implementation for full monitor management).

### Monitoring Status

The dashboard displays:
- **Up** (Green): Monitor is healthy and responding
- **Down** (Red): Monitor detected an issue
- **Pending** (Yellow): Monitor status is unknown or initializing

### Filtering and Search

- **Search**: Filter monitors by name or URL
- **Status Filter**: View monitors by status (All, Up, Down, Pending)
- **Refresh**: Manually refresh monitor data

## Development

### Testing the Integration

```bash
# 1. Test Uptime Kuma metrics endpoint
curl -u ":YOUR_API_KEY" http://localhost:3003/metrics

# 2. Test Next.js API proxy
curl http://localhost:3000/api/uptime-kuma/metrics

# 3. Test sync endpoint
curl -X POST http://localhost:3000/api/uptime-kuma/sync

# 4. Test sync status (what would be synced)
curl http://localhost:3000/api/uptime-kuma/sync
```

### Creating Test Monitors in Uptime Kuma

For testing purposes, create monitors manually in Uptime Kuma:

1. Access Uptime Kuma UI: `http://localhost:3003`
2. Click **"Add New Monitor"**
3. Fill in:
   - **Name**: Test Monitor
   - **Type**: HTTP(s) - Keyword
   - **URL**: `https://example.com`
   - **Keyword**: (optional)
4. Click **"Save"**

### Viewing Metrics

Metrics are available in Prometheus format at:
```
http://localhost:3003/metrics
```

Example metrics:
```
monitor_status{monitor_id="1",monitor_name="Example",monitor_type="http",monitor_url="https://example.com"} 1
monitor_response_time{monitor_id="1"} 234.5
```

### Debugging

1. **Check Uptime Kuma logs:**
   ```bash
   docker logs uptime-kuma
   ```

2. **Check Next.js API proxy:**
   - Browser DevTools → Network tab
   - Look for `/api/uptime-kuma/*` requests
   - Check request/response headers

3. **Verify environment variables:**
   ```bash
   # In your terminal
   echo $UPTIME_KUMA_API_URL
   echo $UPTIME_KUMA_API_KEY
   ```

## Troubleshooting

### Common Issues

#### 1. **"Failed to load monitors" Error**

**Symptoms:** Dashboard shows error message

**Solutions:**
- Verify Uptime Kuma is running: `docker ps | grep uptime-kuma`
- Check API URL in `.env.local` matches Uptime Kuma port
- Test direct connection: `curl http://localhost:3003/metrics`
- Verify API key is correct in `.env.local`

#### 2. **401 Unauthorized Errors**

**Symptoms:** API requests return 401 status

**Solutions:**
- Regenerate API key in Uptime Kuma Settings
- Update `.env.local` with new API key
- Restart Next.js dev server
- Verify authentication method (Basic Auth for `/metrics`)

#### 3. **No Monitors Appearing**

**Symptoms:** Dashboard shows "No monitors found"

**Solutions:**
- Create at least one monitor manually in Uptime Kuma UI
- Verify monitors are enabled in Uptime Kuma
- Check if metrics endpoint returns data
- Try syncing domains from Operating Units

#### 4. **Sync Not Working**

**Symptoms:** Sync completes but no monitors are created

**Solutions:**
- This is expected - full monitor creation requires Socket.io client
- Check sync result shows "Added Monitors" (they are logged but not created)
- Verify Operating Units have domains configured
- Check browser console for API errors

#### 5. **CORS Errors**

**Symptoms:** Browser console shows CORS errors

**Solutions:**
- Ensure using Next.js API proxy (`/api/uptime-kuma/*`)
- Don't call Uptime Kuma directly from client-side code
- Verify API proxy route is working

### Performance Tips

- Uptime Kuma caches metrics, so frequent refreshes may not show immediate updates
- Use `docker-compose up -d` to run Uptime Kuma in background
- Monitor Docker volume size (`uptime-kuma` volume stores data)
- Limit number of monitors if experiencing performance issues

## Security Considerations

### API Key Management

- **Never commit API keys to Git**
- Use environment variables for all sensitive data
- Rotate API keys periodically
- Use different API keys for development/production

### Network Security

- Uptime Kuma should be accessible only within your network in production
- Use HTTPS in production environments
- Consider using reverse proxy (nginx, Traefik) for production

### Access Control

- Uptime Monitoring Tool respects role-based permissions
- Only users with `uptimeMonitoring` permission can access
- Monitor creation/modification requires appropriate roles

## Future Enhancements

### Planned Features

1. **Socket.io Client Integration**
   - Real-time monitor updates
   - Automatic monitor creation from sync
   - Live status updates without refresh

2. **Enhanced Monitoring**
   - Custom alert thresholds
   - Notification integrations
   - Historical uptime charts

3. **Advanced Sync Options**
   - Scheduled automatic syncs
   - Filter domains by Operating Unit
   - Bulk monitor management

4. **Dashboard Improvements**
   - Monitor detail pages
   - Response time graphs
   - Uptime percentage tracking
   - Export capabilities

### Known Limitations

- Monitor creation requires manual setup or Socket.io implementation
- Prometheus metrics parsing may not capture all monitor properties
- No real-time updates (requires polling or Socket.io)
- Sync operation is read-only for now

## Additional Resources

- [Uptime Kuma Documentation](https://github.com/louislam/uptime-kuma/wiki)
- [Uptime Kuma API Reference](https://github.com/louislam/uptime-kuma/blob/master/extra/api-docs.md)
- [Prometheus Metrics Format](https://prometheus.io/docs/instrumenting/exposition_formats/)

## Support

For issues or questions:
1. Check this documentation first
2. Review Uptime Kuma logs
3. Check Next.js console and browser DevTools
4. Verify environment configuration

---

**Last Updated:** Integration completed with full dashboard, sync service, and API proxy functionality.
