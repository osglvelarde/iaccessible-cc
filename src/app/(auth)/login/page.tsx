import LoginForm from "@/components/cc/LoginForm";
import { TooltipProvider } from "@radix-ui/react-tooltip";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Welcome content */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-accent/10 items-center justify-center p-12">
        <div className="max-w-md space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Welcome to iAccessible
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              A Revelo Software product for enterprise accessibility: WCAG/Section 508, PDF/UA, readability, usability testing, SEO & GEO, and agentic-AI training. Assess websites, PDFs/documents, and software applications in one platform.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-3">Feature Highlights:</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="text-green-600 text-sm">✅</span>
                <span className="text-sm text-muted-foreground">FedRAMP-aligned hosting and role-based access</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-blue-600 text-sm">🔐</span>
                <span className="text-sm text-muted-foreground">PIV/CAC, Login.gov, and Agency SSO</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-purple-600 text-sm">🧠</span>
                <span className="text-sm text-muted-foreground">MFA and session-aware security</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-orange-600 text-sm">🕒</span>
                <span className="text-sm text-muted-foreground">24/7 training, Trusted Tester / IAAP support</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-lg font-semibold text-foreground">Before you sign in</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Use your agency SSO if available (PIV/CAC or Login.gov).</p>
              <p>Commercial users: sign in with email + password.</p>
              <p className="text-xs italic">By signing in you agree to authorized use & monitoring.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              iAccessible Command Center
            </h1>
            <p className="text-muted-foreground">
              Sign in to access your tools
            </p>
          </div>
          <TooltipProvider>
            <LoginForm />
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
