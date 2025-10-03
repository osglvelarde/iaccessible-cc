"use client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Accessibility, AlertTriangle, CheckCircle, Info, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfSummary {
  totalIssues: number;
  accessibilityScore: number;
  criticalIssues: number;
  warningIssues: number;
  passedChecks: number;
}

interface PdfSummaryCardsProps {
  summary: PdfSummary;
  className?: string;
}

export default function PdfSummaryCards({ summary, className }: PdfSummaryCardsProps) {
  const cards = [
    {
      title: "Accessibility Score",
      value: summary.accessibilityScore,
      subtitle: "WCAG 2.2 & PDF/UA Compliance",
      icon: Accessibility,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      tooltip: "Overall accessibility compliance score based on WCAG 2.2 and PDF/UA standards"
    },
    {
      title: "Total Issues",
      value: summary.totalIssues,
      subtitle: "Issues Found",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800",
      tooltip: "Total number of accessibility issues found in the PDF document"
    },
    {
      title: "Critical Issues",
      value: summary.criticalIssues,
      subtitle: "Must Fix",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800",
      tooltip: "Critical accessibility issues that must be addressed for compliance"
    },
    {
      title: "Warnings",
      value: summary.warningIssues,
      subtitle: "Should Fix",
      icon: Info,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      borderColor: "border-amber-200 dark:border-amber-800",
      tooltip: "Warning-level issues that should be addressed for better accessibility"
    },
    {
      title: "Passed Checks",
      value: summary.passedChecks,
      subtitle: "Compliant",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-800",
      tooltip: "Accessibility checks that passed successfully"
    }
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", className)}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Tooltip key={card.title}>
            <TooltipTrigger asChild>
              <Card 
                className={cn(
                  "shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
                  "animate-in fade-in-0 slide-in-from-bottom-2",
                  card.bgColor,
                  card.borderColor,
                  "border"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <div className="px-6 pb-6">
                  <div className={cn("text-3xl font-bold", card.color)}>
                    {card.title === "Accessibility Score" ? `${card.value}%` : card.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {card.subtitle}
                  </div>
                  
                  {/* Score Badge for Accessibility Score */}
                  {card.title === "Accessibility Score" && (
                    <div className="mt-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          card.value >= 90 ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700" :
                          card.value >= 70 ? "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700" :
                          "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"
                        )}
                      >
                        {card.value >= 90 ? "Excellent" : card.value >= 70 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Issue Type Badge */}
                  {card.title !== "Accessibility Score" && (
                    <div className="mt-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          card.title === "Critical Issues" ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700" :
                          card.title === "Warnings" ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700" :
                          card.title === "Passed Checks" ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700" :
                          "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700"
                        )}
                      >
                        {card.title === "Critical Issues" ? "High Priority" :
                         card.title === "Warnings" ? "Medium Priority" :
                         card.title === "Passed Checks" ? "Compliant" :
                         "All Issues"}
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>{card.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
