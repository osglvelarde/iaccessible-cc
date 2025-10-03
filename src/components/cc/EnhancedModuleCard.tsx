"use client";
import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, ArrowRight, Heart, Star, Clock, BarChart3 } from "lucide-react";
import { pushRecent } from "@/lib/recent-modules";
import { cn } from "@/lib/utils";

interface EnhancedModuleCardProps {
  title: string;
  desc: string;
  href: string;
  moduleKey: string;
  lastUsed?: string;
  usageCount?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (moduleKey: string, isFavorite: boolean) => void;
  onModuleOpen?: (moduleKey: string) => void;
}

const EnhancedModuleCard = memo(function EnhancedModuleCard({ 
  title, 
  desc, 
  href, 
  moduleKey,
  lastUsed,
  usageCount = 0,
  isFavorite = false,
  onToggleFavorite,
  onModuleOpen
}: EnhancedModuleCardProps) {
  const [isFavorited, setIsFavorited] = useState(isFavorite);
  const router = useRouter();
  
  const isInternalRoute = href.startsWith('/');
  
  // Memoize the open function to prevent unnecessary re-renders
  const open = useCallback(() => { 
    pushRecent(title, href);
    onModuleOpen?.(moduleKey); // Track module usage
    if (isInternalRoute) {
      router.push(href);
    } else {
      window.open(href,"_blank","noopener,noreferrer"); 
    }
  }, [title, href, moduleKey, onModuleOpen, isInternalRoute, router]);

  // Memoize the toggle favorite function
  const toggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavoriteState = !isFavorited;
    setIsFavorited(newFavoriteState);
    onToggleFavorite?.(moduleKey, newFavoriteState);
  }, [isFavorited, moduleKey, onToggleFavorite]);

  // Memoize the formatLastUsed function
  const formatLastUsed = useCallback((timestamp?: string) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card 
          role="group" 
          className={cn(
            "h-full flex flex-col cursor-pointer hover:shadow-md transition-all duration-200 group",
            isFavorited && "ring-2 ring-yellow-200 dark:ring-yellow-800"
          )}
        >
          <CardHeader className="flex-1 flex flex-col gap-3 p-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <CardTitle className="tracking-tight text-lg leading-tight flex-1">
                  {title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                    isFavorited && "opacity-100"
                  )}
                  onClick={toggleFavorite}
                >
                  <Heart 
                    className={cn(
                      "h-4 w-4",
                      isFavorited ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                    )} 
                  />
                </Button>
              </div>
              <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                {desc}
              </CardDescription>
            </div>

            {/* Usage Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {usageCount > 0 && (
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  <span>{usageCount} uses</span>
                </div>
              )}
              {lastUsed && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatLastUsed(lastUsed)}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button 
                onClick={open} 
                aria-label={`${title} — ${isInternalRoute ? 'navigates to' : 'opens in a new tab'}`} 
                className="w-full"
              >
                Open {isInternalRoute ? <ArrowRight className="ms-2 h-4 w-4" aria-hidden /> : <ExternalLink className="ms-2 h-4 w-4" aria-hidden />}
              </Button>
            </div>
          </CardHeader>
        </Card>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-xs opacity-90">
            {isInternalRoute ? 'Click to navigate to this module' : 'Click to open in a new tab'}
          </p>
          {isFavorited && (
            <p className="text-xs opacity-90 text-yellow-400">⭐ Favorited</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

export default EnhancedModuleCard;

