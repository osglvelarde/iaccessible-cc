# Accessibility Scanner Service

A Dockerized Node.js microservice that performs accessibility scanning using IBM's accessibility-checker with Puppeteer.

## Features

- **Webpage Scanning**: Scan any URL for accessibility issues
- **IBM Accessibility Checker**: Uses IBM's enterprise-grade accessibility testing engine
- **Puppeteer Integration**: Headless Chrome browser automation for accurate scanning
- **REST API**: Simple HTTP endpoints for integration
- **Result Storage**: Saves scan results locally as JSON files
- **Docker Support**: Fully containerized with all dependencies

## API Endpoints

### POST /scan
Submit a URL for accessibility scanning.

**Request:**
```json
{
  "url": "https://example.com",
  "options": {
    "policies": ["IBM_Accessibility", "WCAG_2_1"],
    "scanDepth": "homepage",
    "includeExternal": false
  }
}
```

**Response:**
```json
{
  "scanId": "uuid",
  "url": "https://example.com",
  "timestamp": "2024-01-15T10:30:00Z",
  "status": "completed",
  "summary": {
    "accessibilityScore": 85,
    "totalIssues": 12,
    "violations": 3,
    "potentialViolations": 9
  },
  "issues": [
    {
      "id": 1,
      "type": "WCAG",
      "severity": "critical",
      "description": "Missing alt text on images",
      "location": "img.hero-banner",
      "details": "<img src=\"hero.jpg\">"
    }
  ]
}
```

### GET /scans
Get scan history.

### GET /scans/:scanId
Get specific scan result.

### GET /health
Health check endpoint.

## Running the Service

### Using Docker Compose (Recommended)

```bash
# Start the scanner service
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### Manual Docker Build

```bash
# Build the image
docker build -t accessibility-scanner ./scanner-service

# Run the container
docker run -p 4000:4000 -v $(pwd)/scanner-results:/app/scanner-results accessibility-scanner
```

### Local Development

```bash
cd scanner-service
npm install
npm start
```

## Configuration

The service uses `.achecker.yml` for IBM accessibility-checker configuration:

- **Policies**: IBM_Accessibility, WCAG_2_1
- **Output Format**: JSON
- **Violation Levels**: violation, potentialviolation
- **Report Levels**: All levels including recommendations

## Environment Variables

- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 4000)
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: Skip Chromium download (set to true in Docker)
- `PUPPETEER_EXECUTABLE_PATH`: Path to Chromium executable

## File Structure

```
scanner-service/
├── server.js          # Express server
├── scanner.js         # IBM checker integration
├── transformer.js     # Result transformation
├── package.json       # Dependencies
├── .achecker.yml      # IBM checker config
├── Dockerfile         # Docker configuration
└── README.md          # This file
```

## Integration with Next.js

The service is designed to work with the Next.js frontend:

1. Frontend calls `POST /scan` with URL
2. Service performs accessibility scan
3. Results are transformed to match UI format
4. Results are saved locally and returned to frontend
5. Frontend displays results in existing UI components

## Error Handling

- **400**: Invalid URL or missing parameters
- **500**: Scanner/Puppeteer errors
- **404**: Scan not found (for GET requests)

All errors include descriptive messages and scan IDs for debugging.

## Security

- Runs as non-root user in Docker
- Input validation for URLs
- CORS enabled for frontend integration
- No sensitive data in logs

## Performance

- Single browser instance reused across scans
- Results cached locally
- Graceful shutdown handling
- Health checks for monitoring
