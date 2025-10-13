# Deployment Guide for iAccessible Command Center

This guide covers deploying the iAccessible Command Center application to Render with both the Next.js frontend and the accessibility scanner service.

## Architecture Overview

The application consists of two services:
1. **Next.js Frontend** - Main application UI
2. **Scanner Service** - IBM accessibility-checker microservice (Docker)

## Prerequisites

- GitHub repository with the code
- Render account
- Docker Hub account (optional, for custom images)

## Deployment Options

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub**
2. **Connect to Render**:
   - Go to Render Dashboard
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select the `render.yaml` file
   - Click "Apply"

This will automatically create both services with proper networking.

### Option 2: Manual Service Creation

#### Step 1: Deploy Scanner Service

1. **Create New Web Service**:
   - Source: GitHub repository
   - Environment: Docker
   - Dockerfile Path: `scanner-service/Dockerfile`
   - Port: 4000

2. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=4000
   ```

3. **Deploy** and note the service URL (e.g., `https://your-scanner-service.onrender.com`)

#### Step 2: Deploy Next.js App

1. **Create New Web Service**:
   - Source: GitHub repository
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

2. **Environment Variables**:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_SCANNER_API_URL=https://your-scanner-service.onrender.com
   ```

3. **Deploy**

### Option 3: Single Docker Deployment

If you prefer a single container deployment:

1. **Create New Web Service**:
   - Source: GitHub repository
   - Environment: Docker
   - Dockerfile Path: `Dockerfile` (root directory)
   - Port: 3000

2. **Environment Variables**:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_SCANNER_API_URL=http://localhost:4000
   ```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SCANNER_API_URL` | URL of the scanner service | `https://scanner-service.onrender.com` |
| `NODE_ENV` | Environment mode | `production` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port for the service | `3000` (Next.js), `4000` (Scanner) |

## Service Configuration

### Next.js App Service
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check**: `/` (root path)
- **Port**: 3000

### Scanner Service
- **Dockerfile**: `scanner-service/Dockerfile`
- **Health Check**: `/health`
- **Port**: 4000

## Networking

- Services communicate via HTTP/HTTPS
- Render provides private networking between services
- CORS is configured in the scanner service for cross-origin requests

## Monitoring

- Health checks are configured for both services
- Scanner service: `GET /health`
- Next.js app: Root path `/`

## Troubleshooting

### Common Issues

1. **Scanner service not responding**:
   - Check if the service is running
   - Verify the `NEXT_PUBLIC_SCANNER_API_URL` environment variable
   - Check service logs for errors

2. **Build failures**:
   - Ensure all dependencies are in `package.json`
   - Check Node.js version compatibility
   - Verify Docker build context

3. **CORS errors**:
   - Scanner service has CORS enabled
   - Check if the frontend URL is allowed

### Logs

- Access logs through Render Dashboard
- Scanner service logs include scan details
- Next.js logs include API route errors

## Security Considerations

- Environment variables are encrypted in Render
- Services use HTTPS in production
- Security headers are configured in Next.js
- Scanner service runs as non-root user

## Scaling

- Both services can be scaled independently
- Scanner service may need more resources for heavy scanning
- Consider using Render's auto-scaling features

## Cost Optimization

- Use appropriate instance sizes
- Monitor resource usage
- Consider scheduled scaling for scanner service
- Use Render's free tier for development/testing
