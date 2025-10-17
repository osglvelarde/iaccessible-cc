"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowLeft, 
  Play, 
  Eye, 
  Loader2
} from "lucide-react";
import ScanStatus from "@/components/cc/ScanStatus";
import ScanSummaryCards from "@/components/cc/ScanSummaryCards";
import ScanResultsTable from "@/components/cc/ScanResultsTable";
import ScanHistoryTable from "@/components/cc/ScanHistoryTable";
import { scanUrl, getScanHistory, type ScanResponse, type ScanHistoryItem } from "@/lib/scanner-api";

// Mock data for demonstration

const mockScanHistory = [
  {
    id: "1",
    url: "https://example.com",
    date: "2024-01-15T10:30:00Z",
    status: "completed" as const,
    accessibilityScore: 85,
    seoScore: 92,
    readabilityScore: 78,
    totalIssues: 12
  },
  {
    id: "2",
    url: "https://demo.gov",
    date: "2024-01-14T14:20:00Z", 
    status: "completed" as const,
    accessibilityScore: 92,
    seoScore: 88,
    readabilityScore: 85,
    totalIssues: 5
  },
  {
    id: "3",
    url: "https://test.org",
    date: "2024-01-13T09:15:00Z",
    status: "failed" as const,
    accessibilityScore: null,
    seoScore: null,
    readabilityScore: null,
    totalIssues: 0
  }
];

export default function WebpageScanPage() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResponse | null>(null);
  const [scanDepth, setScanDepth] = useState("homepage");
  const [includeExternal, setIncludeExternal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("");

  // Progress simulation for automated scanning stages
  const simulateProgress = () => {
    const stages = [
      { progress: 10, status: "Initializing automated scanner..." },
      { progress: 20, status: "Connecting to webpage..." },
      { progress: 35, status: "Loading page content..." },
      { progress: 50, status: "Analyzing HTML structure..." },
      { progress: 65, status: "Running automated accessibility checks..." },
      { progress: 80, status: "Validating WCAG compliance..." },
      { progress: 90, status: "Processing automated scan results..." },
      { progress: 95, status: "Generating automated report..." },
      { progress: 100, status: "Automated scan completed!" }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setScanProgress(stages[currentStage].progress);
        setScanStatus(stages[currentStage].status);
        currentStage++;
      } else {
        clearInterval(interval);
      }
    }, 800); // Update every 800ms for realistic feel

    return interval;
  };

  // Load scan history on component mount
  useEffect(() => {
    const loadScanHistory = async () => {
      try {
        const history = await getScanHistory();
        // Filter out any invalid entries
        const validHistory = history.filter(item => 
          item && 
          typeof item === 'object' && 
          item.url && 
          item.status && 
          item.id
        );
        setScanHistory(validHistory);
      } catch (err) {
        console.error('Failed to load scan history:', err);
        // Continue with mock data if API fails
      }
    };
    
    loadScanHistory();
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup any running intervals when component unmounts
      setScanProgress(0);
      setScanStatus("");
    };
  }, []);

  const handleScan = async () => {
    if (!url || !isValidUrl(url)) return;
    
    setIsScanning(true);
    setScanResults(null);
    setError(null);
    setScanProgress(0);
    setScanStatus("");
    
    // Start progress simulation
    const progressInterval = simulateProgress();
    
    try {
      const options = {
        policies: ["IBM_Accessibility", "WCAG_2_1"],
        scanDepth: scanDepth,
        includeExternal: includeExternal
      };
      
      // Perform the actual scan
      const results = await scanUrl(url, options);
      
      // Clear progress interval and set final state
      clearInterval(progressInterval);
      setScanProgress(100);
      setScanStatus("Scan completed!");
      
      // Small delay to show completion
      setTimeout(() => {
        setScanResults(results);
        setIsScanning(false);
        setScanProgress(0);
        setScanStatus("");
      }, 1000);
      
      // Refresh scan history
      const history = await getScanHistory();
      const validHistory = history.filter(item => 
        item && 
        typeof item === 'object' && 
        item.url && 
        item.status && 
        item.id
      );
      setScanHistory(validHistory);
      
    } catch (err) {
      console.error('Scan failed:', err);
      clearInterval(progressInterval);
      setScanProgress(0);
      setScanStatus("");
      setError(err instanceof Error ? err.message : 'Scan failed. Please try again.');
      setIsScanning(false);
    }
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
            <h1 className="text-2xl font-bold">Automated Webpage Scan</h1>
            <Badge variant="outline" className="text-sm">
              Automated Scanning
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
              Enter a URL to perform an automated accessibility, SEO, and readability scan
            </CardDescription>
          </CardHeader>
          <div className="p-6 pt-0 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="Enter the URL of the page to scan automatically…"
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
                        Start Automated Scan
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Start scanning the webpage for accessibility issues</p>
                </TooltipContent>
              </Tooltip>
            </div>

          </div>
        </Card>

        {/* Manual Testing Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Eye className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Automated vs Manual Testing
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>
                  This automated scan provides instant results using IBM&apos;s accessibility-checker. 
                  For comprehensive testing including user experience evaluation, keyboard navigation testing, 
                  and screen reader compatibility, consider our 
                  <Link href="/services/manual-audit" className="font-medium underline hover:text-blue-600">
                    manual accessibility audit services
                  </Link>.
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Scan Failed
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scan Status */}
        <ScanStatus 
          isScanning={isScanning}
          progress={scanProgress}
          status={scanStatus}
          onCancel={() => {
            setIsScanning(false);
            setScanProgress(0);
            setScanStatus("");
          }}
        />

        {/* Automated Scan Results Section */}
        {scanResults && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Automated Scan Results</h2>
              <Badge variant="outline" className="text-sm">
                Automated Analysis
              </Badge>
            </div>
            
            {/* Summary Cards */}
            <ScanSummaryCards summary={scanResults.summary} />
            
            {/* Issues Table */}
            <ScanResultsTable issues={scanResults.issues} />
          </div>
        )}

        {/* Scan History */}
        <ScanHistoryTable history={scanHistory.length > 0 ? scanHistory : mockScanHistory} />
      </div>
    </div>
  );
}
