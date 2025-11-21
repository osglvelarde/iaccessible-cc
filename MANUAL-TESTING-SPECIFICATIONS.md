# Manual Testing Feature - Specifications Document

## Table of Contents
1. [Overview](#overview)
2. [Data Elements](#data-elements)
3. [Workflow](#workflow)
4. [Guidelines](#guidelines)
5. [Definitions](#definitions)
6. [Tooltips](#tooltips)

---

## Overview

The Manual Testing feature enables human evaluators to conduct comprehensive WCAG accessibility assessments on web pages. The system supports WCAG 2.0, 2.1, and 2.2 standards at Levels A, AA, and AAA, allowing testers to evaluate criteria, upload evidence, add notes, and generate detailed reports.

---

## Data Elements

### Core Data Types

#### TestStatus
Enumeration of possible test result statuses for a criterion.

**Values:**
- `Pass` - Criterion meets accessibility requirements
- `Fail` - Criterion does not meet accessibility requirements
- `N/A` - Criterion is not applicable to the page being tested
- `Needs Senior Review` - Criterion requires review by a senior accessibility expert

#### EvidenceType
Type of evidence file that can be uploaded.

**Values:**
- `Photo` - Image evidence (screenshots, photos)
- `Video` - Video evidence (screen recordings, demonstrations)
- `Audio` - Audio evidence (audio recordings)
- `Code Snippet` - Code or text file evidence

### Data Structures

#### TestEvidence
Represents uploaded evidence for a criterion.

```typescript
interface TestEvidence {
  id: string;                    // Unique identifier for the evidence
  type: EvidenceType;           // Type of evidence (Photo, Video, Audio, Code Snippet)
  filename: string;              // Original filename of uploaded file
  uploadedAt: string;            // ISO 8601 timestamp of upload
  caption?: string;              // Optional description/caption for the evidence
}
```

**Fields:**
- `id`: Unique identifier generated using `crypto.randomUUID()`
- `type`: One of the EvidenceType values
- `filename`: Original name of the uploaded file
- `uploadedAt`: ISO 8601 formatted timestamp
- `caption`: Optional text description (defaults to "Uploaded evidence for {filename}")

#### CriterionResult
Represents the test result for a single WCAG criterion.

```typescript
interface CriterionResult {
  wcagId: string;               // WCAG criterion ID (e.g., "1.1.1", "2.4.1")
  status: TestStatus;            // Test result status
  note?: string;                 // Optional testing notes (max 2000 characters)
  evidence: TestEvidence[];     // Array of uploaded evidence files
  lastUpdated: string;           // ISO 8601 timestamp of last update
}
```

**Fields:**
- `wcagId`: WCAG criterion identifier (e.g., "1.1.1", "2.4.1", "3.2.4")
- `status`: Current test status (Pass, Fail, N/A, Needs Senior Review)
- `note`: Optional text notes describing testing approach, issues found, or observations
- `evidence`: Array of evidence files uploaded for this criterion
- `lastUpdated`: ISO 8601 timestamp of the most recent update

#### TestSession
Complete test session data for a single page.

```typescript
interface TestSession {
  testId: string;                // Unique test session identifier
  pageUrl: string;               // URL of the page being tested
  department: string;            // Department or operating unit name
  organization: string;          // Organization name
  wcagVersion: '2.0' | '2.1' | '2.2';  // WCAG version being tested
  level: 'A' | 'AA' | 'AAA';     // WCAG conformance level
  startedAt: string;              // ISO 8601 timestamp when test started
  lastUpdatedAt: string;         // ISO 8601 timestamp of last session update
  criteria: CriterionResult[];   // Array of criterion test results
  testerName?: string;           // Optional name of the tester
  testerEmail?: string;          // Optional email of the tester
}
```

**Fields:**
- `testId`: Generated using format `test_{timestamp}_{randomString}` (e.g., "test_1761237319693_vin6rgdn0")
- `pageUrl`: Full URL of the page under test
- `department`: Department or operating unit name (from CSV data)
- `organization`: Organization name (from CSV data)
- `wcagVersion`: WCAG standard version (2.0, 2.1, or 2.2)
- `level`: Conformance level (A, AA, or AAA)
- `startedAt`: ISO 8601 timestamp when session was created
- `lastUpdatedAt`: ISO 8601 timestamp of most recent change
- `criteria`: Array of CriterionResult objects
- `testerName`: Optional tester identification
- `testerEmail`: Optional tester contact information

#### TestSessionSummary
Summary statistics for a test session.

```typescript
interface TestSessionSummary {
  testId: string;                // Test session identifier
  pageUrl: string;               // URL of the page being tested
  department: string;             // Department or operating unit name
  organization: string;           // Organization name
  wcagVersion: '2.0' | '2.1' | '2.2';  // WCAG version
  level: 'A' | 'AA' | 'AAA';     // WCAG conformance level
  startedAt: string;              // ISO 8601 timestamp when test started
  lastUpdatedAt: string;         // ISO 8601 timestamp of last update
  totalCriteria: number;         // Total number of criteria for this version/level
  completedCriteria: number;     // Number of criteria with test results
  passCount: number;             // Number of criteria marked as Pass
  failCount: number;             // Number of criteria marked as Fail
  naCount: number;               // Number of criteria marked as N/A
  needsReviewCount: number;      // Number of criteria marked as Needs Senior Review
  progressPercent: number;       // Percentage of completion (0-100)
}
```

**Calculated Fields:**
- `totalCriteria`: Total criteria count based on WCAG version and level
- `completedCriteria`: Count of criteria with status set (length of criteria array)
- `passCount`: Count of criteria with status "Pass"
- `failCount`: Count of criteria with status "Fail"
- `naCount`: Count of criteria with status "N/A"
- `needsReviewCount`: Count of criteria with status "Needs Senior Review"
- `progressPercent`: `(completedCriteria / totalCriteria) * 100`, rounded to nearest integer

### Supporting Data Types

#### CrawledPage
Page data loaded from CSV file.

```typescript
interface CrawledPage {
  webpage: string;               // Page URL
  organizationName: string;     // Organization name
  operatingUnitName?: string;    // Operating unit name (optional)
  departmentName?: string;        // Department name (optional)
  dateScanned: string;           // Date when page was scanned
  internalExternal: 'Internal' | 'External';  // Page classification
}
```

#### WCAGCriterion
WCAG criterion definition.

```typescript
interface WCAGCriterion {
  wcagId: string;                // WCAG criterion ID
  title: string;                 // Criterion title
  principle: string;             // WCAG principle name (Perceivable, Operable, etc.)
  level: 'A' | 'AA' | 'AAA';     // Conformance level
  wcagVersion: '2.0' | '2.1' | '2.2';  // WCAG version
  howToTest: string;             // Testing instructions (used in tooltip)
  understandingUrl: string;      // URL to Understanding WCAG documentation (W3.org link)
}
```

**Data Source:** `src/lib/wcag-complete.ts`

**Tooltip Usage:**
- `title`: Displayed as heading in tooltip
- `howToTest`: Main content displayed in tooltip (testing instructions)
- `wcagId` and `level`: Displayed as metadata badge in tooltip
- `understandingUrl`: Used as clickable link to W3.org documentation

**W3.org URL Format:**
- Base: `https://www.w3.org/WAI/WCAG22/Understanding/`
- Pattern: `{base}{criterion-slug}.html`
- Example: `https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html`

### File Storage

#### Evidence File Storage
Evidence files are stored in the following structure:
```
manual-testing-results/
  evidence/
    {testId}/
      {wcagId}_{timestamp}_{date-time}.{extension}
```

**Example:**
```
manual-testing-results/
  evidence/
    test_1761237319693_vin6rgdn0/
      1.1.1_1761237668851_2025-10-09_06h14_11.png
      1.2.2_1763561778548_2025-10-09_08h18_34.png
```

#### Session Storage
Test sessions are stored as JSON files:
```
manual-testing-results/
  {testId}.json
```

**Storage Methods:**
1. **Local Storage**: Browser localStorage (key: `manual-test-session-{testId}`)
2. **File System**: JSON files in `manual-testing-results/` directory
3. **API**: POST to `/api/manual-testing/sessions` for server-side persistence

---

## Workflow

### 1. Dashboard Access
**Location:** `/manual-testing`

**Steps:**
1. User navigates to Manual Testing Dashboard
2. System loads crawled pages from CSV file (`public/df_doc_crawler1.csv`)
3. System loads existing test sessions from localStorage and API
4. Dashboard displays pages with their test status

**Features:**
- Filter by organization, operating unit, department, date range
- Search by URL
- Sort by URL, organization, operating unit, date scanned, or status
- View mode: Grid or Table
- Filter to show only "In Progress" tests
- Pagination support

### 2. Starting a New Test Session
**Location:** `/manual-testing/new?url={pageUrl}`

**Steps:**
1. User clicks "Start" button on a page in the dashboard
2. System creates new test session:
   - Generates unique `testId` (format: `test_{timestamp}_{randomString}`)
   - Sets `pageUrl` from query parameter
   - Extracts `department` and `organization` from CSV data
   - Sets default `wcagVersion` to "2.2" and `level` to "AA"
   - Initializes empty `criteria` array
   - Sets `startedAt` and `lastUpdatedAt` to current timestamp
3. System saves session to localStorage
4. System automatically opens page URL in new browser tab
5. User is redirected to workspace: `/manual-testing/{testId}?url={pageUrl}`

### 3. Continuing an Existing Test Session
**Location:** `/manual-testing/{testId}?url={pageUrl}`

**Steps:**
1. User clicks "Continue" button on a page in the dashboard
2. System loads existing session:
   - First attempts to load from localStorage
   - If not found, fetches from API: `/api/manual-testing/sessions?testId={testId}`
   - If found via API, saves to localStorage
3. System displays workspace with existing test results
4. User can continue testing from where they left off

### 4. Testing Workflow in Workspace

#### 4.1 Initial Setup
1. Workspace header displays:
   - Page URL (with copy and open buttons)
   - WCAG version selector (2.0, 2.1, 2.2)
   - Level selector (A, AA, AAA)
   - Progress indicator (completed/total criteria)
   - View mode toggle (Checklist/Report)
   - Export CSV button
   - Settings button

2. External tab panel shows:
   - Page URL being tested
   - "Open Page" button
   - "Copy URL" button
   - Collapsible "How to Test" instructions
   - Page metadata (organization, operating unit, scan date)

#### 4.2 Testing a Criterion

**Checklist View:**
1. Criteria are organized by WCAG Principles:
   - Principle 1: Perceivable
   - Principle 2: Operable
   - Principle 3: Understandable
   - Principle 4: Robust

2. Each criterion card displays:
   - WCAG ID (e.g., "1.1.1")
   - Level badge (A, AA, AAA)
   - Criterion title
   - Info button (shows tooltip with testing instructions)
   - Radio buttons for status selection (Pass, Fail, N/A)

3. User selects status:
   - Click radio button for desired status
   - System updates `CriterionResult` in session
   - Auto-save triggers after 300ms debounce
   - Session saved to localStorage and API

4. If status is "Fail":
   - Evidence upload button appears
   - Note button appears
   - User can upload evidence files
   - User can add detailed notes

#### 4.3 Uploading Evidence

**Steps:**
1. User clicks "Evidence" button on a failed criterion
2. Evidence Upload Dialog opens
3. User selects evidence type:
   - Photo (JPG, PNG, GIF, WebP)
   - Video (MP4, MOV, WebM, AVI)
   - Audio (MP3, WAV, M4A, OGG)
   - Code Snippet (TXT, MD, JS, TS, CSS, HTML, JSON)
4. User uploads files:
   - Click to select files, or
   - Drag and drop files
5. System validates file types based on selected evidence type
6. User clicks "Upload" button
7. System uploads files:
   - POST to `/api/manual-testing/evidence`
   - FormData includes: file, testId, wcagId, evidenceType
   - Files saved to `manual-testing-results/evidence/{testId}/`
   - Filename format: `{wcagId}_{timestamp}_{date-time}.{extension}`
8. System creates `TestEvidence` objects and adds to criterion
9. Dialog closes after successful upload
10. Evidence count badge updates on criterion card

#### 4.4 Adding Notes

**Steps:**
1. User clicks "Note" button on a failed criterion
2. Test Note Dialog opens
3. User enters notes in textarea:
   - Maximum 2000 characters
   - Character counter displayed
   - Warning shown when approaching limit
4. User clicks "Save Note" button
5. System updates `note` field in `CriterionResult`
6. Auto-save triggers
7. Dialog closes
8. Note preview appears on criterion card (truncated if > 100 characters)

#### 4.5 Viewing Report

**Steps:**
1. User clicks "View Report" button in header
2. System switches to Report view
3. Report displays:
   - Test Information section (metadata)
   - Summary Statistics section (counts and progress)
   - Detailed Criteria Results section (table view by principle)
4. User can expand/collapse principles
5. User can export report to CSV

#### 4.6 Exporting Results

**Steps:**
1. User clicks "Export CSV" button
2. System generates CSV file:
   - GET request to `/api/manual-testing/export?testId={testId}`
   - CSV includes:
     - Test Information section
     - Summary Statistics section
     - Criteria Results section (all criteria with status, notes, evidence)
3. File downloads with filename: `manual-test-{testId}-{date}.csv`

### 5. Auto-Save Mechanism

**Implementation:**
- Debounced auto-save with 300ms delay
- Triggers on any session update:
  - Status change
  - Evidence upload
  - Note update
  - WCAG version change
  - Level change
- Saves to:
  1. localStorage (immediate)
  2. API endpoint `/api/manual-testing/sessions` (POST request)

**Visual Feedback:**
- "Saving..." indicator appears in header during save
- Save icon animates (pulse effect)

### 6. Session Management

**Loading Sessions:**
- Priority order:
  1. localStorage (fastest, client-side)
  2. API endpoint (if localStorage fails)
- Session data includes all criteria results, evidence references, and notes

**Session Status Calculation:**
- `Not Started`: No criteria have been evaluated
- `In Progress`: Some criteria evaluated, but not all
- `Completed`: All criteria have been evaluated (including "Needs Senior Review")

---

## Guidelines

### Testing Guidelines

#### General Testing Approach
1. **Open the page in a new tab** - Use the "Open Page" button to test the actual page
2. **Test systematically** - Work through criteria by principle for consistency
3. **Use assistive technologies** - Test with screen readers, keyboard navigation, etc.
4. **Document thoroughly** - Add notes and evidence for failed criteria
5. **Be specific** - Include exact locations, examples, and steps to reproduce issues

#### Status Selection Guidelines

**Pass:**
- Criterion fully meets WCAG requirements
- No accessibility issues found
- All test cases pass

**Fail:**
- Criterion does not meet WCAG requirements
- One or more accessibility issues found
- Must include evidence and/or notes explaining the failure

**N/A (Not Applicable):**
- Criterion does not apply to the page being tested
- Example: Audio content criterion on a page with no audio
- Use sparingly and document reasoning if needed

**Needs Senior Review:**
- Criterion requires expert evaluation
- Ambiguous cases that need clarification
- Complex technical issues requiring senior assessment

#### Evidence Upload Guidelines

**When to Upload Evidence:**
- Always upload evidence for failed criteria
- Screenshots showing the issue
- Screen recordings demonstrating the problem
- Code snippets showing problematic markup
- Audio/video recordings of assistive technology behavior

**Evidence Best Practices:**
1. **Screenshots**: Capture the exact issue with annotations if helpful
2. **Videos**: Record screen reader output or keyboard navigation problems
3. **Code**: Include relevant HTML/CSS/JavaScript that causes the issue
4. **Descriptions**: Add captions or descriptions explaining what the evidence shows

**File Naming:**
- System automatically names files: `{wcagId}_{timestamp}_{date-time}.{extension}`
- Original filename is preserved in `TestEvidence.filename`

#### Note Writing Guidelines

**Note Content Should Include:**
1. **What was tested** - Specific elements, features, or functionality
2. **How it was tested** - Testing method, tools used, steps taken
3. **Issues found** - Specific problems identified
4. **Assistive technology used** - Screen reader, keyboard, voice control, etc.
5. **Browser/device** - Testing environment details
6. **Location** - Exact page locations, element IDs, or component names

**Note Format:**
- Maximum 2000 characters
- Use clear, concise language
- Include specific examples
- Reference evidence files when applicable

**Example Note:**
```
Tested keyboard navigation on the main navigation menu using Tab key. 
Found that the dropdown menu items (Services, About, Contact) are not 
accessible via keyboard. When tabbing to the parent menu item, the 
dropdown opens but focus is lost. Tested with NVDA screen reader on 
Chrome browser. Issue located in header navigation component (nav#main-nav).
```

#### WCAG Version Selection

**WCAG 2.0:**
- Original WCAG standard
- Use for legacy compliance requirements

**WCAG 2.1:**
- Includes all 2.0 criteria plus additional mobile and low-vision criteria
- Recommended for most modern websites

**WCAG 2.2:**
- Latest standard (as of implementation)
- Includes all 2.1 criteria plus new focus management and help criteria
- Recommended for new projects

#### Level Selection

**Level A:**
- Minimum level of accessibility
- Basic requirements that must be met

**Level AA:**
- Standard level for most organizations
- Recommended for public-facing websites
- Includes all Level A criteria plus additional requirements

**Level AAA:**
- Highest level of accessibility
- Most comprehensive requirements
- May not be achievable for all content types

### UI/UX Guidelines

#### Workspace Layout
- **Header**: Fixed at top, shows progress and controls
- **Checklist/Report**: Main content area, scrollable
- **External Tab Panel**: Collapsible panel for page information

#### Progress Tracking
- Progress bar shows completion percentage
- Badge shows "X of Y completed"
- Color coding:
  - Green: Pass
  - Red: Fail
  - Yellow: Needs Review
  - Gray: N/A

#### Responsive Design
- Grid layout adapts to screen size:
  - 1 column on mobile
  - 2 columns on tablet
  - 3 columns on desktop
- Table view scrolls horizontally on small screens

---

## Definitions

### Accessibility Terms

**WCAG (Web Content Accessibility Guidelines)**
- International standard for web accessibility
- Published by W3C (World Wide Web Consortium)
- Defines how to make web content accessible to people with disabilities

**Criterion**
- A specific, testable requirement in WCAG
- Each criterion has a unique ID (e.g., "1.1.1", "2.4.1")
- Criteria are organized by principles and have conformance levels

**Principle**
- One of four foundational principles of WCAG:
  1. **Perceivable** - Information must be presentable to users in ways they can perceive
  2. **Operable** - Interface components must be operable
  3. **Understandable** - Information and UI operation must be understandable
  4. **Robust** - Content must be robust enough for various assistive technologies

**Conformance Level**
- Level of WCAG compliance:
  - **Level A**: Minimum requirements
  - **Level AA**: Standard requirements (most common)
  - **Level AAA**: Highest requirements

**Test Session**
- A single testing instance for one web page
- Contains all test results, evidence, and notes for that page
- Identified by unique `testId`

**Criterion Result**
- The outcome of testing a single WCAG criterion
- Includes status, notes, and evidence
- Stored within a test session

**Evidence**
- Supporting material for a test result
- Can be photos, videos, audio, or code snippets
- Used to document accessibility issues or confirm compliance

### System Terms

**Auto-Save**
- Automatic saving of test session data
- Triggers after 300ms of inactivity
- Saves to both localStorage and API

**Debounce**
- Technique to limit function execution frequency
- Used in auto-save to prevent excessive API calls
- 300ms delay ensures changes are batched

**Local Storage**
- Browser-based storage mechanism
- Used for fast access to test sessions
- Key format: `manual-test-session-{testId}`

**Test ID**
- Unique identifier for a test session
- Format: `test_{timestamp}_{randomString}`
- Example: `test_1761237319693_vin6rgdn0`

**Progress Percent**
- Calculated as: `(completedCriteria / totalCriteria) * 100`
- Rounded to nearest integer
- Range: 0-100

**Status Badge**
- Visual indicator of test status
- Color-coded for quick recognition
- Shows in dashboard and workspace

---

## Tooltips

### Tooltip Data Source

**Location:** `src/lib/wcag-complete.ts`

Tooltip content for each WCAG criterion is extracted from the `WCAG_CRITERIA` array, which contains all 87 WCAG 2.2 success criteria. Each criterion object includes:

- **`title`**: Criterion title (e.g., "Non-text Content")
- **`howToTest`**: Testing instructions displayed in the tooltip
- **`wcagId`**: WCAG criterion identifier (e.g., "1.1.1")
- **`level`**: Conformance level (A, AA, AAA)
- **`understandingUrl`**: Direct link to W3.org Understanding WCAG documentation

**Data Flow:**
1. Criteria are loaded from `WCAG_CRITERIA` constant in `src/lib/wcag-complete.ts`
2. Filtered by version and level using `getCriteriaForVersionAndLevel(version, level)`
3. Passed to `WCAGManualChecklist` component as `criteria` prop
4. Each criterion's tooltip is rendered using data from the criterion object

**Code Reference:**
```typescript
// src/lib/wcag-complete.ts
export const WCAG_CRITERIA: WCAGCriterion[] = [
  {
    wcagId: '1.1.1',
    title: 'Non-text Content',
    level: 'A',
    principle: 'Perceivable',
    howToTest: 'Check that all non-text content has appropriate alternative text...',
    understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html',
    wcagVersion: '2.0'
  },
  // ... 86 more criteria
];
```

### W3.org Reference System

**Understanding WCAG URLs:**

Each criterion includes an `understandingUrl` field that links directly to the official W3.org "Understanding WCAG" documentation page. The URL format follows this pattern:

```
https://www.w3.org/WAI/WCAG22/Understanding/{criterion-slug}.html
```

**URL Structure:**
- Base URL: `https://www.w3.org/WAI/WCAG22/Understanding/`
- Criterion slug: Lowercase, hyphenated version of the criterion title
- Example: `non-text-content.html` for criterion 1.1.1 "Non-text Content"

**How W3.org Links Are Used:**

1. **In Tooltip**: Each criterion tooltip includes a clickable link at the bottom:
   ```tsx
   <a href={criterion.understandingUrl} target="_blank" rel="noopener noreferrer">
     View Understanding WCAG →
   </a>
   ```

2. **Link Behavior**:
   - Opens in new tab (`target="_blank"`)
   - Security attributes (`rel="noopener noreferrer"`)
   - Styled as primary link with hover effects
   - Accessible with keyboard navigation

3. **W3.org Documentation Content**:
   - Official WCAG criterion explanation
   - Intent and benefits
   - Examples of success and failure
   - Related techniques and resources
   - Test procedures and methods

**Example W3.org URLs by Criterion:**

| WCAG ID | Criterion Title | Understanding URL |
|---------|----------------|-------------------|
| 1.1.1 | Non-text Content | `https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html` |
| 1.2.2 | Captions (Prerecorded) | `https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html` |
| 2.1.1 | Keyboard | `https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html` |
| 2.4.1 | Bypass Blocks | `https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html` |
| 3.2.1 | On Focus | `https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html` |
| 4.1.1 | Parsing | `https://www.w3.org/WAI/WCAG22/Understanding/parsing.html` |

**Version Compatibility:**

The `understandingUrl` field always points to WCAG 2.2 documentation (`/WCAG22/`), which includes backward compatibility information for all WCAG versions (2.0, 2.1, 2.2). The W3.org documentation automatically shows version-specific information based on the criterion.

**Data Maintenance:**

- Tooltip content (`howToTest`) is manually curated in the codebase
- W3.org URLs are maintained to match official W3.org documentation structure
- URLs are verified to ensure they point to correct Understanding WCAG pages
- If W3.org URL structure changes, all `understandingUrl` fields in `WCAG_CRITERIA` array must be updated

### Dashboard Tooltips

#### View Mode Toggle
**Trigger:** Grid/Table view toggle button
**Content:**
```
Switch to {grid|table} view
```
**Context:** Appears on hover over view mode toggle button

#### URL Copy Tooltip
**Trigger:** Hover over truncated URL in table
**Content:**
```
Full URL:
{full page URL}

Click to copy
```
**Context:** Shows full URL and copy instruction. Changes to "Copied!" with checkmark after copying.

#### View Report Button
**Trigger:** Report icon button (when test has results)
**Content:**
```
View Report
```
**Context:** Appears on hover over report button in actions column

#### Open Page Button
**Trigger:** External link icon button
**Content:**
```
Open page in new tab
```
**Context:** Appears on hover over external link button in actions column

### Workspace Tooltips

#### Settings Button
**Trigger:** Settings icon button in header
**Content:**
```
Settings
```
**Context:** Opens settings sheet for WCAG version and level configuration

#### Criterion Info Tooltip
**Trigger:** Info icon button on each criterion card
**Content:**
```
{criterion.title}

{criterion.howToTest}

WCAG {criterion.wcagId} • Level {criterion.level}

View Understanding WCAG →
```
**Data Source:** 
- Extracted from `WCAG_CRITERIA` array in `src/lib/wcag-complete.ts`
- `criterion.title`: Criterion title from WCAG data
- `criterion.howToTest`: Testing instructions from WCAG data
- `criterion.wcagId`: WCAG identifier (e.g., "1.1.1")
- `criterion.level`: Conformance level (A, AA, AAA)
- `criterion.understandingUrl`: Link to W3.org Understanding WCAG page

**Context:** 
- Displays criterion title
- Shows "How to Test" instructions (from `howToTest` field)
- Displays WCAG ID and level
- Includes clickable link to Understanding WCAG documentation (opens W3.org in new tab)
- Maximum width: 28rem (max-w-md)
- Positioned on left side of trigger

**Implementation:**
- Rendered in `WCAGManualChecklist.tsx` component
- Uses `TooltipProvider`, `Tooltip`, `TooltipTrigger`, and `TooltipContent` from `@/components/ui/tooltip`
- Link uses `criterion.understandingUrl` with `target="_blank"` and `rel="noopener noreferrer"`

### Component-Specific Tooltips

#### Evidence Upload Dialog
**No tooltips** - Uses dialog interface with clear labels and instructions

#### Test Note Dialog
**No tooltips** - Uses dialog interface with guidelines section

#### Progress Indicator
**No tooltip** - Visual progress bar with percentage display

### Tooltip Implementation Details

**Component:** `@/components/ui/tooltip`
- Uses Radix UI Tooltip primitive
- Styled with Tailwind CSS
- Supports dark mode
- Accessible with keyboard navigation

**Styling:**
- Background: `bg-gray-900` (light) / `bg-gray-100` (dark)
- Text: `text-white` (light) / `text-gray-900` (dark)
- Border: `border-gray-200` (light) / `border-gray-700` (dark)
- Shadow: `shadow-lg`
- Animation: Fade and zoom in/out
- Max width: `max-w-xs` (default) or `max-w-md` (for criterion info)

**Accessibility:**
- Keyboard accessible
- Screen reader compatible
- Proper ARIA attributes
- Focus management

---

## Additional Specifications

### API Endpoints

#### POST `/api/manual-testing/sessions`
**Purpose:** Save or update a test session
**Method:** POST
**Body:** `TestSession` JSON object
**Response:** Success status

#### GET `/api/manual-testing/sessions?testId={testId}`
**Purpose:** Retrieve a specific test session
**Method:** GET
**Query Parameters:** `testId` (string)
**Response:** `TestSession` JSON object

#### PUT `/api/manual-testing/sessions`
**Purpose:** Retrieve all test sessions
**Method:** PUT
**Response:** Array of `TestSession` objects

#### POST `/api/manual-testing/evidence`
**Purpose:** Upload evidence file
**Method:** POST
**Body:** FormData with:
- `file`: File object
- `testId`: string
- `wcagId`: string
- `evidenceType`: EvidenceType string
**Response:** Success status and file path

#### GET `/api/manual-testing/export?testId={testId}`
**Purpose:** Export test session to CSV
**Method:** GET
**Query Parameters:** `testId` (string)
**Response:** CSV file download

### File Format Specifications

#### CSV Export Format

**Structure:**
1. **Header Section:**
   - "Manual Testing Report"
   - Empty line
   - "Test Information" section
   - Metadata rows (Test ID, Page URL, Organization, etc.)
   - Empty line

2. **Summary Section:**
   - "Summary Statistics" section
   - Statistics rows (Total Criteria, Completed, Passed, Failed, etc.)
   - Empty line

3. **Criteria Section:**
   - "Criteria Results" section
   - Header row: `WCAG ID,Criterion Title,Principle,Level,Status,Note,Evidence Count,Evidence Files,Last Updated`
   - Data rows for each criterion

**CSV Escaping:**
- Fields containing commas, quotes, or newlines are wrapped in double quotes
- Double quotes within fields are escaped as `""`
- Empty/null values are represented as empty strings

### Validation Rules

#### Test Session Validation
- `pageUrl`: Required, must be valid URL format
- `testId`: Required, must match format `test_{timestamp}_{randomString}`
- `wcagVersion`: Required, must be one of: '2.0', '2.1', '2.2'
- `level`: Required, must be one of: 'A', 'AA', 'AAA'
- `startedAt`: Required, must be valid ISO 8601 timestamp
- `lastUpdatedAt`: Required, must be valid ISO 8601 timestamp

#### Criterion Result Validation
- `wcagId`: Required, must match WCAG criterion ID format (e.g., "1.1.1")
- `status`: Required, must be one of: 'Pass', 'Fail', 'N/A', 'Needs Senior Review'
- `note`: Optional, maximum 2000 characters
- `evidence`: Required array (can be empty)
- `lastUpdated`: Required, must be valid ISO 8601 timestamp

#### Evidence Validation
- `id`: Required, must be valid UUID
- `type`: Required, must be one of: 'Photo', 'Video', 'Audio', 'Code Snippet'
- `filename`: Required, non-empty string
- `uploadedAt`: Required, must be valid ISO 8601 timestamp
- `caption`: Optional string

#### File Upload Validation
- **Photo**: JPG, JPEG, PNG, GIF, WebP
- **Video**: MP4, MOV, WebM, AVI
- **Audio**: MP3, WAV, M4A, OGG
- **Code Snippet**: TXT, MD, JS, TS, TSX, CSS, HTML, JSON

### Error Handling

#### Session Loading Errors
- If localStorage fails: Attempt API load
- If API fails: Display error message
- If session not found: Redirect to dashboard with error

#### Auto-Save Errors
- Errors logged to console
- User notified via "Saving..." indicator
- Session remains in localStorage as backup
- Retry mechanism on next change

#### File Upload Errors
- Validation errors: Display in upload dialog
- Network errors: Show error message on file card
- File size limits: Enforced by server (if configured)

### Performance Considerations

#### Auto-Save Debouncing
- 300ms delay prevents excessive API calls
- Batches multiple rapid changes
- Clears timeout on new changes

#### Large File Handling
- Evidence files stored separately from session JSON
- Session JSON only contains file references
- Lazy loading of evidence files in report view

#### Local Storage Limits
- Browser localStorage typically limited to 5-10MB
- Large sessions may exceed limit
- Fallback to API storage for large sessions

---

## Version History

**Current Version:** 1.0
**Last Updated:** 2025-01-10
**Document Status:** Active

---

## Appendix

### Related Documentation
- WCAG 2.2 Guidelines: https://www.w3.org/WAI/WCAG22/quickref/
- Understanding WCAG: https://www.w3.org/WAI/WCAG22/Understanding/
- CSV Parser Documentation: See `src/lib/csv-parser.ts`
- WCAG Complete Data: See `src/lib/wcag-complete.ts`

### Code References
- Main Library: `src/lib/manual-testing.ts`
- Dashboard Component: `src/app/(cc)/manual-testing/page.tsx`
- Workspace Component: `src/app/(cc)/manual-testing/[testId]/page.tsx`
- Checklist Component: `src/components/cc/WCAGManualChecklist.tsx`
- Report Component: `src/components/cc/ManualTestingReport.tsx`
- Evidence Upload: `src/components/cc/EvidenceUploadDialog.tsx`
- Note Dialog: `src/components/cc/TestNoteDialog.tsx`

