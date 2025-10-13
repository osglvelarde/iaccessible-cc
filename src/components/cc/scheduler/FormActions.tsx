"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  FileText, 
  RotateCcw, 
  X, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface FormActionsProps {
  isSubmitting: boolean;
  isDraftSaving: boolean;
  onSaveSchedule: () => void;
  onSaveDraft: () => void;
  onClearForm: () => void;
}

export default function FormActions({
  isSubmitting,
  isDraftSaving,
  onSaveSchedule,
  onSaveDraft,
  onClearForm
}: FormActionsProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearClick = () => {
    if (showClearConfirm) {
      onClearForm();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <Separator />
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onSaveSchedule}
            disabled={isSubmitting || isDraftSaving}
            className="min-w-[140px]"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Schedule
              </>
            )}
          </Button>

          <Button
            onClick={onSaveDraft}
            disabled={isSubmitting || isDraftSaving}
            variant="outline"
            className="min-w-[140px]"
            size="lg"
          >
            {isDraftSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Save as Draft
              </>
            )}
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleClearClick}
            disabled={isSubmitting || isDraftSaving}
            variant={showClearConfirm ? "destructive" : "outline"}
            className="min-w-[120px]"
            size="lg"
          >
            {showClearConfirm ? (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                Confirm Clear
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear Form
              </>
            )}
          </Button>

          <Button
            asChild
            variant="ghost"
            className="min-w-[100px]"
            size="lg"
          >
            <Link href="/">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Link>
          </Button>
        </div>
      </div>

      {/* Clear Confirmation Message */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: showClearConfirm ? 1 : 0, 
          height: showClearConfirm ? "auto" : 0 
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-amber-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Are you sure?</strong> This will clear all form data and cannot be undone. 
              Click &quot;Confirm Clear&quot; to proceed or wait for this message to disappear.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          <strong>Save Schedule:</strong> Creates an active scan schedule that will run according to your configuration.{" "}
          <strong>Save as Draft:</strong> Saves your progress so you can return and complete later.
        </p>
      </div>
    </div>
  );
}
