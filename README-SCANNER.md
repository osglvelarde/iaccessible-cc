# Accessibility Scanner Integration

This document explains how to use the dockerized accessibility scanner service with the iaccessible-cc Next.js application.

## Quick Start

1. **Start the scanner service:**
   ```bash
   docker-compose up --build
   ```

2. **Start the Next.js app:**
   ```bash
   npm run dev
   ```

3. **Open the scanner page:**
   Navigate to `http://localhost:3000/scan/ad-hoc`

4. **Test a scan:**
   - Enter a URL (e.g., `https://example.com`)
   - Click "Submit Scan"
   - View results in the UI

## Architecture

```
Next.js App (port 3000)
    ↓ HTTP API calls
Scanner Service (port 4000)
    ↓ Puppeteer + IBM Checker
Webpage Analysis
    ↓ Results
scanner-results/*.json
```

## API Integration

The Next.js app communicates with the scanner service via:

- `src/lib/scanner-api.ts` - API client functions
- `src/app/(cc)/scan/ad-hoc/page.tsx` - UI integration

### Key Functions

- `scanUrl(url, options)` - Submit URL for scanning
- `getScanHistory()` - Retrieve scan history
- `getScanResult(scanId)` - Get specific scan result

## Configuration

### Scanner Service
- **Port**: 4000
- **Policies**: IBM_Accessibility, WCAG_2_1
- **Storage**: Local JSON files in `scanner-results/`
- **Browser**: Headless Chrome via Puppeteer

### Next.js Integration
- **API Base URL**: `http://localhost:4000`
- **Error Handling**: Toast notifications
- **Loading States**: Progress indicators
- **Result Display**: Existing UI components

## Development

### Testing the Scanner Service

```bash
# Health check
curl http://localhost:4000/health

# Test scan
curl -X POST http://localhost:4000/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Viewing Results

Scan results are saved in `scanner-results/` directory:
- `{scanId}.json` - Successful scans
- `{scanId}_error.json` - Failed scans

### Debugging

Check Docker logs:
```bash
docker-compose logs scanner
```

## Troubleshooting

### Common Issues

1. **Scanner service not starting:**
   - Check Docker is running
   - Verify port 4000 is available
   - Check Docker logs for errors

2. **Scan failures:**
   - Verify URL is accessible
   - Check Puppeteer/Chrome dependencies
   - Review scanner service logs

3. **CORS errors:**
   - Ensure scanner service is running on port 4000
   - Check CORS configuration in server.js

4. **Results not displaying:**
   - Verify API response format
   - Check browser console for errors
   - Ensure UI components are properly connected

### Performance Tips

- Scanner service reuses browser instance
- Results are cached locally
- Use `docker-compose up -d` for background operation
- Monitor disk space for result files

## Future Enhancements

- PostgreSQL database integration
- Real-time progress updates via WebSocket
- PDF report generation
- Batch scanning capabilities
- Advanced filtering and search
