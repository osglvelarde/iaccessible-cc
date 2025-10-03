"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Search, 
  Filter, 
  X, 
  Grid3X3, 
  List,
  Star,
  Clock,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

// Debounce hook for performance
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface Module {
  key: string;
  title: string;
  desc: string;
  href: string;
  group: string;
  isFavorite?: boolean;
  lastUsed?: string;
  usageCount?: number;
}

interface ModuleSearchFilterProps {
  modules: Module[];
  onFilteredModules: (filteredModules: Module[]) => void;
  className?: string;
}

export default function ModuleSearchFilter({ 
  modules, 
  onFilteredModules, 
  className 
}: ModuleSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "favorites" | "recent" | "usage">("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const availableGroups = useMemo(() => {
    return Array.from(new Set(modules.map(m => m.group)));
  }, [modules]);

  const filteredModules = useMemo(() => {
    let filtered = modules;

    // Search filter (use debounced search term)
    if (debouncedSearchTerm) {
      filtered = filtered.filter(module =>
        module.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        module.desc.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Group filter
    if (selectedGroups.length > 0) {
      filtered = filtered.filter(module => selectedGroups.includes(module.group));
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(module => module.isFavorite);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "favorites":
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return a.title.localeCompare(b.title);
        case "recent":
          if (!a.lastUsed && !b.lastUsed) return a.title.localeCompare(b.title);
          if (!a.lastUsed) return 1;
          if (!b.lastUsed) return -1;
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        case "usage":
          return (b.usageCount || 0) - (a.usageCount || 0);
        case "name":
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return filtered;
  }, [modules, debouncedSearchTerm, selectedGroups, showFavoritesOnly, sortBy]);

  // Update parent component when filtered modules change
  useEffect(() => {
    onFilteredModules(filteredModules);
  }, [filteredModules, onFilteredModules]);

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGroups([]);
    setShowFavoritesOnly(false);
    setSortBy("name");
  };

  const hasActiveFilters = searchTerm || selectedGroups.length > 0 || showFavoritesOnly;

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search & Filter Modules
        </CardTitle>
        <CardDescription>
          Find and organize your modules by category, usage, or favorites
        </CardDescription>
      </CardHeader>
      <div className="p-6 pt-0 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Group Filters */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Categories</label>
          <div className="flex flex-wrap gap-2">
            {availableGroups.map(group => (
              <Tooltip key={group}>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedGroups.includes(group) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleGroup(group)}
                  >
                    {group}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter by {group} modules</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Star className="h-4 w-4 mr-1" />
                Favorites Only
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show only favorited modules</p>
            </TooltipContent>
          </Tooltip>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Sort and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Sort By</label>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={sortBy === "name" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("name")}
                  >
                    Name
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sort alphabetically by name</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={sortBy === "favorites" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("favorites")}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Favorites
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show favorites first</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={sortBy === "recent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("recent")}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Recent
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sort by most recently used</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={sortBy === "usage" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("usage")}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Usage
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sort by usage frequency</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">View</label>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Grid view</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>List view</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredModules.length} of {modules.length} modules
              {hasActiveFilters && " (filtered)"}
            </span>
            {filteredModules.length !== modules.length && (
              <Badge variant="secondary">
                {modules.length - filteredModules.length} hidden
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
