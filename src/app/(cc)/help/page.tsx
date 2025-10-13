import UtilityBar from "@/components/cc/UtilityBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, MessageCircle, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  return (
    <>
      <UtilityBar />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Back to Command Center
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Help & Documentation</h1>
            <p className="text-muted-foreground mt-2">
              Get help with the iAccessible Command Center and accessibility testing tools.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" aria-hidden />
                  User Guide
                </CardTitle>
                <CardDescription>
                  Learn how to use the Command Center effectively
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li>• Getting started with accessibility testing</li>
                  <li>• Understanding module permissions</li>
                  <li>• Running scans and generating reports</li>
                  <li>• Managing your account and preferences</li>
                </ul>
                <Button asChild>
                  <a href="https://docs.example.gov/command-center" target="_blank" rel="noopener noreferrer">
                    Read Full Guide
                    <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  Support
                </CardTitle>
                <CardDescription>
                  Get help from our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> support@example.gov</p>
                  <p><strong>Phone:</strong> (555) 123-4567</p>
                  <p><strong>Hours:</strong> Mon-Fri, 8 AM - 6 PM EST</p>
                </div>
                <Button asChild>
                  <a href="mailto:support@example.gov">
                    Contact Support
                    <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">How do I request access to a locked module?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact your system administrator or send an email to admin@example.gov with your access request.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Why do modules open in new tabs?</h3>
                <p className="text-sm text-muted-foreground">
                  This allows you to work with multiple tools simultaneously and keeps your Command Center session active.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">How long does my session last?</h3>
                <p className="text-sm text-muted-foreground">
                  Your session will timeout after 25 minutes of inactivity. You&apos;ll receive a warning 2 minutes before expiration.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

