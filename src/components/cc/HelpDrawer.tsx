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
          <HelpCircle className="h-4 w-4" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96" id="help-drawer">
        <SheetHeader>
          <SheetTitle>Help & Support</SheetTitle>
          <SheetDescription>
            Get help with the iAccessible Command Center
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <h3 className="font-medium">Support</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="mailto:helpdesk@example.gov" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
                  Contact Helpdesk
                  <ExternalLink className="ml-auto h-3 w-3" aria-hidden />
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://status.example.gov" target="_blank" rel="noopener noreferrer">
                  <Activity className="mr-2 h-4 w-4" aria-hidden />
                  System status
                  <ExternalLink className="ml-auto h-3 w-3" aria-hidden />
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/legal" target="_blank" rel="noopener noreferrer">
                  <Shield className="mr-2 h-4 w-4" aria-hidden />
                  Accessibility statement
                  <ExternalLink className="ml-auto h-3 w-3" aria-hidden />
                </a>
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium">Knowledge Base</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-left" asChild>
                <a href="#" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" aria-hidden />
                  Getting started guide
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-left" asChild>
                <a href="#" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" aria-hidden />
                  Module permissions
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-left" asChild>
                <a href="#" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" aria-hidden />
                  Troubleshooting
                </a>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
