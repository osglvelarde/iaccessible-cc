# Project API & Component Documentation

## Overview
- **Framework**: Next.js (App Router, TypeScript)
- **UI**: ShadCN UI, Radix Primitives, TailwindCSS
- **Services**: Local scanner service (Express) for automated accessibility scans
- **Structure**: `src/lib` (APIs/utilities), `src/app/api` (Next.js API routes), `src/components` (UI + feature components)

---

## HTTP APIs (Next.js Routes)

### Users & Roles API
- Base: `/api/users-roles`

#### GET /users
- **Query**: `page`, `pageSize`, `operatingUnitId`, `status`, `groupId`, `search`
- **Returns**: `UsersResponse`
- **Notes**: Lists users with filtering, pagination; enriches with groups and permissions.

#### POST /users
- **Body**: `CreateUserRequest`
- **Returns**: created `UserWithDetails`
- **Edge cases**: 409 if email exists; sets `pending` status and optional invitation fields.

#### PUT /users?userId
- **Body**: `UpdateUserRequest`
- **Returns**: updated `UserWithDetails`
- **Edge cases**: 404 if user not found.

#### DELETE /users?userId
- Soft-deletes by setting status to `inactive`.

#### GET /groups
- **Query**: `page`, `pageSize`, `operatingUnitId`, `type`, `search`
- **Returns**: `GroupsResponse`

#### POST /groups
- **Body**: `CreateGroupRequest`
- **Returns**: created `UserGroup`
- **Edge cases**: 409 on name conflict within operating unit.

#### PUT /groups?groupId
- **Body**: `UpdateGroupRequest`
- **Returns**: updated `UserGroup`
- **Limitations**: 403 for system groups.

#### DELETE /groups?groupId
- **Returns**: `{ success: true }`
- **Limitations**: 403 for system groups.

#### GET /operating-units
- **Query**: `page`, `pageSize`, `organization`, `search`
- **Returns**: `OperatingUnitsResponse`

#### POST /operating-units
- **Body**: `CreateOperatingUnitRequest`
- **Returns**: created `OperatingUnit`
- **Edge cases**: 409 if name exists.

#### PUT /operating-units?ouId
- **Body**: `UpdateOperatingUnitRequest`
- **Returns**: updated `OperatingUnit`

#### DELETE /operating-units?ouId
- **Returns**: `{ success: true }`

### Manual Testing API
- Base: `/api/manual-testing`

#### POST /sessions
- **Body**: `TestSession`
- **Returns**: `{ success: true, testId }`

#### GET /sessions?testId
- **Returns**: `TestSession`
- **Errors**: 404 if not found

#### PUT /sessions
- **Returns**: `TestSession[]` (sorted by `lastUpdatedAt` desc)

#### DELETE /sessions?testId
- Deletes session file and evidence folder.

#### POST /evidence
- **FormData**: `testId`, `wcagId`, `evidenceType`, `file`
- **Returns**: evidence info `{ id, type, filename, uploadedAt, filePath }`

#### GET /evidence?testId
- **Returns**: list of evidence files

#### DELETE /evidence?testId&filename
- Deletes an evidence file.

---

## Client Libraries (`src/lib`)

### scanner-api.ts
- **scanUrl(url, options?) => Promise<ScanResponse>**
  - Sends POST to scanner service `/scan`.
  - Throws on non-2xx.
- **getScanHistory() => Promise<ScanHistoryItem[]>**
- **getScanResult(scanId) => Promise<ScanResponse>**

### scheduler-api.ts
- Types: `ScanType`, `FrequencyType`, `SignInMethod`, `Persona`, `ScheduleConfig`, `OperatingUnit`, `IntakeDomain`
- **createSchedule(config) => { success, scheduleId? , error? }**
- **getOperatingUnits(orgId) => OperatingUnit[]** (mock)
- **getIntakeDomains(operatingUnitId) => IntakeDomain[]** (mock)
- **saveScheduleDraft(config) => { success, draftId? , error? }**
- **validateScheduleConfig(config) => { isValid, errors }**
  - Validates required fields, date/time constraints, domain formats, manual testing URLs, frequency-specific rules, and auth requirements.

