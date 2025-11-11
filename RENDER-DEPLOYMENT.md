# Render Deployment Guide for iaccessible-cc

This guide will help you deploy the iaccessible-cc Next.js application to Render, which supports both Node.js and Python (required for Uptime Kuma integration).

## Prerequisites

- Render account (sign up at https://render.com)
- GitHub repository with your code
- Python 3.7+ (will be installed automatically on Render)

## Quick Deploy (Using Blueprint)

### Option 1: Deploy from Blueprint (Recommended)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **In Render Dashboard:**
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select the repository: `osglvelarde/iaccessible-cc`
   - Render will detect `render.yaml` and configure the service automatically
   - Review the configuration and click **"Apply"**

3. **Set Environment Variables:**
   - Go to your service → **Environment** tab
   - Set `UPTIME_KUMA_PASSWORD` manually:
     - Key: `UPTIME_KUMA_PASSWORD`
     - Value: `iAccessible-Granite-Field-47*`
     - Click **"Save Changes"**

4. **Deploy:**
   - Render will automatically start building and deploying
   - Monitor the build logs for any issues

### Option 2: Manual Deployment

1. **Create a New Web Service:**
   - In Render Dashboard, click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Select the repository: `osglvelarde/iaccessible-cc`

2. **Configure the Service:**
   - **Name**: `iaccessible-cc`
   - **Environment**: `Node`
   - **Region**: Choose your preferred region (Oregon recommended for US)
   - **Branch**: `main`
   - **Root Directory**: (leave empty, uses root)
   - **Plan**: `Starter` ($7/month - includes persistent disk)

3. **Build & Start Commands:**
   ```
   Build Command:
   pip3 install -r requirements.txt && pnpm install && npm run build
   
   Start Command:
   npm start
   ```

4. **Environment Variables:**
   Add the following environment variables in the **Environment** tab:
   ```
   UPTIME_KUMA_API_URL=https://uptime-monitoring-tool.onrender.com
   UPTIME_KUMA_USERNAME=iaccessible-admin
   UPTIME_KUMA_PASSWORD=iAccessible-Granite-Field-47*
   UPTIME_KUMA_API_KEY=uk1_ovykShADuMK42QsCudzJ_S2IjPl9AKAnHrDGEMzb
   NODE_ENV=production
   ```

5. **Persistent Disk (Required for File Storage):**
   - Go to **Disks** tab
   - Click **"Link New Disk"**
   - **Name**: `iaccessible-cc-data`
   - **Mount Path**: `/opt/render/project/src/users-roles-data`
   - **Size**: 1 GB
   - Click **"Link Disk"**

6. **Deploy:**
   - Click **"Create Web Service"**
   - Render will start building and deploying

## Build Configuration

### Build Process

The build process on Render:
1. Installs Python dependencies (`requirements.txt`)
2. Installs Node.js dependencies (`pnpm install`)
3. Builds the Next.js application (`npm run build`)

### Python Installation

Render automatically provides Python 3.9+ in the build environment. The build script will:
- Install `uptime-kuma-api` and other Python dependencies
- Make Python available for the Python scripts in `scripts/uptime-kuma/`

## Environment Variables

### Required Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `UPTIME_KUMA_API_URL` | `https://uptime-monitoring-tool.onrender.com` | Uptime Kuma API endpoint |
| `UPTIME_KUMA_USERNAME` | `iaccessible-admin` | Username for authentication |
| `UPTIME_KUMA_PASSWORD` | `iAccessible-Granite-Field-47*` | Password (set manually for security) |
| `UPTIME_KUMA_API_KEY` | `uk1_ovykShADuMK42QsCudzJ_S2IjPl9AKAnHrDGEMzb` | API key for metrics endpoint |
| `NODE_ENV` | `production` | Node.js environment |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Public URL of your app | Auto-detected by Render |
| `PORT` | Port to run on | 10000 (Render default) |

## Persistent Disk Configuration

The application uses file-based storage for:
- User/role data (`users-roles-data/`)
- Scanner results (`scanner-results/`)
- Manual testing results (`manual-testing-results/`)

**Important:** You must configure a persistent disk in Render to preserve this data across deployments.

### Disk Setup

1. Go to your service → **Disks** tab
2. Click **"Link New Disk"**
3. Configure:
   - **Name**: `iaccessible-cc-data`
   - **Mount Path**: `/opt/render/project/src/users-roles-data`
   - **Size**: 1 GB (increase if needed)
4. Click **"Link Disk"**

**Note:** The mount path should match where your application expects to write data. You may need to adjust the `DATA_DIR` paths in your API routes if the mount path differs.

## Post-Deployment

### 1. Verify Deployment

1. Visit your Render service URL (e.g., `https://iaccessible-cc.onrender.com`)
2. Check that the application loads correctly
3. Test login functionality

### 2. Test Uptime Kuma Integration

1. Visit: `https://your-app.onrender.com/api/uptime-kuma/test-auth`
2. Should return connection status and environment variable check
3. Navigate to `/uptime-monitoring` page
4. Try creating a monitor (should work with Python scripts)

### 3. Check Logs

Monitor the service logs in Render Dashboard:
- **Logs** tab shows real-time application logs
- Look for Python script execution logs
- Check for any connection errors

## Troubleshooting

### Build Fails

**Issue:** Build fails with Python errors
- **Solution:** Check that `requirements.txt` is in the root directory
- Verify Python version compatibility (Render uses Python 3.9+)

**Issue:** Build fails with pnpm errors
- **Solution:** Ensure `pnpm-lock.yaml` is committed to the repository
- Try using `npm install` instead if pnpm causes issues

### Python Scripts Don't Work

**Issue:** "Python is not installed" error
- **Solution:** Python should be available automatically on Render
- Check build logs to see if Python dependencies installed correctly
- Verify `requirements.txt` is valid

**Issue:** "Module not found" for uptime-kuma-api
- **Solution:** 
  - Check build logs - Python dependencies should install during build (system-wide, without `--user` flag)
  - A runtime check script (`scripts/check-python-deps.sh`) automatically installs packages if missing at startup
  - Check service startup logs for Python dependency installation messages
  - Verify `PYTHONPATH` environment variable is set correctly in Render dashboard
  - If issue persists, manually trigger a redeploy to ensure packages are installed

### File Storage Issues

**Issue:** Data not persisting
- **Solution:** Ensure persistent disk is configured and mounted correctly
- Check mount path matches your application's expected paths
- Verify disk is linked to the service

### Connection to Uptime Kuma Fails

**Issue:** Timeout or connection errors
- **Solution:** 
  - Verify environment variables are set correctly
  - Check that Uptime Kuma service on Render is running
  - Test connection: `https://your-app.onrender.com/api/uptime-kuma/test-auth`

## Cost Estimate

- **Starter Plan**: $7/month
  - Includes: 512 MB RAM, 0.5 CPU, Persistent Disk
  - Suitable for development and small production workloads

- **Standard Plans**: $25+/month
  - For higher traffic or more resources

## Updating the Deployment

After making code changes:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Render Auto-Deploy:**
   - Render automatically detects the push
   - Triggers a new build and deployment
   - Monitor the **Events** tab for deployment status

3. **Manual Deploy:**
   - Go to your service → **Manual Deploy** tab
   - Click **"Deploy latest commit"**

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Next.js on Render](https://render.com/docs/deploy-nextjs)
- [Python on Render](https://render.com/docs/python)
- [Persistent Disks on Render](https://render.com/docs/disks)

---

**Last Updated:** Render deployment configuration prepared with Python support and persistent disk setup.

