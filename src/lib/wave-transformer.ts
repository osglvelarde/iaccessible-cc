import { WaveResponse } from './wave-api';
import { ScanResponse } from './scanner-api';
import { v4 as uuidv4 } from 'uuid';

/**
 * Transforms a WAVE API response into the standard ScanResponse format
 */
export function transformWaveResponse(waveResponse: WaveResponse, originalUrl: string): ScanResponse {
  const { categories, statistics } = waveResponse;
  
  // Calculate summary metrics
  const errorCount = categories.error?.count || 0;
  const contrastCount = categories.contrast?.count || 0;
  const alertCount = categories.alert?.count || 0;
  const featureCount = categories.feature?.count || 0;
  const structureCount = categories.structure?.count || 0;
  
  const totalIssues = errorCount + contrastCount + alertCount;
  const totalElements = statistics.totalelements;
  const passedChecks = featureCount + structureCount;
  
  // Calculate accessibility score based on issues relative to total elements
  // Score = 100 - (issues/totalElements * 100), but with a better weighting
  // We penalize errors more than alerts
  const criticalIssues = errorCount + contrastCount;
  const issuePenalty = (criticalIssues * 2 + alertCount) / Math.max(totalElements, 1) * 100;
  const accessibilityScore = Math.max(0, Math.min(100, 100 - issuePenalty));

  // Build issues array from all categories
  const issues: ScanResponse['issues'] = [];
  let issueId = 1;

  // Process errors (critical severity)
  if (categories.error?.items) {
    for (const [itemKey, item] of Object.entries(categories.error.items)) {
      const xpaths = item.xpaths || [];
      
      // Create an issue for each occurrence
      for (let i = 0; i < item.count; i++) {
        issues.push({
          id: issueId++,
          type: item.id,
          severity: 'critical',
          description: item.description,
          location: xpaths[i] || 'Not specified',
          details: item.id,
          category: 'error',
          xpath: xpaths[i],
        });
      }
    }
  }

  // Process contrast errors (critical severity)
  if (categories.contrast?.items) {
    for (const [itemKey, item] of Object.entries(categories.contrast.items)) {
      const xpaths = item.xpaths || [];
      const contrastData = item.contrastdata || [];
      
      // Create an issue for each occurrence
      for (let i = 0; i < item.count; i++) {
        const contrast = contrastData[i];
        const contrastInfo = contrast ? `Contrast ratio: ${contrast[0]}:1 (Text: ${contrast[1]}, Background: ${contrast[2]}, Large text: ${contrast[3]})` : '';
        
        issues.push({
          id: issueId++,
          type: item.id,
          severity: 'critical',
          description: item.description,
          location: xpaths[i] || 'Not specified',
          details: contrastInfo || item.description,
          category: 'contrast',
          xpath: xpaths[i],
        });
      }
    }
  }

  // Process alerts (warning severity)
  if (categories.alert?.items) {
    for (const [itemKey, item] of Object.entries(categories.alert.items)) {
      const xpaths = item.xpaths || [];
      
      // Create an issue for each occurrence
      for (let i = 0; i < item.count; i++) {
        issues.push({
          id: issueId++,
          type: item.id,
          severity: 'warning',
          description: item.description,
          location: xpaths[i] || 'Not specified',
          details: item.id,
          category: 'alert',
          xpath: xpaths[i],
        });
      }
    }
  }

  // Return transformed response
  return {
    scanId: uuidv4(),
    url: statistics.pageurl || originalUrl,
    timestamp: new Date().toISOString(),
    status: 'completed',
    summary: {
      accessibilityScore: Math.round(accessibilityScore),
      seoScore: null, // WAVE doesn't provide SEO scores
      readabilityScore: null, // WAVE doesn't provide readability scores
      totalIssues,
      violations: errorCount,
      potentialViolations: alertCount,
      recommendations: 0,
      passed: passedChecks,
      totalRules: totalElements,
    },
    issues,
    scanDuration: statistics.time * 1000, // Convert to milliseconds
  };
}

