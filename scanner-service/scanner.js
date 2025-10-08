const aChecker = require("accessibility-checker");
const puppeteer = require("puppeteer");

class AccessibilityScanner {
  constructor() {
    this.browser = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize Puppeteer browser
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      // Initialize accessibility-checker
      await aChecker.getConfig();
      
      this.isInitialized = true;
      console.log('Accessibility scanner initialized successfully');
    } catch (error) {
      console.error('Failed to initialize accessibility scanner:', error);
      throw error;
    }
  }

  async scanUrl(url, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    let page = null;
    try {
      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL provided');
      }

      console.log(`Starting scan for URL: ${url}`);

      // Create new page
      page = await this.browser.newPage();
      
      // Set viewport and user agent
      await page.setViewport({ width: 1280, height: 720 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      // Navigate to the page
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Perform accessibility scan
      const result = await aChecker.getCompliance(page, `scan_${Date.now()}`);
      
      if (!result || !result.report) {
        throw new Error('Failed to generate accessibility report');
      }

      console.log(`Scan completed for URL: ${url}`);
      return result.report;

    } catch (error) {
      console.error(`Scan failed for URL ${url}:`, error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      await aChecker.close();
      this.isInitialized = false;
      console.log('Accessibility scanner closed');
    } catch (error) {
      console.error('Error closing accessibility scanner:', error);
    }
  }
}

module.exports = AccessibilityScanner;
