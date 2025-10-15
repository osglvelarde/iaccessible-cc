"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HelpCircle, User, MoreHorizontal } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import HelpDrawer from "./HelpDrawer";
import ActivityDropdown from "./ActivityDropdown";
import RecentModulesDropdown from "./RecentModulesDropdown";
import { getScanHistory, type ScanHistoryItem } from "@/lib/scanner-api";

export default function Header() {
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            <Button variant="ghost" size="icon" asChild aria-label="Profile and account">
              <Link href="/profile" tabIndex={-1}>
                <User className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
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
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center" tabIndex={0}>
                  <User className="mr-2 h-5 w-5" aria-hidden="true" />
                  Profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

