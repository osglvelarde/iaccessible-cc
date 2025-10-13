"use client";
import { useState, useEffect } from "react";
import { getRecent } from "@/lib/recent-modules";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Clock, 
  ExternalLink, 
  ArrowRight, 
  History,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function RecentModulesDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<typeof getRecent extends () => infer T ? T : never[]>([]);
  const recentItems = items.slice(0, 8); // Show up to 8 recent items

  // Load items on client side to prevent hydration mismatch
  useEffect(() => {
    setItems(getRecent());
  }, []);

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
    setIsOpen(false);
  };

  const clearHistory = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cc.recent");
      window.location.reload(); // Simple way to refresh the component
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Clock className="h-4 w-4" />
              {recentItems.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {recentItems.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Recently Opened ({recentItems.length})</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-semibold">Recently Opened</span>
          </div>
          {recentItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {recentItems.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recently opened modules</p>
            <p className="text-xs mt-1">Start using modules to see them here</p>
          </div>
        ) : (
          <div className="p-2">
            {recentItems.map((item, index) => {
              const isInternal = item.href.startsWith('/');
              return (
                <div
                  key={item.href}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group",
                    "animate-in fade-in-0 slide-in-from-left-2"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleClick(item.href)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimeAgo(item.ts.toString())}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
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
        )}

        {recentItems.length > 8 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="outline" size="sm" className="w-full">
                <History className="h-4 w-4 mr-2" />
                View All Recent ({items.length})
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
