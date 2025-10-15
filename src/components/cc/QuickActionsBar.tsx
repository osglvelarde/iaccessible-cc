"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Play, 
  FileText, 
  BarChart3, 
  Calendar, 
  HelpCircle, 
  Settings,
  Zap,
  Scan
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  variant: "default" | "secondary" | "outline";
  isExternal?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: "view-reports",
    title: "View Reports",
    description: "Access all scan reports",
    icon: BarChart3,
    href: "/dashboard",
    variant: "secondary"
  },
  {
    id: "webpage-scan",
    title: "Webpage Assessment",
    description: "Run instant accessibility scan",
    icon: Scan,
    href: "/scan/ad-hoc",
    variant: "outline"
  },
  {
    id: "pdf-scan",
    title: "Upload PDF Scan",
    description: "Scan PDF for accessibility",
    icon: FileText,
    href: "/scan/pdf",
    variant: "outline"
  },
  {
    id: "schedule-scan",
    title: "Schedule Assessment",
    description: "Set up recurring scans",
    icon: Calendar,
    href: "/scans/scheduler",
    variant: "outline"
  },
  {
    id: "help-center",
    title: "Help Center",
    description: "Get support and guides",
    icon: HelpCircle,
    href: "/help",
    variant: "outline"
  },
  {
    id: "settings",
    title: "Settings",
    description: "Configure preferences",
    icon: Settings,
    href: "/settings",
    variant: "outline"
  }
];

interface QuickActionsBarProps {
  className?: string;
}

export default function QuickActionsBar({ className }: QuickActionsBarProps) {
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());

  const handleActionClick = (actionId: string, href: string) => {
    setLoadingActions(prev => new Set(prev).add(actionId));
    
    // Navigate to the href
    if (href.startsWith('/')) {
      // Internal navigation
      window.location.href = href;
    } else {
      // External navigation
      window.open(href, '_blank', 'noopener,noreferrer');
    }
    
    // Simulate loading for better UX
    setTimeout(() => {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }, 1000);
  };

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const isLoading = loadingActions.has(action.id);
            
            return (
              <Tooltip key={action.id}>
                <TooltipTrigger asChild>
                  <div>
                    <LoadingButton
                      variant={action.variant}
                      loading={isLoading}
                      loadingText="Loading..."
                      className={cn(
                        "h-auto p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all duration-200 w-full",
                        "animate-in fade-in-0 slide-in-from-bottom-2"
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => handleActionClick(action.id, action.href)}
                    >
                      <Icon className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-medium text-sm leading-tight">
                          {action.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {action.description}
                        </div>
                      </div>
                    </LoadingButton>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{action.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
