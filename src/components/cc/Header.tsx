"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HelpCircle, User, MoreHorizontal } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import HelpDrawer from "./HelpDrawer";
import ActivityDropdown from "./ActivityDropdown";
import RecentModulesDropdown from "./RecentModulesDropdown";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl">iAccessible Command Center</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center space-x-2">
          <ActivityDropdown />
          <RecentModulesDropdown />
          <HelpDrawer />
          <Button variant="ghost" size="icon" asChild>
            <Link href="/profile" aria-label="Profile and account">
              <User className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <ThemeToggle />
        </div>

        {/* Mobile Navigation */}
        <div className="flex sm:hidden items-center space-x-2">
          <ActivityDropdown />
          <RecentModulesDropdown />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <MoreHorizontal className="h-4 w-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/help" className="flex items-center">
                  <HelpCircle className="mr-2 h-4 w-4" aria-hidden />
                  Help
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" aria-hidden />
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

