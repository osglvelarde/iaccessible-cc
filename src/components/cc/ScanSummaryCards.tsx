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
}

interface ScanSummaryCardsProps {
  summary: ScanSummary;
  className?: string;
}

export default function ScanSummaryCards({ summary, className }: ScanSummaryCardsProps) {
  const cards = [
    {
      title: "Accessibility Score",
      value: summary.accessibilityScore,
      subtitle: "WCAG 2.2 Compliance",
      icon: Accessibility,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      tooltip: "Measures compliance with WCAG 2.2 accessibility guidelines"
    },
    {
      title: "SEO Score", 
      value: summary.seoScore,
      subtitle: "Search Optimization",
      icon: Search,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-800",
      tooltip: "Evaluates search engine optimization factors"
    },
    {
      title: "Readability Score",
      value: summary.readabilityScore,
      subtitle: "Content Clarity",
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-800",
      tooltip: "Assesses content readability and clarity"
    },
    {
      title: "Total Issues",
      value: summary.totalIssues,
      subtitle: "Issues Found",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800",
      tooltip: "Total number of accessibility, SEO, and readability issues"
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
                          card.value >= 70 ? "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700" :
                          "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"
                        )}
                      >
                        {card.value >= 90 ? "Excellent" : card.value >= 70 ? "Good" : "Needs Improvement"}
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
