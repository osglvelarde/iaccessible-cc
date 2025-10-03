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
            <p className="text-lg text-muted-foreground">
              Your central hub for accessibility testing and compliance management. 
              Ensure your digital content meets WCAG and Section 508 standards.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Comprehensive accessibility testing</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">WCAG 2.1 AA compliance reporting</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Section 508 compliance tools</span>
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
