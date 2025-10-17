"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { HelpCircle, User, MoreHorizontal, Settings, LogOut, Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import HelpDrawer from "./HelpDrawer";
import ActivityDropdown from "./ActivityDropdown";
import RecentModulesDropdown from "./RecentModulesDropdown";
import { getScanHistory, type ScanHistoryItem } from "@/lib/scanner-api";
import { useAuth } from "@/components/cc/AuthProvider";

export default function Header() {
  const { user, logout, canManageUsers, canManageGroups } = useAuth();
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  // Load scan history for activity dropdown
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
      } catch (error) {
        console.error('Failed to load scan history:', error);
        // Continue without scan history
      }
    };

    loadScanHistory();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.15)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:20px_20px] opacity-30" />
      <div className="relative z-10">
      <div className="w-full flex h-16 items-center justify-between px-4 lg:px-2">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2">
          {/* Logo icon with "iA" */}
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-white font-extrabold text-lg select-none">
            <span className="lowercase">i</span>
            <span className="uppercase">A</span>
          </div>
          <span className="font-bold text-xl">iAccessible Command Center</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex flex-1 justify-end" aria-label="Desktop navigation wrapper">
          <div className="flex items-center justify-end space-x-4 w-full" aria-label="Desktop navigation icons">
            <ActivityDropdown scanHistory={scanHistory} />
            <RecentModulesDropdown />
            <HelpDrawer />
            
            {/* Admin Menu */}
            {(canManageUsers() || canManageGroups()) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Admin menu">
                    <Shield className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/users" className="flex items-center" tabIndex={0}>
                      <User className="mr-2 h-4 w-4" aria-hidden="true" />
                      Users & Roles
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-muted-foreground">{user.groups[0]?.name}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {user.groups[0]?.name}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center" tabIndex={0}>
                      <User className="mr-2 h-4 w-4" aria-hidden="true" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center" tabIndex={0}>
                      <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" asChild aria-label="Sign in">
                <Link href="/login" tabIndex={-1}>
                  <User className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            )}
            
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex sm:hidden items-center space-x-3" aria-label="Mobile navigation icons">
          <ActivityDropdown scanHistory={scanHistory} />
          <RecentModulesDropdown />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/help" className="flex items-center" tabIndex={0}>
                  <HelpCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                  Help
                </Link>
              </DropdownMenuItem>
              {user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center" tabIndex={0}>
                      <User className="mr-2 h-5 w-5" aria-hidden="true" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {(canManageUsers() || canManageGroups()) && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/users" className="flex items-center" tabIndex={0}>
                        <Shield className="mr-2 h-5 w-5" aria-hidden="true" />
                        Users & Roles
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-5 w-5" aria-hidden="true" />
                    Sign out
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href="/login" className="flex items-center" tabIndex={0}>
                    <User className="mr-2 h-5 w-5" aria-hidden="true" />
                    Sign in
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </div>
    </header>
  );
}

