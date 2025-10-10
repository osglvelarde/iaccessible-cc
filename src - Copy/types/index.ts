// Core data types for the Accessibility Testing Tool
export type UserRole = 'Admin' | 'Lead' | 'Tester' | 'Reviewer' | 'Viewer';

export type ReportStatus = 'Draft' | 'In Review' | 'Approved' | 'Released';
export type PageStatus = 'Planned' | 'In Testing' | 'Completed';
export type FindingStatus = 'Pass' | 'Fail' | 'Needs Review' | 'N/A';
export type FindingSeverity = 'Critical' | 'Major' | 'Minor' | 'Advisory';
export type WCAGLevel = 'A' | 'AA' | 'AAA';
export type WCAGVersion = '2.1' | '2.2';
export type ScopeType = 'web' | 'pdf' | 'mobile';
export type CoverageLabel = 'Key' | 'Template' | 'Sample';
export type EvidenceType = 'Screenshot' | 'Video' | 'Audio' | 'CodeSnippet';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  role: UserRole;
  timezone: string;
}

export interface Report extends BaseEntity {
  title: string;
  client: string;
  project: string;
  standards: WCAGVersion[];
  level: WCAGLevel;
  scopeType: ScopeType;
  domain: string;
  status: ReportStatus;
  version: number;
  signOff?: {
    name: string;
    role: string;
    date: Date;
  };
  tags: string[];
  suggestedPages?: string[];
}

export interface Page extends BaseEntity {
  reportId: string;
  url: string;
  path: string;
  templateName?: string;
  status: PageStatus;
  lastTestedAt?: Date;
  coverageLabel: CoverageLabel;
}

export interface Criterion extends BaseEntity {
  wcagId: string; // e.g., "1.1.1"
  title: string;
  level: WCAGLevel;
  principle: string;
  howToTest: string;
  remediationLinks: string[];
  applicableMedia: ScopeType[];
}

export interface Finding extends BaseEntity {
  reportId: string;
  pageId: string;
  wcagId: string;
  status: FindingStatus;
  severity?: FindingSeverity;
  description: string;
  locationSelector?: string;
  assistiveTechUsed: string[];
  evidenceIds: string[];
  assignedTo?: string;
  dueDate?: Date;
  labels: string[];
  references: string[];
  retentionNote?: string;
}

export interface Evidence extends BaseEntity {
  type: EvidenceType;
  fileUrl: string;
  thumbnailUrl?: string;
  caption: string;
  altText?: string;
  transcript?: string;
  redactionFlags: boolean;
  hash: string;
}

export interface Comment extends BaseEntity {
  findingId: string;
  body: string;
  mentions: string[];
}

export interface AuditLog extends BaseEntity {
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, any>;
}

// UI State types
export interface TestingState {
  currentReport?: Report;
  currentPage?: Page;
  selectedStandards: WCAGVersion;
  selectedLevel: WCAGLevel;
  showCrosswalk: boolean;
}

export interface CriterionCheckState {
  wcagId: string;
  status: FindingStatus;
  notes?: string;
  evidence?: Evidence[];
}
