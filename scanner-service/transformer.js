class ResultTransformer {
  static transformToUIFormat(ibmReport, url) {
    const timestamp = new Date().toISOString();
    
    // Calculate accessibility score based on violations
    const summary = this.calculateSummary(ibmReport);
    
    // Transform issues
    const issues = this.transformIssues(ibmReport.results || []);
    
    return {
      url: url,
      timestamp: timestamp,
      status: "completed",
      summary: summary,
      issues: issues
    };
  }

  static calculateSummary(ibmReport) {
    const counts = ibmReport.summary?.counts || {};
    const totalIssues = (counts.violation || 0) + (counts.potentialviolation || 0);
    const totalRules = ibmReport.numExecuted || 0;
    const passedRules = counts.pass || 0;
    const violations = counts.violation || 0;
    const potentialViolations = counts.potentialviolation || 0;
    const recommendations = counts.recommendation || 0;
    
    // Calculate accessibility score using a more realistic algorithm
    let accessibilityScore = 0;
    
    if (totalRules > 0) {
      // Start with 100 and subtract penalties for issues
      accessibilityScore = 100;
      
      // Heavy penalties for critical violations (these are serious accessibility barriers)
      const violationPenalty = violations * 2; // Each violation costs 2 points
      const potentialViolationPenalty = potentialViolations * 0.5; // Each potential violation costs 0.5 points
      const recommendationPenalty = recommendations * 0.1; // Each recommendation costs 0.1 points
      
      // Calculate final score
      accessibilityScore = Math.max(0, accessibilityScore - violationPenalty - potentialViolationPenalty - recommendationPenalty);
      
      // Apply additional penalty based on violation rate for very large sites
      const violationRate = (violations + potentialViolations) / totalRules;
      if (violationRate > 0.1) { // More than 10% violation rate
        accessibilityScore = Math.max(0, accessibilityScore - 20); // Additional 20 point penalty
      } else if (violationRate > 0.05) { // More than 5% violation rate
        accessibilityScore = Math.max(0, accessibilityScore - 10); // Additional 10 point penalty
      }
      
      // Cap the score based on violation count - no site with many violations should get high scores
      if (violations > 50) {
        accessibilityScore = Math.min(accessibilityScore, 30); // Max 30% for sites with >50 violations
      } else if (violations > 20) {
        accessibilityScore = Math.min(accessibilityScore, 50); // Max 50% for sites with >20 violations
      } else if (violations > 10) {
        accessibilityScore = Math.min(accessibilityScore, 70); // Max 70% for sites with >10 violations
      }
    }

    // Calculate additional metrics
    const criticalIssues = violations;
    const warningIssues = potentialViolations;
    const infoIssues = recommendations;
    
    // Determine score category
    let scoreCategory = "Poor";
    if (accessibilityScore >= 90) scoreCategory = "Excellent";
    else if (accessibilityScore >= 80) scoreCategory = "Good";
    else if (accessibilityScore >= 60) scoreCategory = "Fair";
    else if (accessibilityScore >= 40) scoreCategory = "Needs Work";

    // Calculate SEO score based on accessibility scan results
    const seoScore = ResultTransformer.calculateSeoScore(ibmReport);
    
    // Calculate readability score based on accessibility scan results  
    const readabilityScore = ResultTransformer.calculateReadabilityScore(ibmReport);

    return {
      accessibilityScore: Math.round(accessibilityScore),
      seoScore: Math.round(seoScore),
      readabilityScore: Math.round(readabilityScore),
      totalIssues: totalIssues,
      totalRules: totalRules,
      violations: violations,
      potentialViolations: potentialViolations,
      recommendations: recommendations,
      passed: passedRules,
      criticalIssues: criticalIssues,
      warningIssues: warningIssues,
      infoIssues: infoIssues,
      passRate: totalRules > 0 ? Math.round((passedRules / totalRules) * 100) : 0,
      scoreCategory: scoreCategory
    };
  }

  static calculateSeoScore(ibmReport) {
    // Start with 100 and deduct points for SEO-related issues
    let seoScore = 100;
    
    // Get all results to analyze SEO factors
    const results = ibmReport.results || [];
    
    // SEO-related rule IDs and their impact
    const seoRules = {
      // Title and meta tags
      'WCAG20_Html_HasTitle': { weight: 15, message: 'Missing or poor page title' },
      'WCAG20_Html_HasLang': { weight: 10, message: 'Missing language declaration' },
      'WCAG20_Html_HasMetaDesc': { weight: 12, message: 'Missing meta description' },
      
      // Headings structure
      'WCAG20_Html_HasH1': { weight: 8, message: 'Missing H1 heading' },
      'WCAG20_Html_H1NotUsed': { weight: 5, message: 'Multiple H1 headings' },
      'WCAG20_Html_HeadingsValid': { weight: 6, message: 'Invalid heading structure' },
      
      // Images and alt text
      'WCAG20_Img_HasAlt': { weight: 10, message: 'Images missing alt text' },
      'WCAG20_Img_AltTextNotRedundant': { weight: 5, message: 'Redundant alt text' },
      
      // Links
      'WCAG20_A_HasText': { weight: 8, message: 'Links missing descriptive text' },
      'WCAG20_A_LinkTextHasId': { weight: 3, message: 'Link text issues' },
      
      // Forms
      'WCAG20_Input_LabelText': { weight: 6, message: 'Form inputs missing labels' },
      'WCAG20_Input_LabelRef': { weight: 4, message: 'Form label association issues' },
      
      // Content structure
      'WCAG20_Html_ListStructure': { weight: 3, message: 'List structure issues' },
      'WCAG20_Html_TableStructure': { weight: 4, message: 'Table structure issues' }
    };
    
    // Analyze results for SEO impact
    const seoIssues = results.filter(result => seoRules[result.ruleId]);
    
    seoIssues.forEach(issue => {
      const rule = seoRules[issue.ruleId];
      if (rule) {
        // Deduct points based on severity and rule importance
        let deduction = rule.weight;
        
        // Adjust deduction based on severity
        if (issue.level === 'violation') {
          deduction = rule.weight; // Full deduction for violations
        } else if (issue.level === 'potentialviolation') {
          deduction = rule.weight * 0.6; // 60% deduction for potential violations
        } else if (issue.level === 'recommendation') {
          deduction = rule.weight * 0.3; // 30% deduction for recommendations
        }
        
        seoScore -= deduction;
      }
    });
    
    // Additional SEO factors based on overall structure
    const totalResults = results.length;
    const passedResults = results.filter(r => r.level === 'pass').length;
    const passRate = totalResults > 0 ? (passedResults / totalResults) : 0;
    
    // Bonus for high accessibility pass rate (good accessibility often correlates with good SEO)
    if (passRate > 0.9) {
      seoScore += 5; // Small bonus for excellent accessibility
    } else if (passRate > 0.8) {
      seoScore += 2; // Small bonus for good accessibility
    }
    
    // Penalty for too many issues (indicates poor site structure)
    const totalIssues = results.filter(r => r.level !== 'pass').length;
    if (totalIssues > 50) {
      seoScore -= 10; // Penalty for many issues
    } else if (totalIssues > 20) {
      seoScore -= 5; // Penalty for moderate issues
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, seoScore));
  }

  static calculateReadabilityScore(ibmReport) {
    // Start with 100 and deduct points for readability-related issues
    let readabilityScore = 100;
    
    // Get all results to analyze readability factors
    const results = ibmReport.results || [];
    
    // Readability-related rule IDs and their impact
    const readabilityRules = {
      // Text contrast and visibility
      'WCAG20_Color_Contrast': { weight: 20, message: 'Poor color contrast affects readability' },
      'WCAG20_Color_ContrastRatio': { weight: 15, message: 'Insufficient color contrast ratio' },
      
      // Text sizing and scaling
      'WCAG20_Text_Scale': { weight: 10, message: 'Text scaling issues' },
      'WCAG20_Text_Resize': { weight: 8, message: 'Text resize problems' },
      
      // Focus and navigation
      'WCAG20_Focus_Visible': { weight: 12, message: 'Focus indicators not visible' },
      'WCAG20_Focus_Order': { weight: 8, message: 'Focus order issues' },
      
      // Content structure
      'WCAG20_Html_HasH1': { weight: 6, message: 'Missing clear page structure' },
      'WCAG20_Html_HeadingsValid': { weight: 8, message: 'Poor heading hierarchy' },
      
      // Forms and interactions
      'WCAG20_Input_LabelText': { weight: 10, message: 'Unclear form labels' },
      'WCAG20_Input_LabelRef': { weight: 6, message: 'Form label issues' },
      
      // Links and navigation
      'WCAG20_A_HasText': { weight: 8, message: 'Unclear link text' },
      'WCAG20_A_LinkTextUnique': { weight: 5, message: 'Non-unique link text' },
      
      // Images and media
      'WCAG20_Img_HasAlt': { weight: 6, message: 'Images without descriptive text' },
      'WCAG20_Media_AltText': { weight: 8, message: 'Media without proper descriptions' }
    };
    
    // Analyze results for readability impact
    const readabilityIssues = results.filter(result => readabilityRules[result.ruleId]);
    
    readabilityIssues.forEach(issue => {
      const rule = readabilityRules[issue.ruleId];
      if (rule) {
        // Deduct points based on severity and rule importance
        let deduction = rule.weight;
        
        // Adjust deduction based on severity
        if (issue.level === 'violation') {
          deduction = rule.weight; // Full deduction for violations
        } else if (issue.level === 'potentialviolation') {
          deduction = rule.weight * 0.6; // 60% deduction for potential violations
        } else if (issue.level === 'recommendation') {
          deduction = rule.weight * 0.3; // 30% deduction for recommendations
        }
        
        readabilityScore -= deduction;
      }
    });
    
    // Additional readability factors
    const totalResults = results.length;
    const passedResults = results.filter(r => r.level === 'pass').length;
    const passRate = totalResults > 0 ? (passedResults / totalResults) : 0;
    
    // Bonus for high accessibility pass rate (good accessibility often improves readability)
    if (passRate > 0.9) {
      readabilityScore += 5; // Small bonus for excellent accessibility
    } else if (passRate > 0.8) {
      readabilityScore += 2; // Small bonus for good accessibility
    }
    
    // Penalty for too many issues (indicates poor content structure)
    const totalIssues = results.filter(r => r.level !== 'pass').length;
    if (totalIssues > 50) {
      readabilityScore -= 10; // Penalty for many issues
    } else if (totalIssues > 20) {
      readabilityScore -= 5; // Penalty for moderate issues
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, readabilityScore));
  }

  static transformIssues(ibmResults) {
    return ibmResults
      .filter(result => result.level !== 'pass') // Only include issues, not passed checks
      .map((result, index) => ({
        id: index + 1,
        type: this.getIssueType(result.ruleId),
        severity: this.mapSeverity(result.level),
        description: result.message || 'No description available',
        location: this.extractLocation(result),
        details: result.snippet || 'No additional details available',
        ruleId: result.ruleId,
        category: result.category || 'Accessibility',
        xpath: result.path?.dom || '',
        ariaPath: result.path?.aria || ''
      }));
  }

  static getIssueType(ruleId) {
    if (!ruleId) return 'Accessibility';
    
    // Map IBM rule IDs to UI types
    if (ruleId.includes('WCAG')) return 'WCAG';
    if (ruleId.includes('IBM')) return 'IBM';
    if (ruleId.includes('Section508')) return 'Section 508';
    
    return 'Accessibility';
  }

  static mapSeverity(level) {
    const severityMap = {
      'violation': 'critical',
      'potentialviolation': 'warning',
      'recommendation': 'info',
      'potentialrecommendation': 'info',
      'manual': 'info'
    };
    
    return severityMap[level] || 'info';
  }

  static extractLocation(result) {
    // Try to extract meaningful location information
    if (result.snippet) {
      // Extract tag name from snippet
      const tagMatch = result.snippet.match(/<(\w+)/);
      if (tagMatch) {
        const tagName = tagMatch[1];
        const classMatch = result.snippet.match(/class="([^"]+)"/);
        const idMatch = result.snippet.match(/id="([^"]+)"/);
        
        let location = tagName;
        if (idMatch) {
          location += `#${idMatch[1]}`;
        } else if (classMatch) {
          location += `.${classMatch[1].split(' ')[0]}`;
        }
        
        return location;
      }
    }
    
    // Fallback to xpath if available
    if (result.path?.dom) {
      return result.path.dom;
    }
    
    return 'Unknown location';
  }
}

module.exports = ResultTransformer;
