# Render Deployment Checklist

Follow these steps to deploy iaccessible-cc to Render:

## Pre-Deployment

- [ ] Code is pushed to GitHub repository
- [ ] `render.yaml` is in the root directory
- [ ] `requirements.txt` is in the root directory
- [ ] `pnpm-lock.yaml` is committed
- [ ] All environment variables are documented

## Step 1: Create Render Account & Connect GitHub

- [ ] Sign up at https://render.com (or log in)
- [ ] Connect your GitHub account
- [ ] Authorize Render to access your repositories

## Step 2: Deploy Using Blueprint

- [ ] Click **"New +"** → **"Blueprint"**
- [ ] Select repository: `osglvelarde/iaccessible-cc`
- [ ] Review the detected configuration from `render.yaml`
- [ ] Click **"Apply"** to create the service

## Step 3: Configure Environment Variables

After the service is created:

- [ ] Go to your service → **Environment** tab
- [ ] Verify these variables are set:
  - [ ] `UPTIME_KUMA_API_URL` = `https://uptime-monitoring-tool.onrender.com`
  - [ ] `UPTIME_KUMA_USERNAME` = `iaccessible-admin`
  - [ ] `UPTIME_KUMA_PASSWORD` = `iAccessible-Granite-Field-47*` (set manually)
  - [ ] `UPTIME_KUMA_API_KEY` = `uk1_ovykShADuMK42QsCudzJ_S2IjPl9AKAnHrDGEMzb`
  - [ ] `NODE_ENV` = `production`
- [ ] Click **"Save Changes"**

## Step 4: Configure Persistent Disk

**Important:** The app uses file-based storage that needs to persist.

- [ ] Go to your service → **Disks** tab
- [ ] Click **"Link New Disk"**
- [ ] Configure:
  - **Name**: `iaccessible-cc-data`
  - **Mount Path**: `/opt/render/project/src/users-roles-data`
  - **Size**: 1 GB
- [ ] Click **"Link Disk"**
- [ ] Wait for disk to be linked (may take a minute)

## Step 5: Monitor First Deployment

- [ ] Go to **Events** or **Logs** tab
- [ ] Watch the build process:
  - [ ] Python dependencies installing
  - [ ] Node.js dependencies installing
  - [ ] Next.js build completing
- [ ] Check for any errors in build logs
- [ ] Wait for deployment to complete (usually 5-10 minutes)

## Step 6: Verify Deployment

- [ ] Visit your service URL (e.g., `https://iaccessible-cc.onrender.com`)
- [ ] Test the homepage loads
- [ ] Test login functionality
- [ ] Visit `/api/uptime-kuma/test-auth` to verify environment variables
- [ ] Check that connection to Uptime Kuma works

## Step 7: Test Uptime Monitoring

- [ ] Navigate to `/uptime-monitoring` page
- [ ] Verify monitors list loads (from Prometheus metrics)
- [ ] Try creating a new monitor (tests Python scripts)
- [ ] Check that real-time heartbeats work (SSE connection)

## Troubleshooting

### Build Fails

**Check:**
- [ ] Build logs for Python installation errors
- [ ] `requirements.txt` is in root directory
- [ ] `pnpm-lock.yaml` is committed
- [ ] Node.js version compatibility (Render uses Node 20+)

**Common Issues:**
- Python not found → Should be available automatically on Render
- pnpm errors → Try changing build command to use `npm install` instead
- Build timeout → Increase build timeout in service settings

### Python Scripts Don't Work

**Check:**
- [ ] Build logs show Python dependencies installed
- [ ] Runtime logs show Python available
- [ ] Environment variables are set correctly
- [ ] Test endpoint: `/api/uptime-kuma/test-auth`

**Debug:**
- Check service logs for Python errors
- Verify `uptime-kuma-api` package is installed
- Test Python availability: Check logs for "Python process spawned"

### File Storage Issues

**Check:**
- [ ] Persistent disk is linked to service
- [ ] Disk mount path is correct
- [ ] Application has write permissions
- [ ] Disk has available space

**Note:** If data directories don't persist, you may need to adjust the mount path or create symlinks.

## Post-Deployment Maintenance

- [ ] Set up auto-deploy from main branch (default)
- [ ] Monitor service health and logs
- [ ] Set up alerts for service downtime (optional)
- [ ] Review disk usage periodically
- [ ] Keep environment variables secure

## Cost Monitoring

- [ ] Monitor service usage in Render Dashboard
- [ ] Check disk usage (1 GB should be sufficient initially)
- [ ] Upgrade plan if needed (Starter → Standard for more resources)

---

**Ready to Deploy?** Follow the steps above and refer to `RENDER-DEPLOYMENT.md` for detailed instructions.

