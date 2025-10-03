"use client";
import { getRecent } from "@/lib/recent-modules";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function RecentModules({ className="" }:{ className?:string }) {
  const router = useRouter();
  const items = typeof window !== "undefined" ? getRecent() : [];
  
  if (!items.length) return null;

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleClick = (href: string) => {
    if (href.startsWith('/')) {
      router.push(href);
    } else {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recently Opened
        </CardTitle>
        <CardDescription>
          Quick access to your recently used modules
        </CardDescription>
      </CardHeader>
      <div className="p-6 pt-0">
        <div className="space-y-2">
          {items.slice(0, 5).map((item, index) => {
            const isInternal = item.href.startsWith('/');
            return (
              <div
                key={item.href}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group",
                  "animate-in fade-in-0 slide-in-from-left-2"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleClick(item.href)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimeAgo(item.timestamp)}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {isInternal ? (
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  ) : (
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {items.length > 5 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" className="w-full">
              View All Recent ({items.length})
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

