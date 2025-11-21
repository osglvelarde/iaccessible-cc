import LoginForm from "@/components/cc/LoginForm";
import { TooltipProvider } from "@radix-ui/react-tooltip";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* FISMA Banner */}
      <div className="w-full bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 text-center">
            You are accessing a U.S. Government information system, which is provided for authorized use only. 
            Unauthorized or improper use of this system may result in disciplinary action and civil or criminal penalties. 
            By using this system, you consent to monitoring and recording for security and administrative purposes.
          </p>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left side - Welcome content */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-accent/10 items-center justify-center p-12 overflow-y-auto">
          <div className="max-w-md space-y-6">
            {/* Header Section */}
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Welcome to the iAccessible Command Center
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                A FedRAMP-aligned platform for accessibility, testing, and reporting.
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                Access is restricted to authorized users only. Unauthorized use is prohibited and subject to monitoring.
              </p>
            </div>
            
            {/* Login Options */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground">Login Options</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Sign in using one of the following methods:
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start space-x-2">
                  <span className="text-primary font-semibold">•</span>
                  <p><strong className="text-foreground">Government SSO:</strong> Use your agency credentials (PIV/CAC, Login.gov, or agency SSO).</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-primary font-semibold">•</span>
                  <p><strong className="text-foreground">Email & Password:</strong> For approved commercial or test accounts only.</p>
                </div>
              </div>
            </div>

            {/* Password Guidance */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground">Password Guidance (NIST SP 800-63B-Aligned)</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Password Requirements:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Must be at least 8 characters long for standard users.</li>
                  <li>Administrative accounts must use passphrases of 15 characters or more.</li>
                  <li>Passwords can be up to 64 characters in length.</li>
                  <li>You may use letters, numbers, spaces, or symbols — all printable characters are allowed.</li>
                  <li>Use a long, memorable passphrase instead of complex rules (e.g., blue sky mountain trail).</li>
                  <li>Do not reuse or share passwords, and avoid common or known compromised passwords.</li>
                  <li>The system automatically checks passwords against known breach databases to ensure security.</li>
                </ul>
              </div>
            </div>

            {/* MFA */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground">Multi-Factor Authentication (MFA)</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>MFA is required for administrative and privileged accounts.</li>
                  <li>Supported options include:
                    <ul className="list-circle list-inside ml-4 mt-1 space-y-0.5">
                      <li>PIV/CAC smart cards or Login.gov</li>
                      <li>Authenticator apps (e.g., Google Authenticator, Microsoft Authenticator)</li>
                      <li>Hardware security keys (e.g., YubiKey, FIDO2/WebAuthn)</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>

            {/* Account Security */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground">Account Security</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Accounts are locked after repeated failed login attempts.</li>
                  <li>Passwords do not expire unless a compromise is detected.</li>
                  <li>Access is subject to monitoring, auditing, and compliance logging in accordance with FISMA and FedRAMP standards.</li>
                  <li>By signing in, you agree to authorized use, system monitoring, and applicable security policies.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="text-center mb-8 lg:hidden space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Welcome to the iAccessible Command Center
                </h1>
                <p className="text-muted-foreground mb-2">
                  A FedRAMP-aligned platform for accessibility, testing, and reporting.
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  Access is restricted to authorized users only. Unauthorized use is prohibited and subject to monitoring.
                </p>
              </div>
              
              <div className="text-left space-y-2 text-sm bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold text-foreground">Login Options:</p>
                <p className="text-muted-foreground">
                  <strong>Government SSO:</strong> Use your agency credentials (PIV/CAC, Login.gov, or agency SSO).
                </p>
                <p className="text-muted-foreground">
                  <strong>Email & Password:</strong> For approved commercial or test accounts only.
                </p>
              </div>
            </div>
            <TooltipProvider>
              <LoginForm />
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
