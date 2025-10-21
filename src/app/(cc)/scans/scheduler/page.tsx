"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Globe, Settings, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ScheduleConfig, 
  OperatingUnit, 
  IntakeDomain,
  createSchedule,
  getOperatingUnits,
  getIntakeDomains,
  validateScheduleConfig
} from "@/lib/scheduler-api";

// Form sections
import OrganizationSection from "@/components/cc/scheduler/OrganizationSection";
import ScanTypeSection from "@/components/cc/scheduler/ScanTypeSection";
import DomainConfigSection from "@/components/cc/scheduler/DomainConfigSection";
import ScheduleConfigSection from "@/components/cc/scheduler/ScheduleConfigSection";
import AuthenticationSection from "@/components/cc/scheduler/AuthenticationSection";
import FormActions from "@/components/cc/scheduler/FormActions";

// Removed unused label constants

export default function ScansSchedulerPage() {
  // Form state
  const [formData, setFormData] = useState<Partial<ScheduleConfig>>({
    organization: 'Department of Commerce',
    scanTypes: [],
    domainConfig: {
      primaryDomain: '',
      subdomains: []
    },
    frequency: 'one-time',
    startDate: '',
    startTime: '',
    authentication: {
      requiresAuth: false
    },
    createdBy: 'current-user', // Would come from auth context
    createdAt: new Date().toISOString(),
    status: 'draft'
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [operatingUnits, setOperatingUnits] = useState<OperatingUnit[]>([]);
  const [intakeDomains, setIntakeDomains] = useState<IntakeDomain[]>([]);
  const [showIntakeImport, setShowIntakeImport] = useState(false);

  // Load operating units on mount
  useEffect(() => {
    const loadOperatingUnits = async () => {
      const units = await getOperatingUnits();
      setOperatingUnits(units);
    };
    loadOperatingUnits();
  }, []);

  // Load intake domains when operating unit changes
  useEffect(() => {
    if (formData.operatingUnit) {
      const loadIntakeDomains = async () => {
        const domains = await getIntakeDomains(formData.operatingUnit!);
        setIntakeDomains(domains);
        setShowIntakeImport(domains.length > 0);
      };
      loadIntakeDomains();
    } else {
      setIntakeDomains([]);
      setShowIntakeImport(false);
    }
  }, [formData.operatingUnit]);

  const updateFormData = (updates: Partial<ScheduleConfig>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear errors when user makes changes
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSaveSchedule = async () => {
    setIsSubmitting(true);
    setErrors([]);

    // Validate form
    const validation = validateScheduleConfig(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await createSchedule(formData as ScheduleConfig);
      if (result.success) {
        // Show success message and redirect or reset form
        console.log('Schedule created successfully:', result.scheduleId);
        // TODO: Show success toast and redirect to schedules list
      } else {
        setErrors([result.error || 'Failed to create schedule']);
      }
    } catch {
      setErrors(['An unexpected error occurred']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsDraftSaving(true);
    try {
      const result = await createSchedule({ ...formData, status: 'draft' } as ScheduleConfig);
      if (result.success) {
        console.log('Draft saved successfully:', result.scheduleId);
        // TODO: Show success toast
      } else {
        setErrors([result.error || 'Failed to save draft']);
      }
    } catch {
      setErrors(['An unexpected error occurred']);
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      organization: 'Department of Commerce',
      scanTypes: [],
      domainConfig: {
        primaryDomain: '',
        subdomains: []
      },
      frequency: 'one-time',
      startDate: '',
      startTime: '',
      authentication: {
        requiresAuth: false
      },
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      status: 'draft'
    });
    setErrors([]);
  };

  const handleImportFromIntake = (domain: IntakeDomain) => {
    updateFormData({
      domainConfig: {
        primaryDomain: domain.domain,
        subdomains: domain.subdomains,
        manualPages: formData.domainConfig?.manualPages || []
      }
    });
    setShowIntakeImport(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Scans Scheduler</h1>
            <Badge variant="outline" className="text-sm">
              <Calendar className="h-3 w-3 mr-1" />
              Schedule Scans
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Command Center
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Instructional Guidance */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Quick Instructions:</strong> Use this form to schedule automated accessibility scans for your operating unit. 
            Select your organization and operating unit, choose scan types, configure domains, set schedule frequency, 
            and optionally configure authentication settings. You can save drafts and return to complete later.
          </AlertDescription>
        </Alert>

        {/* Error Display */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Form Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
          className="space-y-8"
        >
          {/* Organization & Operating Unit Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Organization & Operating Unit Setup
              </CardTitle>
              <CardDescription>
                Select your organization and operating unit for this scan schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationSection
                formData={formData}
                operatingUnits={operatingUnits}
                onUpdate={updateFormData}
              />
            </CardContent>
            </Card>
          </motion.div>

          {/* Scan Configuration Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Scan Configuration
              </CardTitle>
              <CardDescription>
                Select the types of scans to include in this schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScanTypeSection
                formData={formData}
                onUpdate={updateFormData}
              />
            </CardContent>
            </Card>
          </motion.div>

          {/* Domain & URL Configuration Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Domain & URL Configuration
              </CardTitle>
              <CardDescription>
                Configure the domains and URLs to be scanned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DomainConfigSection
                formData={formData}
                intakeDomains={intakeDomains}
                showIntakeImport={showIntakeImport}
                onUpdate={updateFormData}
                onImportFromIntake={handleImportFromIntake}
                onToggleIntakeImport={() => setShowIntakeImport(!showIntakeImport)}
              />
            </CardContent>
            </Card>
          </motion.div>

          {/* Schedule Configuration Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Configuration
              </CardTitle>
              <CardDescription>
                Set the frequency and timing for your scans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleConfigSection
                formData={formData}
                onUpdate={updateFormData}
              />
            </CardContent>
            </Card>
          </motion.div>

          {/* Authentication & Login Walls Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authentication & Login Walls
              </CardTitle>
              <CardDescription>
                Configure authentication settings if your pages require login
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthenticationSection
                formData={formData}
                onUpdate={updateFormData}
              />
            </CardContent>
            </Card>
          </motion.div>

          {/* Form Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card>
            <CardContent className="pt-6">
              <FormActions
                isSubmitting={isSubmitting}
                isDraftSaving={isDraftSaving}
                onSaveSchedule={handleSaveSchedule}
                onSaveDraft={handleSaveDraft}
                onClearForm={handleClearForm}
              />
            </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
