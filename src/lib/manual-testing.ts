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
  
  // Consider completed if all criteria have been evaluated
  const totalEvaluated = session.passCount + session.failCount + session.naCount;
  return totalEvaluated === session.totalCriteria ? 'Completed' : 'In Progress';
}