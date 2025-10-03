"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowLeft, 
  Play, 
  Settings, 
  Download, 
  Eye, 
  RotateCcw,
  Loader2
} from "lucide-react";
import ScanStatus from "@/components/cc/ScanStatus";
import ScanSummaryCards from "@/components/cc/ScanSummaryCards";
import ScanResultsTable from "@/components/cc/ScanResultsTable";
import ScanHistoryTable from "@/components/cc/ScanHistoryTable";
import { cn } from "@/lib/utils";

// Mock data for demonstration
const mockScanResults = {
  url: "https://example.com",
  timestamp: new Date().toISOString(),
  status: "completed",
  summary: {
    accessibilityScore: 85,
    seoScore: 92,
    readabilityScore: 78,
    totalIssues: 12
  },
  issues: [
    {
      id: 1,
      type: "WCAG",
      severity: "critical",
      description: "Missing alt text on images",
      location: "img.hero-banner",
      details: "The hero banner image lacks alternative text, making it inaccessible to screen readers."
    },
    {
      id: 2,
      type: "SEO",
      severity: "warning", 
      description: "Missing meta description",
      location: "head > meta",
      details: "The page lacks a meta description tag, which affects search engine optimization."
    },
    {
      id: 3,
      type: "Readability",
      severity: "warning",
      description: "Long sentence detected",
      location: "p.intro-text",
      details: "Sentence exceeds recommended length for optimal readability."
    }
  ]
};

const mockScanHistory = [
  {
    id: 1,
    url: "https://example.com",
    date: "2024-01-15T10:30:00Z",
    status: "completed",
    accessibilityScore: 85,
    seoScore: 92,
    readabilityScore: 78
  },
  {
    id: 2,
    url: "https://demo.gov",
    date: "2024-01-14T14:20:00Z", 
    status: "completed",
    accessibilityScore: 92,
    seoScore: 88,
    readabilityScore: 85
  },
  {
    id: 3,
    url: "https://test.org",
    date: "2024-01-13T09:15:00Z",
    status: "failed",
    accessibilityScore: null,
    seoScore: null,
    readabilityScore: null
  }
];

export default function WebpageScanPage() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [scanDepth, setScanDepth] = useState("homepage");
  const [includeExternal, setIncludeExternal] = useState(false);
  const [rulesScope, setRulesScope] = useState(["WCAG 2.2", "Section 508"]);

  const handleScan = async () => {
    if (!url || !isValidUrl(url)) return;
    
    setIsScanning(true);
    setScanResults(null);
    
    // Simulate API call
    setTimeout(() => {
      setScanResults(mockScanResults);
      setIsScanning(false);
    }, 3000);
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return string.startsWith('http://') || string.startsWith('https://');
    } catch (_) {
      return false;
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Webpage Scan</h1>
            <Badge variant="outline" className="text-sm">
              Ad-hoc Scanning
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

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Scan Input Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Scan Configuration
            </CardTitle>
            <CardDescription>
              Enter a URL to perform an accessibility, SEO, and readability scan
            </CardDescription>
          </CardHeader>
          <div className="p-6 pt-0 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="Enter the URL of the page to scan…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-11"
                  disabled={isScanning}
                />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleScan} 
                    disabled={!url || !isValidUrl(url) || isScanning}
                    className="h-11 px-6"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Submit Scan
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Start scanning the webpage for accessibility issues</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="p-0 h-auto"
              >
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </Button>
              
              {showAdvanced && (
                <div className="pl-6 space-y-3 border-l-2 border-muted">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Scan Depth</label>
                    <div className="flex gap-2">
                      <Button
                        variant={scanDepth === "homepage" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setScanDepth("homepage")}
                      >
                        Homepage Only
                      </Button>
                      <Button
                        variant={scanDepth === "crawl" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setScanDepth("crawl")}
                      >
                        Full Page Crawl
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">External Links</label>
                    <Button
                      variant={includeExternal ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIncludeExternal(!includeExternal)}
                    >
                      {includeExternal ? "Include" : "Exclude"} External Links
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Scan Status */}
        <ScanStatus 
          isScanning={isScanning}
          progress={60}
          status="Analyzing webpage structure and content..."
          onCancel={() => setIsScanning(false)}
        />

        {/* Results Section */}
        {scanResults && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4">
            {/* Summary Cards */}
            <ScanSummaryCards summary={scanResults.summary} />
            
            {/* Issues Table */}
            <ScanResultsTable issues={scanResults.issues} />
          </div>
        )}

        {/* Scan History */}
        <ScanHistoryTable history={mockScanHistory} />
      </div>
    </div>
  );
}
