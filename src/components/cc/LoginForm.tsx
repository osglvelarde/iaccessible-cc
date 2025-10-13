"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Shield, Mail } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [tabValue, setTabValue] = useState("email");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Mock credentials
    const MOCK_EMAIL = "test.user@example.gov";
    const MOCK_PASSWORD = "Test1234";

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
        // Success: redirect to Command Center
        setError(""); // No error
        window.location.href = "/";
      } else {
        setError("Invalid credentials. Please try again.");
      }
      console.log("Login attempt:", { email, password, keepSignedIn });
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Sign in</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access the Command Center
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sso" className="flex items-center gap-2">
              <Shield className="h-4 w-4" aria-hidden />
              Government SSO
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" aria-hidden />
              Email & Password
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {tabValue === "sso" && (
              <motion.div
                key="sso"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 mt-6 overflow-hidden"
              >
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ed">Department of Education</SelectItem>
                      <SelectItem value="doc">Department of Commerce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Button
                        className="w-full"
                        disabled
                        aria-label="Government SSO - Coming via your agency"
                      >
                        <Shield className="mr-2 h-4 w-4" aria-hidden />
                        Sign in with Government SSO
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>Coming via your agency</Tooltip.Content>
                  </Tooltip.Root>
                  
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled
                        aria-label="Login.gov - Coming via your agency"
                      >
                        Sign in with Login.gov
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>Coming via your agency</Tooltip.Content>
                  </Tooltip.Root>
                </div>
              </motion.div>
            )}
            {tabValue === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 mt-6 overflow-hidden"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.gov"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      aria-describedby="email-help"
                    />
                    <p id="email-help" className="text-sm text-muted-foreground">
                      Use your government email address
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        aria-describedby="password-help"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden />
                        )}
                      </Button>
                    </div>
                    <p id="password-help" className="text-sm text-muted-foreground">
                      Minimum 8 characters with letters and numbers
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="keep-signed-in"
                      checked={keepSignedIn}
                      onCheckedChange={(checked) => setKeepSignedIn(checked as boolean)}
                    />
                    <Label htmlFor="keep-signed-in" className="text-sm">
                      Keep me signed in
                    </Label>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </Tabs>

        <div className="mt-6 pt-6 border-t">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground justify-center">
            <a href="#" className="hover:underline">Privacy/PII Notice</a>
            <a href="#" className="hover:underline">Rules of Behavior</a>
            <a href="#" className="hover:underline">Security & Compliance</a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
