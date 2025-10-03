import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileX, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  icon: Icon = FileX 
}: EmptyStateProps) {
  return (
    <Card className="text-center py-12">
      <CardHeader>
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-muted-foreground" aria-hidden />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base max-w-md mx-auto">
          {description}
        </CardDescription>
      </CardHeader>
      {actionLabel && onAction && (
        <CardContent>
          <Button onClick={onAction} className="inline-flex items-center gap-2">
            {actionLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </CardContent>
      )}
    </Card>
  );
}



