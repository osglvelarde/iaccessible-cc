"use client";
import React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Search,
  Workflow,
  BookOpen,
  Settings,
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { MODULE_GROUPS, Module } from "@/lib/constants";
import { useAuth } from "@/components/cc/AuthProvider";

const categoryIcons = {
  "Reports & Dashboards": BarChart3,
  "Scanning Tools": Search,
  "Workflows": Workflow,
  "Knowledge & Guides": BookOpen,
  "Admin": Settings,
};

export default function NavigationBar() {
  const { user, hasPermission, canManageUsers, canManageGroups } = useAuth();
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  // Don't render if user is not logged in
  if (!user) {
    return null;
  }

  // Filter categories based on user permissions
  const accessibleCategories = MODULE_GROUPS.filter(group => {
    // For Admin category, check specific admin permissions
    if (group.title === "Admin") {
      return canManageUsers() || canManageGroups();
    }
    
    // For other categories, check if at least one module is accessible
    return group.modules.some(module => hasPermission(module.key));
  });

  const handleModuleClick = (module: Module) => {
    setOpenCategory(null);
  };

  const getModuleIcon = (moduleKey: string) => {
    const iconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
      dashboard: BarChart3,
      dataQuery: BarChart3,
      uptimeMonitoring: BarChart3,
      webpageScan: Search,
      waveScan: Search,
      pdfScan: Search,
      scanMonitor: Search,
      scansScheduler: Search,
      intake: Workflow,
      manualTesting: Workflow,
      pdfRemediation: Workflow,
      guidelines: BookOpen,
      supportBot: BookOpen,
      settings: Settings,
      usersRoles: Settings,
    };
    return iconMap[moduleKey] || Search;
  };

  const isExternalLink = (href: string) => {
    return href.startsWith('http');
  };

  return (
    <nav className="sticky top-16 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/10 via-background to-accent/5 dark:from-muted/20 dark:via-background dark:to-accent/10" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.05)_25%,rgba(0,0,0,0.05)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.05)_75%)] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_25%,rgba(255,255,255,0.03)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.03)_75%)] bg-[length:8px_8px] opacity-40" />
      <div className="relative z-10 w-full flex h-12 items-center justify-start px-4 lg:px-2 overflow-x-auto">
        <div className="flex items-center space-x-1 min-w-max">
          {accessibleCategories.map((group) => {
            const IconComponent = categoryIcons[group.title as keyof typeof categoryIcons];
            const accessibleModules = group.modules.filter(module => hasPermission(module.key));
            const restrictedModules = group.modules.filter(module => !hasPermission(module.key));
            
            return (
              <DropdownMenu 
                key={group.title}
                open={openCategory === group.title}
                onOpenChange={(open) => setOpenCategory(open ? group.title : null)}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-2 px-3 py-2 h-8 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                        aria-label={`${group.title} menu`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="hidden sm:inline">{group.title}</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>{group.title}</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-64">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-foreground">{group.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {accessibleModules.length} accessible module{accessibleModules.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Accessible modules */}
                  {accessibleModules.map((module) => {
                    const ModuleIcon = getModuleIcon(module.key);
                    const isExternal = isExternalLink(module.href);
                    
                    return (
                      <DropdownMenuItem key={module.key} asChild>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={module.route || module.href}
                              className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer"
                              onClick={() => handleModuleClick(module)}
                            >
                              <ModuleIcon className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{module.title}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {module.desc}
                                </div>
                              </div>
                              {isExternal && (
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              )}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent sideOffset={6} className="max-w-xs">
                            <div className="font-medium">{module.title}</div>
                            <div className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                              {module.desc}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </DropdownMenuItem>
                    );
                  })}
                  
                  {/* Show restricted modules if any */}
                  {restrictedModules.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5">
                        <p className="text-xs text-muted-foreground font-medium">
                          Restricted ({restrictedModules.length})
                        </p>
                      </div>
                      {restrictedModules.map((module) => {
                        const ModuleIcon = getModuleIcon(module.key);
                        
                        return (
                          <DropdownMenuItem key={module.key} disabled className="opacity-50">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 px-2 py-1.5 text-sm w-full">
                                  <ModuleIcon className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{module.title}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {module.desc}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    Restricted
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent sideOffset={6} className="max-w-xs">
                                <div className="font-medium">{module.title}</div>
                                <div className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                                  {module.desc}
                                </div>
                                <div className="text-xs text-red-300 dark:text-red-400 mt-1 font-medium">
                                  Access restricted
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
