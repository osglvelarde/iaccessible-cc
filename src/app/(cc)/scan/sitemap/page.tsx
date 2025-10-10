"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Download, 
  Send, 
  Filter, 
  X, 
  Search,
  Home,
  ExternalLink,
  FileText,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Eye,
  Calendar,
  Globe,
  BarChart3,
  PieChart,
  Hash,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import SitemapDetailsDrawer from "@/components/cc/SitemapDetailsDrawer";

// Types
interface SitemapPage {
  url: string;
  parentUrl?: string;
  relation: 'Internal' | 'External';
  domain: string;
  fileType: string;
  isPdf: boolean;
  depth: number;
  lastModified?: string;
  scannedAt: string;
  title?: string;
  statusCode?: number;
}

interface SitemapSummary {
  totalPages: number;
  internalPages: number;
  externalPages: number;
  pdfCount: number;
  pdfPercentage: number;
  fileTypes: { [key: string]: number };
  topDomains: { domain: string; count: number }[];
  maxDepth: number;
}

interface FilterState {
  search: string;
  relation: 'Internal' | 'External' | 'All';
  fileTypes: string[];
  domains: string[];
  pathPrefix: string;
  includeRegex: string;
  excludeRegex: string;
  depth: [number, number];
  scannedDateRange: [string, string];
  lastModifiedRange: [string, string];
  orphanCandidates: boolean;
}

interface TreeNode {
  url: string;
  title: string;
  fileType: string;
  relation: 'Internal' | 'External';
  depth: number;
  children: TreeNode[];
  pageCount: number;
  pdfCount: number;
}

