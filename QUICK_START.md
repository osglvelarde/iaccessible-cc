# Quick Start Guide

## 🚀 Deploy to Render (Fastest Method)

### 1. One-Click Deployment with Blueprint

1. **Push your code to GitHub** (if not already done)
2. **Go to [Render Dashboard](https://dashboard.render.com)**
3. **Click "New +" → "Blueprint"**
4. **Connect your GitHub repository**
5. **Select the `render.yaml` file**
6. **Click "Apply"**

That's it! Render will automatically:
- Deploy both services (Next.js app + Scanner service)
- Configure networking between them
- Set up environment variables
- Provide you with URLs for both services

### 2. Manual Deployment (Alternative)

If you prefer manual control:

#### Deploy Scanner Service First:
1. **New Web Service** → **Docker**
2. **Dockerfile Path**: `scanner-service/Dockerfile`
3. **Port**: `4000`
4. **Deploy** and copy the service URL

#### Deploy Next.js App:
1. **New Web Service** → **Node**
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`
4. **Environment Variable**: `NEXT_PUBLIC_SCANNER_API_URL` = your scanner service URL
5. **Deploy**

## 🏠 Local Development

### Quick Setup:
```bash
# Run the setup script
./scripts/setup-env.sh  # Linux/Mac
# or
scripts/setup-env.bat   # Windows

# Start scanner service
cd scanner-service && npm start

# In another terminal, start the app
npm run dev
```

### Manual Setup:
```bash
# Install dependencies
npm install
cd scanner-service && npm install && cd ..

# Create environment file
echo "NEXT_PUBLIC_SCANNER_API_URL=http://localhost:4000" > .env.local

# Start services
cd scanner-service && npm start &  # Background
npm run dev                        # Foreground
```

## 🔧 Environment Variables

| Variable | Local | Production |
|----------|-------|------------|
| `NEXT_PUBLIC_SCANNER_API_URL` | `http://localhost:4000` | `https://your-scanner-service.onrender.com` |

## 📱 Access Your App

- **Local**: http://localhost:3000
- **Production**: https://your-app-name.onrender.com

## 🆘 Troubleshooting

### Scanner Service Issues:
- Check if port 4000 is available
- Verify Docker is running (for local development)
- Check service logs in Render dashboard

### App Not Loading:
- Verify `NEXT_PUBLIC_SCANNER_API_URL` is set correctly
- Check browser console for CORS errors
- Ensure scanner service is running and accessible

### Build Failures:
- Run `npm install` in both root and scanner-service directories
- Check Node.js version (requires 18+)
- Verify all dependencies are installed

## 📊 Monitoring

- **Health Check**: `https://your-app.onrender.com/`
- **Scanner Health**: `https://your-scanner.onrender.com/health`
- **Logs**: Available in Render dashboard for each service

## 💡 Pro Tips

1. **Use the Blueprint method** for fastest deployment
2. **Monitor resource usage** in Render dashboard
3. **Set up custom domains** for production use
4. **Use environment variables** for different environments
5. **Check logs regularly** for any issues

## 🆘 Need Help?

- Check the full [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions
- Review service logs in Render dashboard
- Ensure all environment variables are set correctly
