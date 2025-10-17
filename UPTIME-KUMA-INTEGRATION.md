# Uptime Kuma Integration Guide

## Current Implementation

The uptime monitoring module currently uses **mock data** for demonstration purposes. This is because Uptime Kuma uses **Socket.io** for real-time communication, not REST API endpoints.

## Why Mock Data?

Uptime Kuma's architecture is designed around real-time communication via Socket.io, which requires:
- Persistent WebSocket connections
- Real-time event handling
- Authentication via Socket.io events
- Complex state management for real-time updates

## REST API Limitations

Uptime Kuma's REST API is limited to:
- Push monitors (`/api/push/:pushToken`)
- Status badges (`/api/badge/:id/status`)
- Public status pages (`/api/status-page/:slug`)
- Prometheus metrics (`/metrics`)

**It does NOT provide REST endpoints for:**
- Listing monitors
- Creating monitors
- Deleting monitors
- Getting monitor metrics
- Real-time status updates

## Socket.io Integration Requirements

To integrate with real Uptime Kuma data, you would need to implement:

### 1. Socket.io Client
```bash
npm install socket.io-client
```

### 2. Connection & Authentication
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Authenticate
socket.emit('login', { 
  username: 'admin', 
  password: 'password' 
}, (res) => {
  if (res.ok) {
    console.log('Authenticated');
  }
});
```

### 3. Real-time Event Handling
```typescript
// Listen for monitor list updates
socket.on('monitorList', (monitors) => {
  // Handle monitor data
});

// Listen for real-time status updates
socket.on('heartbeat', (heartbeat) => {
  // Handle status changes
});

// Listen for uptime updates
socket.on('uptime', (data) => {
  // Handle uptime percentage changes
});
```

### 4. Monitor Management Commands
```typescript
// Create monitor
socket.emit('add', monitorData, (res) => {
  if (res.ok) {
    console.log('Monitor created:', res.monitorID);
  }
});

// Delete monitor
socket.emit('deleteMonitor', monitorID, (res) => {
  if (res.ok) {
    console.log('Monitor deleted');
  }
});

// Get monitor details
socket.emit('getMonitor', monitorID, (res) => {
  if (res.ok) {
    console.log('Monitor data:', res.monitor);
  }
});
```

## Current Demo Features

The current implementation provides a fully functional demo with:

✅ **Mock Data Integration**
- Realistic monitor data with different statuses
- Uptime percentages and response times
- Timestamp information

✅ **Full UI Functionality**
- Create new monitors
- View monitor list with status indicators
- Delete monitors with confirmation
- Auto-refresh capabilities
- Permission-based access control

✅ **Production-Ready Architecture**
- Proper error handling
- Type safety with TypeScript
- Server-side API routes
- Client-side state management

## Next Steps for Production

1. **Implement Socket.io Client**
   - Create a persistent connection service
   - Handle authentication and reconnection
   - Implement real-time event listeners

2. **State Management**
   - Replace mock data with real Socket.io data
   - Handle real-time updates in the UI
   - Implement proper error handling for connection issues

3. **Authentication Integration**
   - Use Uptime Kuma credentials from environment
   - Handle authentication failures gracefully
   - Implement token-based authentication if available

4. **Real-time Updates**
   - Update monitor status in real-time
   - Show live uptime percentages
   - Display current response times

## Files to Modify for Real Integration

- `src/lib/kumaClient.ts` - Replace mock data with Socket.io client
- `src/app/(cc)/reports/monitoring/page.tsx` - Add real-time update handling
- `src/components/cc/MonitorTable.tsx` - Handle live status updates
- Add new environment variables for Uptime Kuma credentials

## Benefits of Current Approach

1. **Immediate Functionality** - Users can test the UI and features right away
2. **Production Architecture** - Code structure is ready for real integration
3. **No Dependencies** - No need for Socket.io client or complex state management
4. **Easy Testing** - Mock data makes testing and development easier
5. **Clear Documentation** - Well-documented integration requirements

The current implementation provides a solid foundation for future Socket.io integration while delivering immediate value through a fully functional demo.