// Comprehensive mock data showcasing full sitemap potential
const mockSitemapData: SitemapPage[] = [
  // Main site structure
  {
    url: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 0,
    lastModified: "2024-01-15T10:30:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Homepage - Department of Digital Services",
    statusCode: 200
  },
  {
    url: "https://example.gov/about",
    parentUrl: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-14T09:15:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "About Us",
    statusCode: 200
  },
  {
    url: "https://example.gov/about/leadership",
    parentUrl: "https://example.gov/about",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-13T14:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Leadership Team",
    statusCode: 200
  },
  {
    url: "https://example.gov/about/team",
    parentUrl: "https://example.gov/about",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-13T14:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Our Team",
    statusCode: 200
  },
  {
    url: "https://example.gov/about/history",
    parentUrl: "https://example.gov/about",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-12T11:45:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Department History",
    statusCode: 200
  },
  {
    url: "https://example.gov/services",
    parentUrl: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-12T11:45:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Services",
    statusCode: 200
  },
  {
    url: "https://example.gov/services/accessibility",
    parentUrl: "https://example.gov/services",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-11T16:30:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Accessibility Services",
    statusCode: 200
  },
  {
    url: "https://example.gov/services/web-development",
    parentUrl: "https://example.gov/services",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-10T14:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Web Development Services",
    statusCode: 200
  },
  {
    url: "https://example.gov/services/consulting",
    parentUrl: "https://example.gov/services",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-09T13:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Digital Consulting",
    statusCode: 200
  },
  {
    url: "https://example.gov/contact",
    parentUrl: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-09T13:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Contact Us",
    statusCode: 200
  },
  {
    url: "https://example.gov/contact/offices",
    parentUrl: "https://example.gov/contact",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-08T10:15:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Office Locations",
    statusCode: 200
  },
  {
    url: "https://example.gov/contact/support",
    parentUrl: "https://example.gov/contact",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-07T16:45:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Technical Support",
    statusCode: 200
  },
  
  // Resources section
  {
    url: "https://example.gov/resources",
    parentUrl: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-06T12:30:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Resources",
    statusCode: 200
  },
  {
    url: "https://example.gov/resources/guides",
    parentUrl: "https://example.gov/resources",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-05T14:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "User Guides",
    statusCode: 200
  },
  {
    url: "https://example.gov/resources/templates",
    parentUrl: "https://example.gov/resources",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-04T11:10:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Document Templates",
    statusCode: 200
  },
  
  // PDF Documents
  {
    url: "https://example.gov/documents/annual-report-2023.pdf",
    parentUrl: "https://example.gov/resources",
    relation: "Internal",
    domain: "example.gov",
    fileType: "PDF",
    isPdf: true,
    depth: 2,
    lastModified: "2024-01-10T16:30:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Annual Report 2023",
    statusCode: 200
  },
  {
    url: "https://example.gov/documents/accessibility-guidelines.pdf",
    parentUrl: "https://example.gov/resources/guides",
    relation: "Internal",
    domain: "example.gov",
    fileType: "PDF",
    isPdf: true,
    depth: 3,
    lastModified: "2024-01-09T14:15:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Accessibility Guidelines",
    statusCode: 200
  },
  {
    url: "https://example.gov/documents/wcag-checklist.pdf",
    parentUrl: "https://example.gov/resources/guides",
    relation: "Internal",
    domain: "example.gov",
    fileType: "PDF",
    isPdf: true,
    depth: 3,
    lastModified: "2024-01-08T09:30:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "WCAG 2.2 Checklist",
    statusCode: 200
  },
  {
    url: "https://example.gov/documents/design-system.pdf",
    parentUrl: "https://example.gov/resources/templates",
    relation: "Internal",
    domain: "example.gov",
    fileType: "PDF",
    isPdf: true,
    depth: 3,
    lastModified: "2024-01-07T13:45:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Design System Guidelines",
    statusCode: 200
  },
  {
    url: "https://example.gov/documents/security-policy.pdf",
    parentUrl: "https://example.gov/resources",
    relation: "Internal",
    domain: "example.gov",
    fileType: "PDF",
    isPdf: true,
    depth: 2,
    lastModified: "2024-01-06T16:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Information Security Policy",
    statusCode: 200
  },
  
  // CSS and JS files
  {
    url: "https://example.gov/assets/css/main.css",
    parentUrl: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "CSS",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-15T08:00:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Main Stylesheet",
    statusCode: 200
  },
  {
    url: "https://example.gov/assets/css/components.css",
    parentUrl: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "CSS",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-14T15:30:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Component Styles",
    statusCode: 200
  },
  {
    url: "https://example.gov/assets/js/main.js",
    parentUrl: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "JS",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-15T09:15:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Main JavaScript",
    statusCode: 200
  },
  {
    url: "https://example.gov/assets/js/accessibility.js",
    parentUrl: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "JS",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-14T11:45:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Accessibility Scripts",
    statusCode: 200
  },
  
  // External links
  {
    url: "https://www.section508.gov",
    relation: "External",
    domain: "section508.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 0,
    lastModified: "2024-01-11T08:00:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Section 508 Information",
    statusCode: 200
  },
  {
    url: "https://www.w3.org/WAI/WCAG21/quickref/",
    relation: "External",
    domain: "w3.org",
    fileType: "HTML",
    isPdf: false,
    depth: 0,
    lastModified: "2024-01-10T12:30:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "WCAG Quick Reference",
    statusCode: 200
  },
  {
    url: "https://www.ada.gov",
    relation: "External",
    domain: "ada.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 0,
    lastModified: "2024-01-09T14:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "ADA Information",
    statusCode: 200
  },
  {
    url: "https://github.com/example-gov/accessibility-tools",
    relation: "External",
    domain: "github.com",
    fileType: "HTML",
    isPdf: false,
    depth: 0,
    lastModified: "2024-01-08T16:45:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Accessibility Tools Repository",
    statusCode: 200
  },
  
  // Subdomain content
  {
    url: "https://blog.example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 0,
    lastModified: "2024-01-13T10:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Digital Services Blog",
    statusCode: 200
  },
  {
    url: "https://blog.example.gov/accessibility-trends-2024",
    parentUrl: "https://blog.example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-12T14:30:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Accessibility Trends for 2024",
    statusCode: 200
  },
  {
    url: "https://blog.example.gov/wcag-2-2-updates",
    parentUrl: "https://blog.example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-11T09:15:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "WCAG 2.2 Updates and Impact",
    statusCode: 200
  },
  
  // API endpoints
  {
    url: "https://api.example.gov/v1/accessibility-check",
    parentUrl: "https://example.gov/services/accessibility",
    relation: "Internal",
    domain: "example.gov",
    fileType: "API",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-14T13:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Accessibility Check API",
    statusCode: 200
  },
  {
    url: "https://api.example.gov/v1/scan-results",
    parentUrl: "https://example.gov/services/accessibility",
    relation: "Internal",
    domain: "example.gov",
    fileType: "API",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-13T11:45:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Scan Results API",
    statusCode: 200
  },
  
  // Error pages and redirects
  {
    url: "https://example.gov/old-page",
    parentUrl: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 1,
    lastModified: "2023-12-15T10:30:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Old Page (Redirect)",
    statusCode: 301
  },
  {
    url: "https://example.gov/404",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 0,
    lastModified: "2024-01-01T00:00:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "404 Not Found",
    statusCode: 404
  },
  
  // Orphan pages (no parent)
  {
    url: "https://example.gov/standalone-page",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 0,
    lastModified: "2024-01-05T16:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Standalone Page",
    statusCode: 200
  },
  {
    url: "https://example.gov/legacy-content",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 0,
    lastModified: "2023-11-20T14:30:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Legacy Content",
    statusCode: 200
  },
  
  // Deep nested content
  {
    url: "https://example.gov/services/accessibility/audits/comprehensive",
    parentUrl: "https://example.gov/services/accessibility",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 3,
    lastModified: "2024-01-12T10:15:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Comprehensive Accessibility Audits",
    statusCode: 200
  },
  {
    url: "https://example.gov/services/accessibility/audits/quick-scan",
    parentUrl: "https://example.gov/services/accessibility",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 3,
    lastModified: "2024-01-11T15:30:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Quick Accessibility Scan",
    statusCode: 200
  },
  {
    url: "https://example.gov/services/accessibility/training/basic",
    parentUrl: "https://example.gov/services/accessibility",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 3,
    lastModified: "2024-01-10T12:45:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Basic Accessibility Training",
    statusCode: 200
  },
  {
    url: "https://example.gov/services/accessibility/training/advanced",
    parentUrl: "https://example.gov/services/accessibility",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 3,
    lastModified: "2024-01-09T14:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Advanced Accessibility Training",
    statusCode: 200
  },
  
  // Additional file types
  {
    url: "https://example.gov/assets/images/logo.svg",
    parentUrl: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "SVG",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-15T08:30:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Logo SVG",
    statusCode: 200
  },
  {
    url: "https://example.gov/assets/images/hero-banner.jpg",
    parentUrl: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "JPG",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-14T16:45:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Hero Banner Image",
    statusCode: 200
  },
  {
    url: "https://example.gov/assets/documents/presentation.pptx",
    parentUrl: "https://example.gov/resources",
    relation: "Internal",
    domain: "example.gov",
    fileType: "PPTX",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-13T11:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Accessibility Presentation",
    statusCode: 200
  },
  {
    url: "https://example.gov/assets/documents/data.xlsx",
    parentUrl: "https://example.gov/resources",
    relation: "Internal",
    domain: "example.gov",
    fileType: "XLSX",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-12T13:15:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Accessibility Metrics Data",
    statusCode: 200
  }
];

