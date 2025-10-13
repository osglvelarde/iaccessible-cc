"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Shield, User, Key, Building } from "lucide-react";
import { ScheduleConfig, SignInMethod, Persona } from "@/lib/scheduler-api";

interface AuthenticationSectionProps {
  formData: Partial<ScheduleConfig>;
  onUpdate: (updates: Partial<ScheduleConfig>) => void;
}

const signInMethodOptions: Array<{
  value: SignInMethod;
  label: string;
  description: string;
}> = [
  {
    value: 'basic-auth',
    label: 'Basic Authentication Methods',
    description: 'Username and password authentication'
  },
  {
    value: 'sso',
    label: 'Single Sign-On (SSO)',
    description: 'Enterprise SSO integration (SAML, OAuth, etc.)'
  },
  {
    value: 'mfa',
    label: 'Multi-Factor Authentication (MFA)',
    description: 'Two-factor or multi-factor authentication'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Custom or other authentication methods'
  }
];

const personaOptions: Array<{
  value: Persona;
  label: string;
  description: string;
}> = [
  {
    value: 'citizen',
    label: 'Citizen',
    description: 'General public user accessing government services'
  },
  {
    value: 'employee',
    label: 'Employee',
    description: 'Staff or internal users with role-based access'
  },
  {
    value: 'vendor',
    label: 'Vendor',
    description: 'External partners or contractors accessing specific systems'
  },
  {
    value: 'administrator',
    label: 'Administrator',
    description: 'Users managing content, systems, or security settings'
  }
];

export default function AuthenticationSection({ formData, onUpdate }: AuthenticationSectionProps) {
  const authentication = formData.authentication || { requiresAuth: false };
  const requiresAuth = authentication.requiresAuth;

  const handleAuthToggle = (checked: boolean) => {
    onUpdate({
      authentication: {
        ...authentication,
        requiresAuth: checked,
        // Reset auth fields when toggling off
        signInMethod: checked ? authentication.signInMethod : undefined,
        testAccountDetails: checked ? authentication.testAccountDetails : undefined,
        persona: checked ? authentication.persona : undefined,
        purposeArea: checked ? authentication.purposeArea : undefined
      }
    });
  };

  const handleSignInMethodChange = (value: SignInMethod) => {
    onUpdate({
      authentication: {
        ...authentication,
        signInMethod: value
      }
    });
  };

  const handleTestAccountChange = (value: string) => {
    onUpdate({
      authentication: {
        ...authentication,
        testAccountDetails: value
      }
    });
  };

  const handlePersonaChange = (value: Persona) => {
    onUpdate({
      authentication: {
        ...authentication,
        persona: value
      }
    });
  };

  const handlePurposeAreaChange = (value: string) => {
    onUpdate({
      authentication: {
        ...authentication,
        purposeArea: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Authentication Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center space-x-3">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <div>
            <Label htmlFor="requiresAuth" className="text-sm font-medium">
              Requires Authentication
            </Label>
            <p className="text-xs text-muted-foreground">
              Indicate whether the selected webpage or application requires login credentials to access
            </p>
          </div>
        </div>
        <Switch
          id="requiresAuth"
          checked={requiresAuth}
          onCheckedChange={handleAuthToggle}
        />
      </div>

      {/* Conditional Authentication Fields */}
      <AnimatePresence>
        {requiresAuth && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 overflow-hidden"
          >
            {/* Sign-in Method */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="signInMethod" className="text-sm font-medium">
                  Sign-in Method
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Select the authentication method used by your application. 
                        This helps our team understand how to access your content for testing.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <Select
                value={authentication.signInMethod || ''}
                onValueChange={handleSignInMethodChange}
              >
                <SelectTrigger id="signInMethod" className="w-full">
                  <SelectValue placeholder="Select sign-in method" />
                </SelectTrigger>
                <SelectContent>
                  {signInMethodOptions.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{method.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {method.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Test Account Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="testAccountDetails" className="text-sm font-medium">
                  Test Account Details
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Provide test account credentials or access instructions. 
                        Include username, password, and any special access requirements.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <Textarea
                id="testAccountDetails"
                placeholder="Enter test account credentials and access instructions...&#10;&#10;Example:&#10;Username: test.user@agency.gov&#10;Password: TestPass123&#10;Special Instructions: Account has limited access to specific sections"
                value={authentication.testAccountDetails || ''}
                onChange={(e) => handleTestAccountChange(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Persona */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="persona" className="text-sm font-medium">
                  User Persona
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Select the type of user who will interact with the system for accessibility testing. 
                        This helps ensure testing covers the appropriate user experience.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <Select
                value={authentication.persona || ''}
                onValueChange={handlePersonaChange}
              >
                <SelectTrigger id="persona" className="w-full">
                  <SelectValue placeholder="Select user persona" />
                </SelectTrigger>
                <SelectContent>
                  {personaOptions.map((persona) => (
                    <SelectItem key={persona.value} value={persona.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{persona.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {persona.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purpose/Area */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="purposeArea" className="text-sm font-medium">
                  Purpose/Area
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Describe the primary function or business area of the webpage or application. 
                        This helps our team understand the context and purpose of the content being tested.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <Textarea
                id="purposeArea"
                placeholder="Describe the primary function or business area...&#10;&#10;Examples:&#10;• Public Information – General content for citizens or visitors&#10;• Internal Operations – Employee or administrative tools&#10;• Customer Services – Portals for vendors, partners, or customers&#10;• Regulatory / Compliance – Systems supporting legal or reporting requirements"
                value={authentication.purposeArea || ''}
                onChange={(e) => handlePurposeAreaChange(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Authentication Summary */}
            <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-start">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">
                    Authentication Configuration
                  </h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Your authentication settings will be used to access protected content during scans. 
                    Test account credentials will be securely stored and only used for accessibility testing purposes.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Authentication Note */}
      {!requiresAuth && (
        <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-start">
            <Shield className="h-4 w-4 text-gray-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-gray-800">
                Public Content Scanning
              </h4>
              <p className="text-xs text-gray-700 mt-1">
                Scans will be performed on publicly accessible content without authentication. 
                If your content requires login, please enable authentication settings above.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
