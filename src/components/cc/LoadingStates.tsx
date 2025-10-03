"use client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Loader2,
  Download,
  Upload,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStatesProps {
  className?: string;
}

export default function LoadingStates({ className }: LoadingStatesProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Loading Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Buttons</CardTitle>
          <CardDescription>
            Various button loading states using shadcn patterns
          </CardDescription>
        </CardHeader>
        <div className="p-6 pt-0 space-y-4">
          <div className="flex flex-wrap gap-4">
            <LoadingButton loading={true} loadingText="Saving...">
              Save Changes
            </LoadingButton>
            <LoadingButton variant="outline" loading={true} loadingText="Uploading...">
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </LoadingButton>
            <LoadingButton variant="destructive" loading={true} loadingText="Deleting...">
              Delete Item
            </LoadingButton>
            <LoadingButton variant="secondary" loading={true} loadingText="Processing...">
              <RefreshCw className="mr-2 h-4 w-4" />
              Process Data
            </LoadingButton>
          </div>
        </div>
      </Card>

      {/* Progress Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Indicators</CardTitle>
          <CardDescription>
            Progress bars and loading indicators
          </CardDescription>
        </CardHeader>
        <div className="p-6 pt-0 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Upload Progress</span>
              <span>75%</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Scan Progress</span>
              <span>45%</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing</span>
              <span>100%</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>
        </div>
      </Card>

      {/* Spinners */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Spinners</CardTitle>
          <CardDescription>
            Different sizes and contexts for loading spinners
          </CardDescription>
        </CardHeader>
        <div className="p-6 pt-0 space-y-4">
          <div className="flex items-center gap-4">
            <Spinner size="sm" />
            <span className="text-sm">Small spinner</span>
          </div>
          <div className="flex items-center gap-4">
            <Spinner size="md" />
            <span className="text-sm">Medium spinner</span>
          </div>
          <div className="flex items-center gap-4">
            <Spinner size="lg" />
            <span className="text-sm">Large spinner</span>
          </div>
          <div className="flex items-center gap-4">
            <Spinner className="text-primary" />
            <span className="text-sm">Primary colored spinner</span>
          </div>
        </div>
      </Card>

      {/* Alert States */}
      <Card>
        <CardHeader>
          <CardTitle>Status Alerts</CardTitle>
          <CardDescription>
            Different alert types for various states
          </CardDescription>
        </CardHeader>
        <div className="p-6 pt-0 space-y-4">
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Your changes have been saved successfully.
            </AlertDescription>
          </Alert>

          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Please review your settings before proceeding.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Something went wrong. Please try again.
            </AlertDescription>
          </Alert>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              This is an informational message.
            </AlertDescription>
          </Alert>
        </div>
      </Card>

      {/* Skeleton Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Skeleton Loading</CardTitle>
          <CardDescription>
            Skeleton components for different content types
          </CardDescription>
        </CardHeader>
        <div className="p-6 pt-0 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
          
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-[125px] w-[250px] rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
