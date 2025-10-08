const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AccessibilityScanner = require('./scanner');
const ResultTransformer = require('./transformer');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize scanner
const scanner = new AccessibilityScanner();

// Ensure results directory exists
const RESULTS_DIR = path.join(__dirname, 'scanner-results');
fs.mkdir(RESULTS_DIR, { recursive: true }).catch(console.error);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'accessibility-scanner'
  });
});

// Main scan endpoint
app.post('/scan', async (req, res) => {
  const scanId = uuidv4();
  const startTime = Date.now();
  
  try {
    const { url, options = {} } = req.body;
    
    // Validate input
    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        scanId,
        status: 'failed'
      });
    }

    if (!scanner.isValidUrl(url)) {
      return res.status(400).json({
        error: 'Invalid URL format',
        scanId,
        status: 'failed'
      });
    }

    console.log(`[${scanId}] Starting scan for: ${url}`);

    // Perform the scan
    const ibmReport = await scanner.scanUrl(url, options);
    
    // Transform results to UI format
    const transformedResults = ResultTransformer.transformToUIFormat(ibmReport, url);
    
    // Add scan metadata
    const scanResult = {
      scanId,
      ...transformedResults,
      scanDuration: Date.now() - startTime,
      rawReport: ibmReport // Include raw IBM report for debugging
    };

    // Save results to file
    const filename = `${scanId}.json`;
    const filepath = path.join(RESULTS_DIR, filename);
    await fs.writeFile(filepath, JSON.stringify(scanResult, null, 2));

    console.log(`[${scanId}] Scan completed successfully in ${scanResult.scanDuration}ms`);

    // Return results (exclude raw report for response)
    const { rawReport, ...responseData } = scanResult;
    res.json(responseData);

  } catch (error) {
    console.error(`[${scanId}] Scan failed:`, error);
    
    const errorResult = {
      scanId,
      url: req.body.url,
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: error.message,
      scanDuration: Date.now() - startTime
    };

    // Save error result
    const filename = `${scanId}_error.json`;
    const filepath = path.join(RESULTS_DIR, filename);
    await fs.writeFile(filepath, JSON.stringify(errorResult, null, 2));

    res.status(500).json(errorResult);
  }
});

// Get scan history endpoint
app.get('/scans', async (req, res) => {
  try {
    const files = await fs.readdir(RESULTS_DIR);
    const scanFiles = files.filter(file => file.endsWith('.json') && !file.includes('_error'));
    
    const scans = await Promise.all(
      scanFiles.map(async (file) => {
        try {
          const filepath = path.join(RESULTS_DIR, file);
          const content = await fs.readFile(filepath, 'utf8');
          const scanData = JSON.parse(content);
          
          return {
            id: scanData.scanId,
            url: scanData.url,
            date: scanData.timestamp,
            status: scanData.status,
            accessibilityScore: scanData.summary?.accessibilityScore || null,
            seoScore: scanData.summary?.seoScore || null,
            readabilityScore: scanData.summary?.readabilityScore || null,
            totalIssues: scanData.summary?.totalIssues || 0
          };
        } catch (error) {
          console.error(`Error reading scan file ${file}:`, error);
          return null;
        }
      })
    );

    // Filter out null results and sort by date (newest first)
    const validScans = scans.filter(scan => scan !== null)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(validScans);
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
});

// Get specific scan result
app.get('/scans/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    const filename = `${scanId}.json`;
    const filepath = path.join(RESULTS_DIR, filename);
    
    const content = await fs.readFile(filepath, 'utf8');
    const scanData = JSON.parse(content);
    
    // Remove raw report for API response
    const { rawReport, ...responseData } = scanData;
    res.json(responseData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Scan not found' });
    } else {
      console.error(`Error fetching scan ${req.params.scanId}:`, error);
      res.status(500).json({ error: 'Failed to fetch scan result' });
    }
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down scanner service...');
  await scanner.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down scanner service...');
  await scanner.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Accessibility Scanner Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Scan endpoint: POST http://localhost:${PORT}/scan`);
});

module.exports = app;
