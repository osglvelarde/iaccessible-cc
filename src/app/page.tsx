"use client";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { MODULE_GROUPS, MODULES } from "@/lib/constants";
import ModuleCard from "@/components/cc/ModuleCard";
import EnhancedModuleCard from "@/components/cc/EnhancedModuleCard";
import ScanMonitorCard from "@/components/cc/ScanMonitorCard";
import DisabledModuleCard from "@/components/cc/DisabledModuleCard";
import IntroCard from "@/components/cc/IntroCard";
import QuickActionsBar from "@/components/cc/QuickActionsBar";
import ModuleSearchFilter from "@/components/cc/ModuleSearchFilter";
import CustomizableLayout from "@/components/cc/CustomizableLayout";
import LoadingSkeleton, { QuickActionsSkeleton, ActivityFeedSkeleton } from "@/components/cc/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getFavorites, toggleFavorite } from "@/lib/favorites";
import { getScanHistory, type ScanHistoryItem } from "@/lib/scanner-api";

// Debounce utility for performance
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

export default function Home() {
  // TODO inject real RBAC; for now enable all as example
  const access: Record<string, boolean> = Object.fromEntries(MODULES.map(m => [m.key, true]));
  
  // State for enhanced functionality
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filteredModules, setFilteredModules] = useState<typeof MODULES>([]);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  // Load favorites and scan history on mount with loading state
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Simulate loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const favoriteModules = getFavorites();
      setFavorites(favoriteModules.map(f => f.moduleKey));
      
      // Load scan history for activity feed
      try {
        const history = await getScanHistory();
        // Filter out any invalid entries
        const validHistory = history.filter(item =>
          item &&
          typeof item === 'object' &&
          item.url &&
          item.status &&
          item.id
        );
        setScanHistory(validHistory);
      } catch (error) {
        console.error('Failed to load scan history:', error);
        // Continue without scan history
      }
      
      setIsLoading(false);
      setIsInitialized(true);
    };
    
    loadData();
  }, []);

  // Create enhanced modules with favorites and usage data (client-side only)
  const enhancedModules = useMemo(() => {
    if (typeof window === "undefined") {
      // Return basic modules during SSR
      return MODULES.map(module => ({
        ...module,
        group: MODULE_GROUPS.find(g => g.modules.some(m => m.key === module.key))?.title || "Other",
        isFavorite: false,
        lastUsed: undefined,
        usageCount: 0
      }));
    }
    
    return MODULES.map(module => ({
      ...module,
      group: MODULE_GROUPS.find(g => g.modules.some(m => m.key === module.key))?.title || "Other",
      isFavorite: favorites.includes(module.key),
      lastUsed: localStorage.getItem(`cc.lastUsed.${module.key}`) || undefined,
      usageCount: parseInt(localStorage.getItem(`cc.usage.${module.key}`) || "0")
    }));
  }, [favorites]);

  // Memoize the favorite toggle handler with optimistic updates
  const handleToggleFavorite = useCallback((moduleKey: string, isFavorite: boolean) => {
    const module = MODULES.find(m => m.key === moduleKey);
    if (module) {
      // Optimistic update - update UI immediately
      setFavorites(prev => 
        isFavorite 
          ? [...prev, moduleKey]
          : prev.filter(key => key !== moduleKey)
      );
      
      // Then update localStorage (non-blocking)
      setTimeout(() => {
        toggleFavorite(moduleKey, module.title);
      }, 0);
    }
  }, []);

  // Memoize the module usage tracking with debouncing
  const trackModuleUsage = useCallback((moduleKey: string) => {
    if (typeof window !== "undefined") {
      // Use requestIdleCallback for non-critical updates
      const updateUsage = () => {
        localStorage.setItem(`cc.lastUsed.${moduleKey}`, new Date().toISOString());
        const currentCount = parseInt(localStorage.getItem(`cc.usage.${moduleKey}`) || "0");
        localStorage.setItem(`cc.usage.${moduleKey}`, (currentCount + 1).toString());
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(updateUsage);
      } else {
        setTimeout(updateUsage, 0);
      }
    }
  }, []);

  // Create widgets for customizable layout
  const widgets = [
    {
      id: "intro",
      title: "Welcome",
      component: <IntroCard />,
      enabled: true,
      order: 0,
      size: "large" as const
    },
    {
      id: "quick-actions",
      title: "Quick Actions",
      component: <QuickActionsBar />,
      enabled: true,
      order: 1,
      size: "large" as const
    },
    {
      id: "search-filter",
      title: "Search & Filter",
      component: (
        <ModuleSearchFilter 
          modules={enhancedModules}
          onFilteredModules={setFilteredModules}
        />
      ),
      enabled: showSearchFilter,
      order: 2,
      size: "large" as const
    }
  ];

  // Default to all modules if no filtering
  const modulesToDisplay = filteredModules.length > 0 ? filteredModules : enhancedModules;

  // Show loading skeleton while initializing
  if (isLoading || !isInitialized) {
    return (
      <main>
        <div className="space-y-6">
          <QuickActionsSkeleton />
          <div className="mt-6 mb-4">
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <LoadingSkeleton count={8} />
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* Customizable Layout */}
      <CustomizableLayout 
        widgets={widgets}
        onLayoutChange={(updatedWidgets) => {
          // Handle layout changes if needed
        }}
        isCollapsible={true}
        defaultCollapsed={false}
      />

      {/* Search/Filter Toggle */}
      <div className="mt-6 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSearchFilter(!showSearchFilter)}
          className="text-muted-foreground hover:text-foreground"
        >
          {showSearchFilter ? "Hide" : "Show"} Search & Filter
        </Button>
      </div>


      {/* Module Groups */}
      {MODULE_GROUPS.map((group, groupIndex) => {
        const groupModules = modulesToDisplay.filter(m => 
          group.modules.some(gm => gm.key === m.key)
        );

        if (groupModules.length === 0) return null;

        return (
          <section key={group.title} className={groupIndex > 0 ? "mt-8" : ""}>
            <h2 className="text-2xl font-semibold tracking-tight mb-4">{group.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groupModules.map(m => {
                if (!access[m.key]) {
                  return <DisabledModuleCard key={m.key} title={m.title} desc={m.desc} />;
                }
                
                // Use ScanMonitorCard for scan monitor module
                if (m.key === 'scanMonitor') {
                  return <ScanMonitorCard key={m.key} title={m.title} desc={m.desc} href={m.href} />;
                }
                
                // Use enhanced ModuleCard for all other modules
                return (
                  <EnhancedModuleCard 
                    key={m.key} 
                    title={m.title} 
                    desc={m.desc} 
                    href={m.href}
                    moduleKey={m.key}
                    lastUsed={m.lastUsed}
                    usageCount={m.usageCount}
                    isFavorite={m.isFavorite}
                    onToggleFavorite={handleToggleFavorite}
                    onModuleOpen={trackModuleUsage}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
