export type TestStatus = 'Pass' | 'Fail' | 'N/A' | 'Needs Senior Review';
export type EvidenceType = 'Photo' | 'Video' | 'Audio' | 'Code Snippet';

export interface TestEvidence {
  id: string;
  type: EvidenceType;
  filename: string;
  uploadedAt: string;
  caption?: string;
}

export interface CriterionResult {
  wcagId: string;
  status: TestStatus;
  note?: string;
  evidence: TestEvidence[];
  lastUpdated: string;
}

export interface TestSession {
  testId: string;
  pageUrl: string;
  department: string;
  organization: string;
  wcagVersion: '2.0' | '2.1' | '2.2';
  level: 'A' | 'AA' | 'AAA';
  startedAt: string;
  lastUpdatedAt: string;
  criteria: CriterionResult[];
  testerName?: string;
  testerEmail?: string;
}

export interface TestSessionSummary {
  testId: string;
  pageUrl: string;
  department: string;
  organization: string;
  wcagVersion: '2.0' | '2.1' | '2.2';
  level: 'A' | 'AA' | 'AAA';
  startedAt: string;
  lastUpdatedAt: string;
  totalCriteria: number;
  completedCriteria: number;
  passCount: number;
  failCount: number;
  naCount: number;
  needsReviewCount: number;
  progressPercent: number;
}

