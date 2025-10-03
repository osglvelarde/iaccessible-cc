"use client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Calendar, User, Tag, Shield, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentMetrics {
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
}

interface PdfDocumentMetricsProps {
  metrics: DocumentMetrics;
  className?: string;
}

export default function PdfDocumentMetrics({ metrics, className }: PdfDocumentMetricsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sections = [
    {
      title: "Document Structure",
      icon: FileText,
      items: [
        { label: "Page Count", value: `${metrics.pageCount} pages`, tooltip: "Total number of pages in the document" },
        { label: "PDF Version", value: metrics.pdfVersion, tooltip: "PDF specification version used" },
        { label: "Linearized", value: metrics.linearized ? "Yes" : "No", tooltip: "Whether the PDF is optimized for web viewing" }
      ]
    },
    {
      title: "Document Properties",
      icon: Tag,
      items: [
        { label: "Title", value: metrics.title || "Not specified", tooltip: "Document title metadata" },
        { label: "Subject", value: metrics.subject || "Not specified", tooltip: "Document subject metadata" },
        { label: "Keywords", value: metrics.keywords || "Not specified", tooltip: "Document keywords metadata" }
      ]
    },
    {
      title: "Creation Info",
      icon: User,
      items: [
        { label: "Producer", value: metrics.producer || "Unknown", tooltip: "Software that created the PDF" },
        { label: "Creator", value: metrics.creator || "Unknown", tooltip: "Application that created the document" },
        { label: "Author", value: metrics.author || "Not specified", tooltip: "Document author" }
      ]
    },
    {
      title: "Timestamps",
      icon: Calendar,
      items: [
        { label: "Created", value: formatDate(metrics.creationDate), tooltip: "Document creation date" },
        { label: "Modified", value: formatDate(metrics.modDate), tooltip: "Last modification date" }
      ]
    },
    {
      title: "Accessibility",
      icon: Shield,
      items: [
        { label: "Language", value: metrics.language || "Not specified", tooltip: "Document language for screen readers" },
        { label: "Digital Signature", value: metrics.hasDigitalSignature ? "Present" : "None", tooltip: "Whether the document has a digital signature" }
      ]
    }
  ];

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document-Level Metrics
        </CardTitle>
        <CardDescription>
          Comprehensive analysis of PDF document structure and metadata
        </CardDescription>
      </CardHeader>
      <div className="p-6 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  {section.title}
                </div>
                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <Tooltip key={`${sectionIndex}-${itemIndex}`}>
                      <TooltipTrigger asChild>
                        <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-muted/50 cursor-help">
                          <span className="text-sm text-muted-foreground">{item.label}:</span>
                          <span className="text-sm font-medium text-right max-w-[200px] truncate">
                            {item.value}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Indicators */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "flex items-center gap-1",
                    metrics.linearized 
                      ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
                      : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700"
                  )}
                >
                  {metrics.linearized ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {metrics.linearized ? "Web Optimized" : "Not Optimized"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{metrics.linearized ? "PDF is optimized for web viewing" : "PDF is not optimized for web viewing"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "flex items-center gap-1",
                    metrics.hasDigitalSignature 
                      ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
                      : "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700"
                  )}
                >
                  {metrics.hasDigitalSignature ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {metrics.hasDigitalSignature ? "Digitally Signed" : "Not Signed"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{metrics.hasDigitalSignature ? "Document has a digital signature" : "Document does not have a digital signature"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "flex items-center gap-1",
                    metrics.language 
                      ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
                      : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"
                  )}
                >
                  {metrics.language ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {metrics.language ? `Language: ${metrics.language}` : "No Language Set"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{metrics.language ? "Document language is specified" : "Document language is not specified - this affects screen reader pronunciation"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </Card>
  );
}
