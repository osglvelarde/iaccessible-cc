"use client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Accessibility, Search, BookOpen, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanSummary {
  accessibilityScore: number;
  seoScore: number;
  readabilityScore: number;
  totalIssues: number;
  totalRules?: number;
  violations?: number;
  potentialViolations?: number;
  recommendations?: number;
  passed?: number;
  criticalIssues?: number;
  warningIssues?: number;
  infoIssues?: number;
  passRate?: number;
  scoreCategory?: string;
}

interface ScanSummaryCardsProps {
  summary: ScanSummary;
  className?: string;
}

export default function ScanSummaryCards({ summary, className }: ScanSummaryCardsProps) {
  // Get accessibility score color based on score
  const getAccessibilityColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getAccessibilityBgColor = (score: number) => {
    if (score >= 90) return "bg-green-50 dark:bg-green-950/20";
    if (score >= 80) return "bg-blue-50 dark:bg-blue-950/20";
    if (score >= 60) return "bg-yellow-50 dark:bg-yellow-950/20";
    if (score >= 40) return "bg-orange-50 dark:bg-orange-950/20";
    return "bg-red-50 dark:bg-red-950/20";
  };

  const getAccessibilityBorderColor = (score: number) => {
    if (score >= 90) return "border-green-200 dark:border-green-800";
    if (score >= 80) return "border-blue-200 dark:border-blue-800";
    if (score >= 60) return "border-yellow-200 dark:border-yellow-800";
    if (score >= 40) return "border-orange-200 dark:border-orange-800";
    return "border-red-200 dark:border-red-800";
  };

  const cards = [
    {
      title: "Automated Accessibility Score",
      value: summary.accessibilityScore,
      subtitle: summary.scoreCategory || "WCAG 2.2 Compliance",
      icon: Accessibility,
      color: getAccessibilityColor(summary.accessibilityScore),
      bgColor: getAccessibilityBgColor(summary.accessibilityScore),
      borderColor: getAccessibilityBorderColor(summary.accessibilityScore),
      tooltip: `Automated analysis of WCAG 2.2 accessibility compliance. ${summary.totalRules ? `Based on ${summary.totalRules} automated rules tested.` : ''} ${summary.passRate ? `${summary.passRate}% pass rate.` : ''}`,
      details: summary.totalRules ? {
        totalRules: summary.totalRules,
        passed: summary.passed || 0,
        violations: summary.violations || 0,
        potentialViolations: summary.potentialViolations || 0,
        recommendations: summary.recommendations || 0
      } : null
    },
    {
      title: "Automated SEO Score", 
      value: summary.seoScore,
      subtitle: "Search Optimization",
      icon: Search,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-800",
      tooltip: "Automated evaluation of search engine optimization factors"
    },
    {
      title: "Automated Readability Score",
      value: summary.readabilityScore,
      subtitle: "Content Clarity",
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-800",
      tooltip: "Automated assessment of content readability and clarity"
    },
    {
      title: "Total Issues",
      value: summary.totalIssues,
      subtitle: "Automated Issues Found",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800",
      tooltip: "Total number of automated accessibility, SEO, and readability issues detected"
    }
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
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
                    {card.title === "Total Issues" ? card.value : `${card.value}%`}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {card.subtitle}
                  </div>
                  
                  {/* Score Badge */}
                  {card.title !== "Total Issues" && (
                    <div className="mt-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          card.value >= 90 ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700" :
                          card.value >= 80 ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700" :
                          card.value >= 60 ? "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700" :
                          card.value >= 40 ? "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700" :
                          "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"
                        )}
                      >
                        {card.value >= 90 ? "Excellent" : 
                         card.value >= 80 ? "Good" : 
                         card.value >= 60 ? "Fair" : 
                         card.value >= 40 ? "Needs Work" : "Poor"}
                      </Badge>
                    </div>
                  )}

                  {/* Detailed accessibility metrics */}
                  {card.title === "Automated Accessibility Score" && card.details && (
                    <div className="mt-3 space-y-1">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">{card.details.passed}</span> passed • 
                        <span className="font-medium text-red-600 ml-1">{card.details.violations}</span> critical • 
                        <span className="font-medium text-yellow-600 ml-1">{card.details.potentialViolations}</span> warnings
                      </div>
                      {card.details.recommendations > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-blue-600">{card.details.recommendations}</span> recommendations
                        </div>
                      )}
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
