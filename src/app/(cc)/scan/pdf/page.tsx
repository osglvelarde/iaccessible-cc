"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Settings, 
  Download, 
  Eye, 
  RotateCcw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Info,
  X
} from "lucide-react";
import PdfScanStatus from "@/components/cc/PdfScanStatus";
import PdfSummaryCards from "@/components/cc/PdfSummaryCards";
import PdfResultsTable from "@/components/cc/PdfResultsTable";
import PdfDocumentMetrics from "@/components/cc/PdfDocumentMetrics";
import PdfPageMetrics from "@/components/cc/PdfPageMetrics";
import PdfFontGraphicsAnalysis from "@/components/cc/PdfFontGraphicsAnalysis";
import PdfScanHistoryTable from "@/components/cc/PdfScanHistoryTable";
import { cn } from "@/lib/utils";

interface PdfScanResults {
  fileName: string;
  fileSize: string;
  uploadDate: string;
  status: string;
  summary: {
    totalIssues: number;
    accessibilityScore: number;
    criticalIssues: number;
    warningIssues: number;
    passedChecks: number;
  };
  documentMetrics: {
    pageCount: number;
    pdfVersion: string;
    producer: string;
    creator: string;
    author: string;
    title: string;
    subject: string;
    keywords: string;
    creationDate: string;
    modDate: string;
    language: string;
    linearized: boolean;
    hasDigitalSignature: boolean;
  };
  pageMetrics: Array<{
    pageNumber: number;
    mediaBox: string;
    textCount: number;
    wordCount: number;
    imageCount: number;
    annotationCount: number;
    hasAltText: boolean;
    headings: string[];
    lists: number;
    tables: number;
  }>;
  fontGraphics: {
    fonts: Array<{
      name: string;
      type: string;
      embedded: boolean;
      subset: boolean;
      unicodeCoverage: number;
    }>;
    images: Array<{
      page: number;
      dimensions: string;
      dpi: number;
      colorSpace: string;
      hasAltText: boolean;
    }>;
    iccProfiles: number;
    transparencyUsage: boolean;
  };
  issues: Array<{
    id: number;
    type: string;
    code: string;
    severity: "Error" | "Warning" | "Need Check Manual";
    message: string;
    iso32000Clause: string;
    iso14289Clause: string;
    pageNumber: number;
    objectId: string;
    details: string;
  }>;
}

// Mock data for demonstration
const mockPdfScanResults: PdfScanResults = {
  fileName: "accessibility-report.pdf",
  fileSize: "2.4 MB",
  uploadDate: new Date().toISOString(),
  status: "completed",
  summary: {
    totalIssues: 15,
    accessibilityScore: 78,
    criticalIssues: 3,
    warningIssues: 8,
    passedChecks: 4
  },
  documentMetrics: {
    pageCount: 12,
    pdfVersion: "1.7",
    producer: "Adobe Acrobat Pro DC",
    creator: "Microsoft Word",
    author: "John Doe",
    title: "Accessibility Compliance Report",
    subject: "WCAG 2.2 Compliance Analysis",
    keywords: "accessibility, WCAG, compliance",
    creationDate: "2024-01-15T10:30:00Z",
    modDate: "2024-01-15T14:20:00Z",
    language: "en-US",
    linearized: true,
    hasDigitalSignature: false
  },
  pageMetrics: [
    {
      pageNumber: 1,
      mediaBox: "0 0 612 792",
      textCount: 1250,
      wordCount: 180,
      imageCount: 3,
      annotationCount: 0,
      hasAltText: true,
      headings: ["H1", "H2", "H2"],
      lists: 2,
      tables: 1
    },
    {
      pageNumber: 2,
      mediaBox: "0 0 612 792", 
      textCount: 980,
      wordCount: 145,
      imageCount: 2,
      annotationCount: 1,
      hasAltText: false,
      headings: ["H2", "H3"],
      lists: 1,
      tables: 0
    }
  ],
  fontGraphics: {
    fonts: [
      { name: "Arial", type: "TrueType", embedded: true, subset: false, unicodeCoverage: 95 },
      { name: "Times-Roman", type: "Type1", embedded: false, subset: false, unicodeCoverage: 88 }
    ],
    images: [
      { page: 1, dimensions: "300x200", dpi: 72, colorSpace: "RGB", hasAltText: true },
      { page: 1, dimensions: "150x100", dpi: 150, colorSpace: "CMYK", hasAltText: false }
    ],
    iccProfiles: 2,
    transparencyUsage: true
  },
  issues: [
    {
      id: 1,
      type: "Text",
      code: "7.1:1.1",
      severity: "Error" as const,
      message: "Missing alternative text for image",
      iso32000Clause: "14.9.2",
      iso14289Clause: "7.1",
      pageNumber: 2,
      objectId: "Img_001",
      details: "The image on page 2 lacks alternative text, making it inaccessible to screen readers."
    },
    {
      id: 2,
      type: "Headings",
      code: "7.2:1.2",
      severity: "Warning" as const,
      message: "Heading structure not properly nested",
      iso32000Clause: "14.8.4",
      iso14289Clause: "7.2",
      pageNumber: 1,
      objectId: "H_003",
      details: "Heading levels should follow a logical hierarchy (H1 → H2 → H3)."
    },
    {
      id: 3,
      type: "Tables",
      code: "7.3:1.3",
      severity: "Error" as const,
      message: "Table missing header cells",
      iso32000Clause: "14.8.3",
      iso14289Clause: "7.3",
      pageNumber: 1,
      objectId: "Tbl_001",
      details: "Data tables must have properly marked header cells for accessibility."
    },
    {
      id: 4,
      type: "Forms",
      code: "7.4:1.4",
      severity: "Need Check Manual" as const,
      message: "Form field lacks accessible name",
      iso32000Clause: "12.7.4",
      iso14289Clause: "7.4",
      pageNumber: 3,
      objectId: "Fld_001",
      details: "Form fields must have accessible names for screen reader users."
    }
  ]
};