### users-roles-api.ts
- Base: `/api/users-roles`
- Users: `getUsers`, `getUserById`, `createUser`, `updateUser`, `deactivateUser`
- Groups: `getGroups`, `getGroupById`, `createGroup`, `updateGroup`, `deleteGroup`
- Operating Units: `getOperatingUnits`, `getOperatingUnitById`, `createOperatingUnit`, `updateOperatingUnit`, `deleteOperatingUnit`
- Permissions helpers: `getUserPermissions`, `checkModuleAccess`, `checkFeatureAccess`, `checkAccessLevel`, `getEffectiveModulePermissions`, `isAdmin`, `canManageUsers`, `canManageGroups`, `canAccessOperatingUnit`

### manual-testing.ts
- Types: `TestStatus`, `EvidenceType`, `TestEvidence`, `CriterionResult`, `TestSession`, `TestSessionSummary`
- **generateTestId() => string**
- **createTestSession(pageUrl, department, organization, wcagVersion?, level?) => TestSession**
- **updateCriterionResult(session, wcagId, status, note?) => TestSession**
- **addEvidenceToCriterion(session, wcagId, evidence) => TestSession**
- **updateCriterionNote(session, wcagId, note) => TestSession**
- **getCriterionResult(session, wcagId) => CriterionResult | null**
- **calculateSessionSummary(session, totalCriteria) => TestSessionSummary**
- **autoSaveSession(session, saveCallback) => void** (300ms debounce)
- Local storage: `saveSessionToLocalStorage`, `loadSessionFromLocalStorage`, `getAllSessionIds`, `deleteSessionFromLocalStorage`
- UI helpers: `getStatusColor`, `getStatusBadgeVariant`, `formatDate`, `getTestStatusFromSession`, `getTestStatusFromSessionSummary`

### wcag-complete.ts
- Data: `WCAG_PRINCIPLES`, `WCAG_CRITERIA`
- Helpers: `getCriteriaForVersion`, `getCriteriaForLevel`, `getCriteriaForVersionAndLevel`, `groupCriteriaByPrinciple`

### users-roles-defaults.ts
- `MODULE_FEATURES` (feature registry per module)
- `PREDEFINED_ROLES` (role templates)
- `DEFAULT_OPERATING_UNITS`, `MOCK_USERS`
- Helpers: `createPredefinedGroupForOperatingUnit`, `getAllModules`, `getModuleFeatures`

### constants.ts
- Types: `ModuleKey`, `Module`, `ModuleGroup`
- Data: `MODULE_GROUPS`, `MODULES`

### utils.ts
- **cn(...inputs) => string** (clsx + tailwind-merge)

### a11y.ts
- **announceToScreenReader(message)**: injects aria-live region; auto-removes.
- **focusElement(selector)**
- **trapFocus(container) => () => void**: returns cleanup to remove keydown handler.

### favorites.ts / recent-modules.ts / csv-parser.ts
- Favorites CRUD in `localStorage`; recent modules; CSV parsing and filtering helpers.

---

## Hooks & Context

### AuthProvider (components/cc/AuthProvider.tsx)
- Context API providing:
  - `user`, `isLoading`
  - `login(email, password) => Promise<boolean>` (mock users)
  - `logout()`
  - `hasPermission(moduleKey, featureKey?)`
  - `hasAccessLevel(moduleKey, requiredLevel)`
  - `getModulePermissions()`
  - `isAdmin()`, `canManageUsers()`, `canManageGroups()`
- Hooks:
  - `useAuth()`
  - `usePermissions()`
  - `useAdmin()`

---

## Components (key props)

### EvidenceUploadDialog
- Props: `{ wcagId, criterionTitle, testId, isOpen, onClose, onUploadComplete(files) }`
- Behavior: drag/drop or select; POST `/api/manual-testing/evidence`; progress simulation; returns successful files.
- Edge cases: validates extensions per evidence type; handles upload errors.

