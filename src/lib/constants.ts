export type ModuleKey =
    | "dashboard" | "dataQuery" | "webpageScan" | "waveScan" | "pdfScan"
    | "sitemap" | "scanMonitor" | "scansScheduler" | "intake" | "manualTesting"
    | "pdfRemediation" | "guidelines" | "supportBot" | "settings" | "usersRoles";

export interface Module {
    key: ModuleKey;
    title: string;
    desc: string;
    href: string;
    route?: string;
}

export interface ModuleGroup {
    title: string;
    modules: Module[];
}

type Row = [ModuleKey, string, string, string, string, string?];

const rows: Row[] = [
    // Reports & Dashboards
    ["dashboard", "Dashboards and KPIs", "View accessibility metrics, recent scans, compliance status, and alerts.", "NEXT_PUBLIC_DASHBOARD_URL", "https://apps.example.gov/dashboard", "/dashboard"],
    ["dataQuery", "Data Query Module", "Query scan results and accessibility data using filters, search, and exports.", "NEXT_PUBLIC_DATAQUERY_URL", "https://apps.example.gov/data-query", "/data-query"],

    // Scanning Tools
    ["webpageScan", "Webpage Scan", "Run instant ad-hoc scans on any webpage for accessibility, readability, SEO, and GEO compliance.", "NEXT_PUBLIC_WEBSCAN_URL", "/scan/ad-hoc", "/scan/ad-hoc"],
    ["waveScan", "WAVE Webpage Scan", "Run WAVE (Web Accessibility Evaluation) scans on any webpage for comprehensive accessibility analysis.", "NEXT_PUBLIC_WAVESCAN_URL", "/scan/wave", "/scan/wave"],
    ["pdfScan", "PDF Accessibility Scan", "Upload and scan a single PDF against WCAG + PDF/UA standards.", "NEXT_PUBLIC_PDFSCAN_URL", "/scan/pdf", "/scan/pdf"],
    ["sitemap", "Sitemap Generator", "Crawl an entire site, generate a sitemap, visualize structure, and export XML/CSV/JSON.", "NEXT_PUBLIC_SITEMAP_URL", "/scan/sitemap", "/scan/sitemap"],
    ["scanMonitor", "Scans Monitor", "Track scan status: In-progress, Scheduled, Completed, Failed. Shows progress bars, logs, and badge counters.", "NEXT_PUBLIC_SCANMON_URL", "https://apps.example.gov/scans", "/scans"],
    ["scansScheduler", "Scans Scheduler", "Schedule and manage bulk accessibility scans across multiple URLs or domains. Set recurring scan intervals and view results.", "NEXT_PUBLIC_SCANSCHED_URL", "/scans/scheduler", "/scans/scheduler"],

    // Workflows
    ["intake", "Intake Form", "Collect accessibility requirements, department URLs, authentication details, and points of contact.", "NEXT_PUBLIC_INTAKE_URL", "https://apps.example.gov/intake", "/intake"],
    ["manualTesting", "Manual Testing Tool", "Conduct structured manual tests (screen readers, keyboard navigation, color contrast). Upload evidence and apply scoring.", "NEXT_PUBLIC_MANUALTEST_URL", "/manual-testing", "/manual-testing"],

    // Knowledge & Guides
    ["pdfRemediation", "PDF Remediation Module", "Guided remediation workflows for fixing PDF accessibility issues flagged by scans.", "NEXT_PUBLIC_PDFREM_URL", "https://apps.example.gov/pdf-remediation", "/pdf-remediation"],
    ["guidelines", "Guidelines & Resources", "Browse WCAG 2.2, Section 508, ADA Title II, remediation playbooks, and best-practice templates.", "NEXT_PUBLIC_GUIDES_URL", "/guidelines", "/guidelines"],
    ["supportBot", "Training & Customer Service Chatbot", "Interactive chatbot for training, FAQs, and customer support on accessibility compliance.", "NEXT_PUBLIC_SUPPORT_URL", "https://iaccessible.onrender.com/", "/support-bot"],

    // Admin
    ["settings", "Settings", "Manage org details, domains, scheduling, branding, and integrations.", "NEXT_PUBLIC_SETTINGS_URL", "https://apps.example.gov/settings", "/settings"],
    ["usersRoles", "Users & Roles", "Invite/manage users, assign permissions, and track readiness.", "NEXT_PUBLIC_USERS_URL", "/admin/users", "/admin/users"],
];

const allModules: Module[] = rows.map(([key, title, desc, env, def, route]) => ({
    key, title, desc, href: (process.env as Record<string, string>)[env] ?? def, route
}));

export const MODULE_GROUPS: ModuleGroup[] = [
    {
        title: "Reports & Dashboards",
        modules: allModules.filter(m => ["dashboard", "dataQuery"].includes(m.key))
    },
    {
        title: "Scanning Tools",
        modules: allModules.filter(m => ["webpageScan", "waveScan", "pdfScan", "sitemap", "scanMonitor", "scansScheduler"].includes(m.key))
    },
    {
        title: "Workflows",
        modules: allModules.filter(m => ["intake", "manualTesting", "pdfRemediation"].includes(m.key))
    },
    {
        title: "Knowledge & Guides",
        modules: allModules.filter(m => ["guidelines", "supportBot"].includes(m.key))
    },
    {
        title: "Admin",
        modules: allModules.filter(m => ["settings", "usersRoles"].includes(m.key))
    }
];

// Keep backward compatibility
export const MODULES = allModules;