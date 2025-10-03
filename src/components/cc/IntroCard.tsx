"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function IntroCard() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("cc.intro.dismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("cc.intro.dismissed", "1");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 mb-6">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">Welcome to iAccessible Command Center</CardTitle>
            <CardDescription className="text-base">
              Your central hub for accessibility testing and compliance management. 
              Access all your tools from one place and ensure WCAG and Section 508 compliance.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={dismiss}
            aria-label="Dismiss welcome message"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={dismiss}>
            Got it
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