### WCAGManualChecklist
- Props: `{ session, criteria, onStatusChange, onEvidenceUpload, onNoteUpdate }`
- Displays WCAG criteria grouped by principle; integrates `EvidenceUploadDialog` and notes.

### ScanResultsTable
- Props: `{ issues, className? }`
- Renders issues with severity/type badges; expandable details; export action placeholders.

### ScanHistoryTable
- Props: `{ history, className? }`
- Search, filter, sort (date/score), pagination, actions.

### ScanStatus
- Props: `{ isScanning, progress?, status?, onCancel?, className? }`
- Shows animated progress bar and optional cancel.

### QuickActionsBar
- Props: `{ className? }`
- Shortcut buttons to core modules; simulates loading state on click.

### ModuleCard
- Props: `{ title, desc, href }`
- Opens internal route via Next router or external in new tab; records recent module.

### ActivityFeed
- Props: `{ className?, maxItems?, scanHistory? }`
- Uses provided scan history (or mock) to render recent activities.

### UI Primitives (examples)
- `Button`: variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`), sizes (`sm`, `default`, `lg`, `icon`).
- `Tooltip`: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`.
- Others (`Card`, `Badge`, `Input`, `Select`, `RadioGroup`, `Switch`, `Textarea`, etc.) follow standard ShadCN patterns and re-export component functions.

---

## Scanner Service (scanner-service)

### Endpoints
- `GET /health` → `{ status, timestamp, service }`
- `POST /scan` → Transforms IBM accessibility-checker report to UI format and saves JSON
- `GET /scans` → Array of scan summaries
- `GET /scans/:scanId` → Detailed scan result

### Classes
- `AccessibilityScanner`
  - `initialize()`, `scanUrl(url, options)`, `isValidUrl(str)`, `close()`
  - Uses Puppeteer and `accessibility-checker`.
- `ResultTransformer`
  - `transformToUIFormat(ibmReport, url)`
  - `calculateSummary(ibmReport)` (scores, totals, categories)
  - `calculateSeoScore(ibmReport)`, `calculateReadabilityScore(ibmReport)`
  - `transformIssues(ibmResults)` mapping to `{ id, type, severity, description, location, ... }`

---

## Usage Examples

### scanner-api
```ts
import { scanUrl, getScanHistory, getScanResult } from '@/lib/scanner-api';

const res = await scanUrl('https://example.com', { policies: ['IBM_Accessibility'] });
const history = await getScanHistory();
const details = await getScanResult(res.scanId);
```

### manual-testing
```ts
import { createTestSession, updateCriterionResult, addEvidenceToCriterion } from '@/lib/manual-testing';

const session = createTestSession('https://example.com', 'DoT', 'BIS');
const session2 = updateCriterionResult(session, '1.4.3', 'Fail', 'Insufficient contrast');
```

### Auth hooks
```tsx
import { useAuth } from '@/components/cc/AuthProvider';
const { user, login, hasPermission } = useAuth();
```

---

## Best Practices
- Prefer `users-roles-api.ts` helpers over direct fetch for consistent error handling.
- Validate schedule configs with `validateScheduleConfig` before saving.
- Use `cn` for class merging; keep Tailwind classes atomic and composable.
- For accessibility, announce significant updates with `announceToScreenReader` when appropriate.
- Guard browser-only APIs with `typeof window !== 'undefined'` before using `localStorage`.

## Known Limitations
- Users/Groups/Operating Units APIs persist to local JSON; no database.
- Auth is mock-only; replace with real identity provider for production.
- Scanner service must be running on `localhost:4000`.
- Some UI export buttons are placeholders (no actual export implementation).

## Related Modules
- `WCAG` data: `src/lib/wcag-complete.ts`
- Permissions & roles: `src/lib/users-roles-defaults.ts`, `src/lib/types/users-roles.ts`
- UI primitives live under `src/components/ui/*` and are consumed across CC components.