// Generate unique test ID
export function generateTestId(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create new test session
export function createTestSession(
  pageUrl: string,
  department: string,
  organization: string,
  wcagVersion: '2.1' | '2.2' = '2.2',
  level: 'A' | 'AA' | 'AAA' = 'AA'
): TestSession {
  const testId = generateTestId();
  const now = new Date().toISOString();
  
  return {
    testId,
    pageUrl,
    department,
    organization,
    wcagVersion,
    level,
    startedAt: now,
    lastUpdatedAt: now,
    criteria: []
  };
}

// Update criterion result
export function updateCriterionResult(
  session: TestSession,
  wcagId: string,
  status: TestStatus,
  note?: string
): TestSession {
  const existingIndex = session.criteria.findIndex(c => c.wcagId === wcagId);
  const now = new Date().toISOString();
  
  const criterionResult: CriterionResult = {
    wcagId,
    status,
    note,
    evidence: existingIndex >= 0 ? session.criteria[existingIndex].evidence : [],
    lastUpdated: now
  };
  
  const updatedCriteria = [...session.criteria];
  if (existingIndex >= 0) {
    updatedCriteria[existingIndex] = criterionResult;
  } else {
    updatedCriteria.push(criterionResult);
  }
  
  return {
    ...session,
    criteria: updatedCriteria,
    lastUpdatedAt: now
  };
}

// Add evidence to criterion
export function addEvidenceToCriterion(
  session: TestSession,
  wcagId: string,
  evidence: TestEvidence
): TestSession {
  const criterionIndex = session.criteria.findIndex(c => c.wcagId === wcagId);
  
  if (criterionIndex >= 0) {
    const updatedCriteria = [...session.criteria];
    updatedCriteria[criterionIndex] = {
      ...updatedCriteria[criterionIndex],
      evidence: [...updatedCriteria[criterionIndex].evidence, evidence],
      lastUpdated: new Date().toISOString()
    };
    
    return {
      ...session,
      criteria: updatedCriteria,
      lastUpdatedAt: new Date().toISOString()
    };
  }
  
  return session;
}

// Update note for criterion
export function updateCriterionNote(
  session: TestSession,
  wcagId: string,
  note: string
): TestSession {
  const criterionIndex = session.criteria.findIndex(c => c.wcagId === wcagId);
  
  if (criterionIndex >= 0) {
    const updatedCriteria = [...session.criteria];
    updatedCriteria[criterionIndex] = {
      ...updatedCriteria[criterionIndex],
      note,
      lastUpdated: new Date().toISOString()
    };
    
    return {
      ...session,
      criteria: updatedCriteria,
      lastUpdatedAt: new Date().toISOString()
    };
  }
  
  return session;
}

// Get criterion result
export function getCriterionResult(session: TestSession, wcagId: string): CriterionResult | null {
  return session.criteria.find(c => c.wcagId === wcagId) || null;
}

// Calculate session summary
export function calculateSessionSummary(session: TestSession, totalCriteria: number): TestSessionSummary {
  const completedCriteria = session.criteria.length;
  const passCount = session.criteria.filter(c => c.status === 'Pass').length;
  const failCount = session.criteria.filter(c => c.status === 'Fail').length;
  const naCount = session.criteria.filter(c => c.status === 'N/A').length;
  const needsReviewCount = session.criteria.filter(c => c.status === 'Needs Senior Review').length;
  const progressPercent = totalCriteria > 0 ? Math.round((completedCriteria / totalCriteria) * 100) : 0;
  
  return {
    testId: session.testId,
    pageUrl: session.pageUrl,
    department: session.department,
    organization: session.organization,
    wcagVersion: session.wcagVersion,
    level: session.level,
    startedAt: session.startedAt,
    lastUpdatedAt: session.lastUpdatedAt,
    totalCriteria,
    completedCriteria,
    passCount,
    failCount,
    naCount,
    needsReviewCount,
    progressPercent
  };
}

// Auto-save functionality with debouncing
let saveTimeout: NodeJS.Timeout | null = null;

export function autoSaveSession(session: TestSession, saveCallback: (session: TestSession) => Promise<void>) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(async () => {
    try {
      await saveCallback(session);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, 300); // 300ms debounce
}

// Local storage helpers (for now, until we implement file-based storage)
export function saveSessionToLocalStorage(session: TestSession): void {
  try {
    localStorage.setItem(`manual-test-session-${session.testId}`, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save session to localStorage:', error);
  }
}

export function loadSessionFromLocalStorage(testId: string): TestSession | null {
  try {
    const saved = localStorage.getItem(`manual-test-session-${testId}`);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load session from localStorage:', error);
    return null;
  }
}

export function getAllSessionIds(): string[] {
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith('manual-test-session-'))
      .map(key => key.replace('manual-test-session-', ''));
  } catch (error) {
    console.error('Failed to get session IDs:', error);
    return [];
  }
}

export function deleteSessionFromLocalStorage(testId: string): void {
  try {
    localStorage.removeItem(`manual-test-session-${testId}`);
  } catch (error) {
    console.error('Failed to delete session from localStorage:', error);
  }
}

// Utility functions
export function getStatusColor(status: TestStatus): string {
  switch (status) {
    case 'Pass':
      return 'text-green-600';
    case 'Fail':
      return 'text-red-600';
    case 'Needs Senior Review':
      return 'text-yellow-600';
    case 'N/A':
      return 'text-gray-500';
    default:
      return 'text-gray-400';
  }
}

export function getStatusBadgeVariant(status: TestStatus): 'default' | 'destructive' | 'secondary' | 'outline' {
  switch (status) {
    case 'Pass':
      return 'default';
    case 'Fail':
      return 'destructive';
    case 'Needs Senior Review':
      return 'secondary';
    case 'N/A':
      return 'outline';
    default:
      return 'outline';
  }
}

export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function getTestStatusFromSession(session: TestSession): 'Not Started' | 'In Progress' | 'Completed' {
  if (session.criteria.length === 0) {
    return 'Not Started';
  }
  
  // Consider completed if all criteria have been evaluated (not just started)
  const hasUnfinishedCriteria = session.criteria.some(c => 
    c.status === 'Needs Senior Review' && !c.note && c.evidence.length === 0
  );
  
  return hasUnfinishedCriteria ? 'In Progress' : 'Completed';
}

export function getTestStatusFromSessionSummary(session: TestSessionSummary): 'Not Started' | 'In Progress' | 'Completed' {
  if (session.totalCriteria === 0) {
    return 'Not Started';
  }
  
  // Consider completed if all criteria have been evaluated (including needs review)
  const totalEvaluated = session.passCount + session.failCount + session.naCount + session.needsReviewCount;
  return totalEvaluated === session.totalCriteria ? 'Completed' : 'In Progress';
}

// CSV export function
export function exportSessionToCSV(session: TestSession, criteria: Array<{ wcagId: string; title: string; principle: string; level: string }>): string {
  // Helper function to escape CSV fields
  const escapeCSVField = (field: string | number | boolean | undefined | null): string => {
    if (field === null || field === undefined) {
      return '';
    }
    const str = String(field);
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV rows
  const rows: string[] = [];

  // Metadata section
  rows.push('Manual Testing Report');
  rows.push('');
  rows.push('Test Information');
  rows.push(`Test ID,${escapeCSVField(session.testId)}`);
  rows.push(`Page URL,${escapeCSVField(session.pageUrl)}`);
  rows.push(`Organization,${escapeCSVField(session.organization)}`);
  rows.push(`Department/Operating Unit,${escapeCSVField(session.department)}`);
  rows.push(`WCAG Version,${escapeCSVField(session.wcagVersion)}`);
  rows.push(`Test Level,${escapeCSVField(session.level)}`);
  rows.push(`Started At,${escapeCSVField(formatDate(session.startedAt))}`);
  rows.push(`Last Updated,${escapeCSVField(formatDate(session.lastUpdatedAt))}`);
  if (session.testerName) {
    rows.push(`Tester Name,${escapeCSVField(session.testerName)}`);
  }
  if (session.testerEmail) {
    rows.push(`Tester Email,${escapeCSVField(session.testerEmail)}`);
  }
  rows.push('');

  // Summary section
  const summary = calculateSessionSummary(session, criteria.length);
  rows.push('Summary Statistics');
  rows.push(`Total Criteria,${summary.totalCriteria}`);
  rows.push(`Completed Criteria,${summary.completedCriteria}`);
  rows.push(`Passed,${summary.passCount}`);
  rows.push(`Failed,${summary.failCount}`);
  rows.push(`Not Applicable,${summary.naCount}`);
  rows.push(`Needs Senior Review,${summary.needsReviewCount}`);
  rows.push(`Progress,${summary.progressPercent}%`);
  rows.push('');

  // Criteria results section
  rows.push('Criteria Results');
  rows.push('WCAG ID,Criterion Title,Principle,Level,Status,Note,Evidence Count,Evidence Files,Last Updated');

  // Sort criteria by WCAG ID for consistent ordering
  const sortedCriteria = [...criteria].sort((a, b) => {
    const aParts = a.wcagId.split('.').map(Number);
    const bParts = b.wcagId.split('.').map(Number);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = aParts[i] || 0;
      const bVal = bParts[i] || 0;
      if (aVal !== bVal) {
        return aVal - bVal;
      }
    }
    return 0;
  });

  sortedCriteria.forEach((criterion) => {
    const result = session.criteria.find(c => c.wcagId === criterion.wcagId);
    const status = result?.status || 'Not Tested';
    const note = result?.note || '';
    const evidenceCount = result?.evidence.length || 0;
    const evidenceFiles = result?.evidence.map(e => e.filename).join('; ') || '';
    const lastUpdated = result?.lastUpdated ? formatDate(result.lastUpdated) : '';

    rows.push([
      escapeCSVField(criterion.wcagId),
      escapeCSVField(criterion.title),
      escapeCSVField(criterion.principle),
      escapeCSVField(criterion.level),
      escapeCSVField(status),
      escapeCSVField(note),
      escapeCSVField(evidenceCount),
      escapeCSVField(evidenceFiles),
      escapeCSVField(lastUpdated)
    ].join(','));
  });

  return rows.join('\n');
}