const mockPdfHistory = [
  {
    id: 1,
    fileName: "accessibility-report.pdf",
    uploadDate: "2024-01-15T10:30:00Z",
    status: "completed" as const,
    accessibilityScore: 78,
    totalIssues: 15
  },
  {
    id: 2,
    fileName: "user-manual.pdf",
    uploadDate: "2024-01-14T14:20:00Z",
    status: "completed" as const, 
    accessibilityScore: 92,
    totalIssues: 5
  },
  {
    id: 3,
    fileName: "corrupted-file.pdf",
    uploadDate: "2024-01-13T09:15:00Z",
    status: "failed" as const,
    accessibilityScore: undefined,
    totalIssues: undefined
  }
];

export default function PdfScanPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<PdfScanResults | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [scanScope, setScanScope] = useState("entire");
  const [includeForms, setIncludeForms] = useState(true);
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      setScanResults(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      setScanResults(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleScan = async () => {
    if (!uploadedFile) return;
    
    setIsScanning(true);
    setScanResults(null);
    
    // Simulate API call
    setTimeout(() => {
      setScanResults(mockPdfScanResults);
      setIsScanning(false);
    }, 4000);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setScanResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Automated PDF Scan</h1>
            <Badge variant="outline" className="text-sm">
              Automated Analysis
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
        {/* PDF Upload Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              PDF Upload & Configuration
            </CardTitle>
            <CardDescription>
              Upload a PDF document to perform a comprehensive accessibility audit
            </CardDescription>
          </CardHeader>
          <div className="p-6 pt-0 space-y-6">
            {/* File Upload Area */}
            <div className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  uploadedFile 
                    ? "border-green-300 bg-green-50 dark:bg-green-950/20" 
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {uploadedFile ? (
                  <div className="space-y-3">
                    <FileText className="h-12 w-12 mx-auto text-green-600" />
                    <div className="space-y-1">
                      <p className="font-medium text-green-800 dark:text-green-200">
                        {uploadedFile.name}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {formatFileSize(uploadedFile.size)} • Uploaded {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={removeFile}>
                      <X className="h-4 w-4 mr-2" />
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="font-medium">Drop your PDF here, or click to browse</p>
                      <p className="text-sm text-muted-foreground">
                        Supports PDF files up to 50MB
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose PDF File
                    </Button>
                  </div>
                )}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleScan} 
                    disabled={!uploadedFile || isScanning}
                    className="w-full h-11"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scanning PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Start Automated PDF Scan
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{uploadedFile ? "Start scanning the uploaded PDF" : "Upload a PDF file first"}</p>
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
                <div className="pl-6 space-y-4 border-l-2 border-muted">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Scan Scope</label>
                    <div className="flex gap-2">
                      <Button
                        variant={scanScope === "entire" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setScanScope("entire")}
                      >
                        Entire PDF
                      </Button>
                      <Button
                        variant={scanScope === "selected" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setScanScope("selected")}
                      >
                        Selected Pages
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Include in Scan</label>
                    <div className="flex gap-2">
                      <Button
                        variant={includeForms ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIncludeForms(!includeForms)}
                      >
                        Forms
                      </Button>
                      <Button
                        variant={includeAnnotations ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIncludeAnnotations(!includeAnnotations)}
                      >
                        Annotations
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Scan Status */}
        <PdfScanStatus 
          isScanning={isScanning}
          progress={75}
          status="Analyzing PDF structure and accessibility compliance..."
          onCancel={() => setIsScanning(false)}
        />

        {/* Results Section */}
        {scanResults && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4">
            {/* Summary Cards */}
            <PdfSummaryCards summary={scanResults.summary} />
            
            {/* Document-Level Metrics */}
            <PdfDocumentMetrics metrics={scanResults.documentMetrics} />
            
            {/* Page-Level Metrics */}
            <PdfPageMetrics metrics={scanResults.pageMetrics} />
            
            {/* Font & Graphics Analysis */}
            <PdfFontGraphicsAnalysis analysis={scanResults.fontGraphics} />
            
            {/* Issues Table */}
            <PdfResultsTable issues={scanResults.issues} />
          </div>
        )}

        {/* Scan History */}
        <PdfScanHistoryTable history={mockPdfHistory} />
      </div>
    </div>
  );
}