const mockSummary: SitemapSummary = {
  totalPages: 7,
  internalPages: 6,
  externalPages: 1,
  pdfCount: 1,
  pdfPercentage: 14.3,
  fileTypes: { "HTML": 6, "PDF": 1 },
  topDomains: [
    { domain: "example.gov", count: 6 },
    { domain: "partner.org", count: 1 }
  ],
  maxDepth: 2
};

// Tree building functions
const buildTreeStructure = (pages: SitemapPage[]): TreeNode[] => {
  const rootPages = pages.filter(page => page.depth === 0);
  return rootPages.map(page => buildTreeNode(page, pages));
};

const buildTreeNode = (page: SitemapPage, allPages: SitemapPage[]): TreeNode => {
  const children = allPages.filter(p => p.parentUrl === page.url);
  const childNodes = children.map(child => buildTreeNode(child, allPages));
  
  const pageCount = childNodes.reduce((sum, child) => sum + child.pageCount, 0) + 1;
  const pdfCount = childNodes.reduce((sum, child) => sum + child.pdfCount, 0) + (page.isPdf ? 1 : 0);
  
  return {
    url: page.url,
    title: page.title || page.url,
    fileType: page.fileType,
    relation: page.relation,
    depth: page.depth,
    children: childNodes,
    pageCount,
    pdfCount
  };
};

