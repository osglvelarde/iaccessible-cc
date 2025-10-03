import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function ErrorBanner({ 
  message, 
  onRetry, 
  retryLabel = "Try again" 
}: ErrorBannerProps) {
  return (
    <Alert variant="destructive" role="status" className="mb-4">
      <AlertCircle className="h-4 w-4" aria-hidden />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="ml-4"
          >
            <RefreshCw className="h-3 w-3 mr-1" aria-hidden />
            {retryLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}



