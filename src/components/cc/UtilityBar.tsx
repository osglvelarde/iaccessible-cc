"use client";
import Link from "next/link";
import { HelpCircle, User, ArrowLeft } from "lucide-react";
import HelpDrawer from "./HelpDrawer";

export default function UtilityBar() {
  return (
    <div role="navigation" className="sticky top-0 z-40 w-full bg-sidebar text-sidebar-foreground border-b border-sidebar-border px-3 py-2 flex items-center justify-between h-12">
      <div className="flex items-center gap-2">
        <ArrowLeft aria-hidden className="h-4 w-4" />
        <Link href="/" aria-label="Back to Command Center" className="hover:underline">
          Back to Command Center
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <HelpDrawer />
        <Link href="/profile" aria-label="Profile and account" className="p-1 hover:bg-sidebar-accent rounded">
          <User className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
