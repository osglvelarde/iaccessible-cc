import UtilityBar from "@/components/cc/UtilityBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LegalPage() {
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
            <h1 className="text-3xl font-bold">Legal & Compliance</h1>
            <p className="text-muted-foreground mt-2">
              Important legal information and compliance details for the iAccessible Command Center.
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" aria-hidden />
                  Privacy Policy
                </CardTitle>
                <CardDescription>
                  How we collect, use, and protect your information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <h3>Information We Collect</h3>
                  <p>
                    The iAccessible Command Center collects minimal information necessary to provide 
                    accessibility testing services. This includes:
                  </p>
                  <ul>
                    <li>Account information (name, email, department)</li>
                    <li>Usage data for service improvement</li>
                    <li>Scan results and testing data</li>
                    <li>System logs for security and troubleshooting</li>
                  </ul>
                  
                  <h3>How We Use Your Information</h3>
                  <p>
                    Your information is used solely for providing accessibility testing services, 
                    maintaining system security, and improving our tools. We do not sell or share 
                    your personal information with third parties.
                  </p>
                  
                  <h3>Data Security</h3>
                  <p>
                    All data is encrypted in transit and at rest. We follow federal security 
                    standards and undergo regular security audits.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" aria-hidden />
                  Terms of Service
                </CardTitle>
                <CardDescription>
                  Rules and guidelines for using the Command Center
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <h3>Acceptable Use</h3>
                  <p>
                    The iAccessible Command Center is provided for official government use only. 
                    Users must comply with all applicable federal laws and regulations.
                  </p>
                  
                  <h3>Prohibited Activities</h3>
                  <ul>
                    <li>Unauthorized access to restricted modules</li>
                    <li>Sharing login credentials</li>
                    <li>Using the system for non-official purposes</li>
                    <li>Attempting to circumvent security measures</li>
                  </ul>
                  
                  <h3>Data Retention</h3>
                  <p>
                    Scan results and testing data are retained according to federal record-keeping 
                    requirements. Users may request data deletion subject to legal requirements.
                  </p>
                  
                  <h3>Liability</h3>
                  <p>
                    The Command Center is provided "as is" without warranty. Users are responsible 
                    for ensuring the accuracy of their accessibility testing results.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accessibility Compliance</CardTitle>
                <CardDescription>
                  Our commitment to accessibility standards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <h3>WCAG 2.1 AA Compliance</h3>
                  <p>
                    The iAccessible Command Center is designed to meet WCAG 2.1 AA standards. 
                    We regularly test and audit our interface for accessibility compliance.
                  </p>
                  
                  <h3>Section 508 Compliance</h3>
                  <p>
                    This system complies with Section 508 of the Rehabilitation Act, ensuring 
                    equal access for users with disabilities.
                  </p>
                  
                  <h3>Assistive Technology Support</h3>
                  <p>
                    The interface is compatible with screen readers, keyboard navigation, 
                    and other assistive technologies commonly used by government employees.
                  </p>
                  
                  <h3>Feedback and Issues</h3>
                  <p>
                    If you encounter accessibility barriers, please contact us at 
                    <a href="mailto:accessibility@example.gov" className="underline">
                      accessibility@example.gov
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-medium mb-2">General Inquiries</h3>
                    <p className="text-sm text-muted-foreground">
                      Email: <a href="mailto:info@example.gov" className="underline">info@example.gov</a><br />
                      Phone: (555) 123-4567
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Technical Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Email: <a href="mailto:support@example.gov" className="underline">support@example.gov</a><br />
                      Phone: (555) 123-4568
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

