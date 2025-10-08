#!/usr/bin/env node

/**
 * Simple test script for the accessibility scanner service
 * Run this after starting the scanner service with: docker-compose up --build
 */

const testUrl = process.argv[2] || 'https://example.com';

async function testScanner() {
  console.log('🧪 Testing Accessibility Scanner Service');
  console.log('=====================================');
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:4000/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check passed:', healthData.status);
    
    // Test scan endpoint
    console.log(`\n2. Testing scan endpoint with URL: ${testUrl}`);
    const scanResponse = await fetch('http://localhost:4000/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: testUrl,
        options: {
          policies: ['IBM_Accessibility', 'WCAG_2_1'],
          scanDepth: 'homepage'
        }
      })
    });
    
    if (!scanResponse.ok) {
      const errorData = await scanResponse.json();
      throw new Error(`Scan failed: ${errorData.error}`);
    }
    
    const scanData = await scanResponse.json();
    console.log('✅ Scan completed successfully!');
    console.log(`   Scan ID: ${scanData.scanId}`);
    console.log(`   URL: ${scanData.url}`);
    console.log(`   Status: ${scanData.status}`);
    console.log(`   Accessibility Score: ${scanData.summary.accessibilityScore}%`);
    console.log(`   SEO Score: ${scanData.summary.seoScore}%`);
    console.log(`   Readability Score: ${scanData.summary.readabilityScore}%`);
    console.log(`   Total Issues: ${scanData.summary.totalIssues}`);
    console.log(`   Scan Duration: ${scanData.scanDuration}ms`);
    
    if (scanData.issues && scanData.issues.length > 0) {
      console.log(`\n   Issues found:`);
      scanData.issues.slice(0, 3).forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
        console.log(`      Location: ${issue.location}`);
      });
      if (scanData.issues.length > 3) {
        console.log(`   ... and ${scanData.issues.length - 3} more issues`);
      }
    } else {
      console.log('   No accessibility issues found! 🎉');
    }
    
    // Test scan history
    console.log('\n3. Testing scan history...');
    const historyResponse = await fetch('http://localhost:4000/scans');
    const historyData = await historyResponse.json();
    console.log(`✅ Scan history retrieved: ${historyData.length} scans`);
    
    console.log('\n🎉 All tests passed! Scanner service is working correctly.');
    console.log('\nNext steps:');
    console.log('1. Open http://localhost:3000/scan/ad-hoc in your browser');
    console.log('2. Enter a URL and click "Submit Scan"');
    console.log('3. View the results in the UI');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the scanner service is running: docker-compose up --build');
    console.log('2. Check if port 4000 is available');
    console.log('3. Verify the URL is accessible');
    console.log('4. Check Docker logs: docker-compose logs scanner');
    process.exit(1);
  }
}

// Run the test
testScanner();