// TreeNode component
interface TreeNodeProps {
  node: TreeNode;
  level: number;
  onNodeClick: (url: string) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (url: string) => void;
}

const TreeNode = ({ node, level, onNodeClick, expandedNodes, onToggleExpand }: TreeNodeProps) => {
  const isExpanded = expandedNodes.has(node.url);
  const hasChildren = node.children.length > 0;
  const indent = level * 20;

  const handleClick = () => {
    if (hasChildren) {
      onToggleExpand(node.url);
    }
    onNodeClick(node.url);
  };

  return (
    <div>
      <div 
        className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer group"
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="w-4" />
        )}
        
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {hasChildren ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
          
          <span className="text-sm truncate group-hover:text-foreground">
            {node.title}
          </span>
          
          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="text-xs">
              {node.fileType}
            </Badge>
            
            {node.pageCount > 1 && (
              <Badge variant="secondary" className="text-xs">
                {node.pageCount}
              </Badge>
            )}
            
            {node.pdfCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {node.pdfCount} PDF
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {node.children.map(child => (
            <TreeNode
              key={child.url}
              node={child}
              level={level + 1}
              onNodeClick={onNodeClick}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function SitemapGeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [activeTab, setActiveTab] = useState("table");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: keyof SitemapPage; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedPage, setSelectedPage] = useState<SitemapPage | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [collapseSingleChildChains, setCollapseSingleChildChains] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    relation: "Internal",
    fileTypes: ["HTML", "PDF", "CSS", "JS"],
    domains: [],
    pathPrefix: "",
    includeRegex: "",
    excludeRegex: "",
    depth: [0, 10],
    scannedDateRange: ["", ""],
    lastModifiedRange: ["", ""],
    orphanCandidates: false
  });

  // URL state management
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const urlFilters = {
      search: params.get('search') || '',
      relation: (params.get('relation') as 'Internal' | 'External' | 'All') || 'Internal',
      fileTypes: params.get('fileTypes')?.split(',') || ['HTML', 'PDF', 'CSS', 'JS'],
      domains: params.get('domains')?.split(',') || [],
      pathPrefix: params.get('pathPrefix') || '',
      includeRegex: params.get('includeRegex') || '',
      excludeRegex: params.get('excludeRegex') || '',
      depth: params.get('depth')?.split(',').map(Number) as [number, number] || [0, 10],
      scannedDateRange: params.get('scannedDateRange')?.split(',') as [string, string] || ['', ''],
      lastModifiedRange: params.get('lastModifiedRange')?.split(',') as [string, string] || ['', ''],
      orphanCandidates: params.get('orphanCandidates') === 'true'
    };
    setFilters(urlFilters);
    setSearchValue(urlFilters.search);
  }, [searchParams]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.relation !== 'Internal') params.set('relation', filters.relation);
    if (filters.fileTypes.length !== 4 || !filters.fileTypes.includes('HTML') || !filters.fileTypes.includes('PDF') || !filters.fileTypes.includes('CSS') || !filters.fileTypes.includes('JS')) {
      params.set('fileTypes', filters.fileTypes.join(','));
    }
    if (filters.domains.length > 0) params.set('domains', filters.domains.join(','));
    if (filters.pathPrefix) params.set('pathPrefix', filters.pathPrefix);
    if (filters.includeRegex) params.set('includeRegex', filters.includeRegex);
    if (filters.excludeRegex) params.set('excludeRegex', filters.excludeRegex);
    if (filters.depth[0] !== 0 || filters.depth[1] !== 10) params.set('depth', filters.depth.join(','));
    if (filters.scannedDateRange[0] || filters.scannedDateRange[1]) params.set('scannedDateRange', filters.scannedDateRange.join(','));
    if (filters.lastModifiedRange[0] || filters.lastModifiedRange[1]) params.set('lastModifiedRange', filters.lastModifiedRange.join(','));
    if (filters.orphanCandidates) params.set('orphanCandidates', 'true');
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  // Debounced search
  const [searchValue, setSearchValue] = useState(filters.search);
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchValue }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = mockSitemapData.filter(page => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!page.url.toLowerCase().includes(searchLower) && 
            !(page.parentUrl?.toLowerCase().includes(searchLower))) {
          return false;
        }
      }

      // Relation filter
      if (filters.relation !== 'All' && page.relation !== filters.relation) {
        return false;
      }

      // File type filter
      if (filters.fileTypes.length > 0 && !filters.fileTypes.includes(page.fileType)) {
        return false;
      }

      // Domain filter
      if (filters.domains.length > 0 && !filters.domains.includes(page.domain)) {
        return false;
      }

      // Path prefix filter
      if (filters.pathPrefix && !page.url.includes(filters.pathPrefix)) {
        return false;
      }

      // Depth filter
      if (page.depth < filters.depth[0] || page.depth > filters.depth[1]) {
        return false;
      }

      // Orphan candidates filter
      if (filters.orphanCandidates && page.parentUrl) {
        return false;
      }

      return true;
    });

    // Sort
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [filters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Summary calculation
  const summary = useMemo(() => {
    const internal = filteredData.filter(p => p.relation === 'Internal').length;
    const external = filteredData.filter(p => p.relation === 'External').length;
    const pdfs = filteredData.filter(p => p.isPdf).length;
    
    const fileTypes: { [key: string]: number } = {};
    filteredData.forEach(page => {
      fileTypes[page.fileType] = (fileTypes[page.fileType] || 0) + 1;
    });

    const domains: { [key: string]: number } = {};
    filteredData.forEach(page => {
      domains[page.domain] = (domains[page.domain] || 0) + 1;
    });

    return {
      totalPages: filteredData.length,
      internalPages: internal,
      externalPages: external,
      pdfCount: pdfs,
      pdfPercentage: filteredData.length > 0 ? (pdfs / filteredData.length) * 100 : 0,
      fileTypes,
      topDomains: Object.entries(domains)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      maxDepth: Math.max(...filteredData.map(p => p.depth), 0)
    };
  }, [filteredData]);

  // Handlers
  const handleSort = (key: keyof SitemapPage) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(p => p.url)));
    }
  };

  const handleRowSelect = (url: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedRows(newSelected);
  };

  const handleExport = (format: 'CSV' | 'JSON') => {
    const data = selectedRows.size > 0 
      ? filteredData.filter(p => selectedRows.has(p.url))
      : filteredData;
    
    if (data.length === 0) {
      console.log('No data to export');
      return;
    }

    if (data.length > 200000) {
      const fileCount = Math.ceil(data.length / 200000);
      console.log(`Large export detected. This export will be split into ${fileCount} files.`);
    }
    
    if (format === 'CSV') {
      const csv = [
        ['URL', 'Parent URL', 'Relation', 'Domain', 'File Type', 'Depth', 'Last Modified', 'Scanned At'],
        ...data.map(page => [
          page.url,
          page.parentUrl || '',
          page.relation,
          page.domain,
          page.fileType,
          page.depth.toString(),
          page.lastModified || '',
          page.scannedAt
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sitemap-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      console.log(`Exported ${data.length} pages as CSV`);
    } else {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sitemap-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      console.log(`Exported ${data.length} pages as JSON`);
    }
  };

  const handleSendTo = (tool: 'Webpage Scan' | 'Readability' | 'WAVE') => {
    const urls = selectedRows.size > 0 
      ? Array.from(selectedRows)
      : filteredData.map(p => p.url);
    
    if (urls.length === 0) {
      console.log('No URLs selected to send');
      return;
    }
    
    // Simulate API call
    const jobId = `JOB_${Date.now()}`;
    console.log(`Queued for ${tool}. Job ID: ${jobId}. URLs: ${urls.length}`);
    
    // In real implementation, this would queue the jobs and show a toast
    // For now, we'll just log the success
    console.log(`Successfully queued ${urls.length} URLs for ${tool} analysis`);
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      search: "",
      relation: "Internal",
      fileTypes: ["HTML", "PDF", "CSS", "JS"],
      domains: [],
      pathPrefix: "",
      includeRegex: "",
      excludeRegex: "",
      depth: [0, 10],
      scannedDateRange: ["", ""],
      lastModifiedRange: ["", ""],
      orphanCandidates: false
    });
    setSearchValue("");
    setCurrentPage(1);
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'HTML': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
      case 'PDF': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
      case 'CSS': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700';
      case 'JS': return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700';
      case 'API': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
      case 'SVG': return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700';
      case 'JPG': return 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-700';
      case 'PNG': return 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-700';
      case 'PPTX': return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700';
      case 'XLSX': return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700';
      case 'DOCX': return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getRelationIcon = (relation: string) => {
    return relation === 'Internal' ? <Home className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />;
  };

  // Tree interaction handlers
  const handleNodeClick = (url: string) => {
    // Extract path from URL for filtering
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      if (path && path !== '/') {
        handleFilterChange('pathPrefix', path);
        setSelectedPath(path);
        setActiveTab('table'); // Switch to table view
      } else {
        // Root level - clear path filter
        handleFilterChange('pathPrefix', '');
        setSelectedPath(null);
      }
    } catch (error) {
      console.error('Invalid URL:', url);
    }
  };

  const handleToggleExpand = (url: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(url)) {
      newExpanded.delete(url);
    } else {
      newExpanded.add(url);
    }
    setExpandedNodes(newExpanded);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Sitemap Generator</h1>
            <Badge variant="outline" className="text-sm">
              Site Structure Analysis
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Command Center
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Crawl results from your subscription service, filtered and ready for export.</h2>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Export sitemap data">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('CSV')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('JSON')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={selectedRows.size === 0}
                  aria-label={`Send ${selectedRows.size > 0 ? selectedRows.size : 'all'} selected pages to analysis tools`}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleSendTo('Webpage Scan')}>
                  <Eye className="h-4 w-4 mr-2" />
                  Webpage Scan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSendTo('Readability')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Readability
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSendTo('WAVE')}>
                  <Globe className="h-4 w-4 mr-2" />
                  WAVE
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pages</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="text-2xl font-bold">{summary.totalPages.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">total pages</div>
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Internal vs External</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="text-2xl font-bold">{summary.internalPages}</div>
              <div className="text-sm text-muted-foreground">internal • {summary.externalPages} external</div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${summary.totalPages > 0 ? (summary.internalPages / summary.totalPages) * 100 : 0}%` }}
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">PDFs</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="text-2xl font-bold">{summary.pdfCount}</div>
              <div className="text-sm text-muted-foreground">{summary.pdfPercentage.toFixed(1)}% of filtered set</div>
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">File Types</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="space-y-1">
                {Object.entries(summary.fileTypes).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span>{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Domains</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="space-y-1">
                {summary.topDomains.slice(0, 3).map(({ domain, count }) => (
                  <div key={domain} className="flex justify-between text-sm">
                    <span className="truncate">{domain}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {summary.topDomains.length > 3 && (
                  <div className="text-sm text-muted-foreground">
                    +{summary.topDomains.length - 3} more
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Rail */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Filters</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              {showFilters && (
                <div className="px-6 pb-6 space-y-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search URLs..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Relation */}
                  <div className="space-y-2">
                    <Label>Relation</Label>
                    <div className="space-y-2">
                      {['All', 'Internal', 'External'].map((relation) => (
                        <div key={relation} className="flex items-center space-x-2">
                          <Checkbox
                            id={`relation-${relation}`}
                            checked={filters.relation === relation}
                            onCheckedChange={() => handleFilterChange('relation', relation)}
                          />
                          <Label htmlFor={`relation-${relation}`} className="text-sm">
                            {relation}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* File Types */}
                  <div className="space-y-2">
                    <Label>File Type</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {['HTML', 'PDF', 'CSS', 'JS', 'API', 'SVG', 'JPG', 'PNG', 'PPTX', 'XLSX', 'DOCX'].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`filetype-${type}`}
                            checked={filters.fileTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleFilterChange('fileTypes', [...filters.fileTypes, type]);
                              } else {
                                handleFilterChange('fileTypes', filters.fileTypes.filter(t => t !== type));
                              }
                            }}
                          />
                          <Label htmlFor={`filetype-${type}`} className="text-sm">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Path Prefix */}
                  <div className="space-y-2">
                    <Label htmlFor="pathPrefix">Path starts with</Label>
                    <Input
                      id="pathPrefix"
                      placeholder="/about"
                      value={filters.pathPrefix}
                      onChange={(e) => handleFilterChange('pathPrefix', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Start with a forward slash, for example /about</p>
                  </div>

                  {/* Include Regex */}
                  <div className="space-y-2">
                    <Label htmlFor="includeRegex">Include regex</Label>
                    <Input
                      id="includeRegex"
                      placeholder="Pattern..."
                      value={filters.includeRegex}
                      onChange={(e) => handleFilterChange('includeRegex', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Patterns run on the server, complex searches time out.</p>
                  </div>

                  {/* Exclude Regex */}
                  <div className="space-y-2">
                    <Label htmlFor="excludeRegex">Exclude regex</Label>
                    <Input
                      id="excludeRegex"
                      placeholder="Pattern..."
                      value={filters.excludeRegex}
                      onChange={(e) => handleFilterChange('excludeRegex', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Patterns run on the server, complex searches time out.</p>
                  </div>

                  {/* Depth */}
                  <div className="space-y-2">
                    <Label>Depth: {filters.depth[0]} - {filters.depth[1]}</Label>
                    <Slider
                      value={filters.depth}
                      onValueChange={(value) => handleFilterChange('depth', value)}
                      max={summary.maxDepth}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Orphan Candidates */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="orphanCandidates"
                        checked={filters.orphanCandidates}
                        onCheckedChange={(checked) => handleFilterChange('orphanCandidates', checked)}
                      />
                      <Label htmlFor="orphanCandidates" className="text-sm">
                        Orphan candidates
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">Items without a known parent link in this crawl.</p>
                  </div>

                  {/* Clear All */}
                  <div className="pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={clearAllFilters} className="w-full">
                      Clear all filters
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {filteredData.length} results
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Content Tabs */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="structure">Structure</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>

              <TabsContent value="structure" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Site Structure</CardTitle>
                        <CardDescription>
                          Interactive tree view of your site structure. Click nodes to apply path filters.
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="collapse-chains"
                          checked={collapseSingleChildChains}
                          onCheckedChange={setCollapseSingleChildChains}
                        />
                        <Label htmlFor="collapse-chains" className="text-sm">
                          Collapse single-child chains
                        </Label>
                      </div>
                    </div>
                  </CardHeader>
                  <div className="p-6 pt-0">
                    {/* Breadcrumb */}
                    {selectedPath && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-muted-foreground">Selected path:</span>
                          <div className="flex items-center space-x-1">
                            <span className="font-mono text-primary">{selectedPath}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPath(null);
                                handleFilterChange('pathPrefix', '');
                              }}
                              className="h-4 w-4 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      {buildTreeStructure(filteredData).map(node => (
                        <TreeNode 
                          key={node.url} 
                          node={node} 
                          level={0}
                          onNodeClick={handleNodeClick}
                          expandedNodes={expandedNodes}
                          onToggleExpand={handleToggleExpand}
                        />
                      ))}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="table" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Sitemap Data</CardTitle>
                        <CardDescription>
                          {selectedRows.size > 0 && `${selectedRows.size} selected • `}
                          {filteredData.length} total pages
                        </CardDescription>
                      </div>
                      {selectedRows.size > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Export Selected
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleExport('CSV')}>
                              <FileText className="h-4 w-4 mr-2" />
                              Export CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('JSON')}>
                              <FileText className="h-4 w-4 mr-2" />
                              Export JSON
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  
                  <div className="p-6 pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full" role="table" aria-label="Sitemap data table">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">
                              <Checkbox
                                checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                                onCheckedChange={handleSelectAll}
                                aria-label="Select all pages"
                              />
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('url')}
                              role="columnheader"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSort('url');
                                }
                              }}
                              aria-sort={sortConfig?.key === 'url' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                              URL
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('relation')}
                              role="columnheader"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSort('relation');
                                }
                              }}
                              aria-sort={sortConfig?.key === 'relation' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                              Relation
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('depth')}
                              role="columnheader"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSort('depth');
                                }
                              }}
                              aria-sort={sortConfig?.key === 'depth' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                              Depth
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('domain')}
                              role="columnheader"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSort('domain');
                                }
                              }}
                              aria-sort={sortConfig?.key === 'domain' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                              Domain
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('fileType')}
                              role="columnheader"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSort('fileType');
                                }
                              }}
                              aria-sort={sortConfig?.key === 'fileType' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                              File Type
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('lastModified')}
                              role="columnheader"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSort('lastModified');
                                }
                              }}
                              aria-sort={sortConfig?.key === 'lastModified' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                              Last Modified
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('scannedAt')}
                              role="columnheader"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSort('scannedAt');
                                }
                              }}
                              aria-sort={sortConfig?.key === 'scannedAt' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                              Scanned At
                            </th>
                            <th className="text-left py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((page) => (
                            <tr key={page.url} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">
                                <Checkbox
                                  checked={selectedRows.has(page.url)}
                                  onCheckedChange={() => handleRowSelect(page.url)}
                                  aria-label={`Select page: ${page.url}`}
                                />
                              </td>
                              <td className="py-3 px-4 max-w-xs">
                                <div className="flex items-center space-x-2">
                                  <span className="truncate">{page.url}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigator.clipboard.writeText(page.url)}
                                    aria-label={`Copy URL: ${page.url}`}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                  {getRelationIcon(page.relation)}
                                  {page.relation}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm">{page.depth}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm">{page.domain}</span>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className={getFileTypeColor(page.fileType)}>
                                  {page.fileType}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm">
                                  {page.lastModified 
                                    ? new Date(page.lastModified).toLocaleDateString()
                                    : '—'
                                  }
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm">
                                  {new Date(page.scannedAt).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedPage(page)}
                                  aria-label={`View details for ${page.url}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Details Drawer */}
        <SitemapDetailsDrawer
          page={selectedPage}
          isOpen={!!selectedPage}
          onClose={() => setSelectedPage(null)}
          onSendTo={handleSendTo}
        />
      </div>
    </div>
  );
}
