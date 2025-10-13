"use client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { HelpCircle, MessageCircle, ExternalLink, FileText, Activity, Shield } from "lucide-react";
import Link from "next/link";

export default function HelpDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open help" aria-controls="help-drawer" aria-expanded="false">
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96 p-6" id="help-drawer">
        <SheetHeader>
          <SheetTitle>Help & Support</SheetTitle>
          <SheetDescription className="mb-4">
            Get help with the iAccessible Command Center
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          <section aria-labelledby="support-title" className="space-y-4">
            <h3 id="support-title" className="font-semibold text-lg">
              Support
            </h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="mailto:helpdesk@example.gov" target="_blank" rel="noopener noreferrer" className="flex items-center w-full px-4 py-2 rounded-md">
                  <MessageCircle className="mr-3 h-5 w-5" aria-hidden="true" />
                  Contact Helpdesk
                  <ExternalLink className="ml-auto h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="https://status.example.gov" target="_blank" rel="noopener noreferrer" className="flex items-center w-full px-4 py-2 rounded-md">
                  <Activity className="mr-3 h-5 w-5" aria-hidden="true" />
                  System status
                  <ExternalLink className="ml-auto h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/legal" target="_blank" rel="noopener noreferrer" className="flex items-center w-full px-4 py-2 rounded-md">
                  <Shield className="mr-3 h-5 w-5" aria-hidden="true" />
                  Accessibility statement
                  <ExternalLink className="ml-auto h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </section>

          <section aria-labelledby="knowledge-base-title" className="space-y-4">
            <h3 id="knowledge-base-title" className="font-semibold text-lg">
              Knowledge Base
            </h3>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start text-left" asChild>
                <Link href="#" className="flex items-center w-full px-4 py-2 rounded-md">
                  <FileText className="mr-3 h-5 w-5" aria-hidden="true" />
                  Getting started guide
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-left" asChild>
                <Link href="#" className="flex items-center w-full px-4 py-2 rounded-md">
                  <FileText className="mr-3 h-5 w-5" aria-hidden="true" />
                  Module permissions
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-left" asChild>
                <Link href="#" className="flex items-center w-full px-4 py-2 rounded-md">
                  <FileText className="mr-3 h-5 w-5" aria-hidden="true" />
                  Troubleshooting
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
