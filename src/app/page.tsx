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
import { useAuth } from "@/components/cc/AuthProvider";

// Debounce utility for performance
const useDebounce = (value: string, delay: number) => {
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
  const { user, hasPermission, isLoading: authLoading } = useAuth();
  
  // Get user permissions for each module
  const access: Record<string, boolean> = useMemo(() => {
    if (!user) {
      return Object.fromEntries(MODULES.map(m => [m.key, false]));
    }
    return Object.fromEntries(MODULES.map(m => [m.key, hasPermission(m.key)]));
  }, [user, hasPermission]);
  
  // State for enhanced functionality
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filteredModules, setFilteredModules] = useState<typeof enhancedModules>([]);
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
    const moduleItem = MODULES.find(m => m.key === moduleKey);
    if (moduleItem) {
      // Optimistic update - update UI immediately
      setFavorites(prev => 
        isFavorite 
          ? [...prev, moduleKey]
          : prev.filter(key => key !== moduleKey)
      );
      
      // Then update localStorage (non-blocking)
      setTimeout(() => {
        toggleFavorite(moduleKey, moduleItem.title);
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
      enabled: false, // Hide intro card by default
      order: 0,
      size: "large" as const
    },
    {
      id: "quick-actions",
      title: "Quick Actions",
      component: <QuickActionsBar />,
      enabled: true, // Keep Quick Actions visible
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
  if (isLoading || !isInitialized || authLoading) {
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

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <main>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <h1 className="text-2xl font-semibold">Welcome to iAccessible Command Center</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Please log in to access the accessibility testing and compliance management tools.
          </p>
          <Button asChild>
            <a href="/login">Log In</a>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* User Role Indicator */}
      {user && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Welcome back, {user.firstName}!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.groups[0]?.name} • {user.operatingUnit.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {Object.keys(access).filter(key => access[key]).length} modules accessible
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {modulesToDisplay.filter(m => !access[m.key]).length} restricted
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - Always visible */}
      <div className="mb-6">
        <QuickActionsBar />
      </div>

      {/* Customizable Layout - Hidden */}
      {/* <CustomizableLayout 
        widgets={widgets}
        onLayoutChange={(updatedWidgets) => {
          // Handle layout changes if needed
        }}
        isCollapsible={true}
        defaultCollapsed={false}
        defaultDismissed={true}
      /> */}

      {/* Search/Filter Toggle - Hidden */}
      {/* <div className="mt-6 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSearchFilter(!showSearchFilter)}
          className="text-muted-foreground hover:text-foreground"
        >
          {showSearchFilter ? "Hide" : "Show"} Search & Filter
        </Button>
      </div> */}


      {/* Module Groups - Reordered by Access */}
      {(() => {
        // Separate modules into accessible and inaccessible
        const accessibleModules = modulesToDisplay.filter(m => access[m.key]);
        const inaccessibleModules = modulesToDisplay.filter(m => !access[m.key]);
        
        // Group accessible modules by their original groups
        const accessibleGroups = MODULE_GROUPS.map(group => ({
          ...group,
          modules: group.modules.filter(m => 
            accessibleModules.some(am => am.key === m.key)
          )
        })).filter(group => group.modules.length > 0);
        
        // Group inaccessible modules by their original groups
        const inaccessibleGroups = MODULE_GROUPS.map(group => ({
          ...group,
          modules: group.modules.filter(m => 
            inaccessibleModules.some(im => im.key === m.key)
          )
        })).filter(group => group.modules.length > 0);

        return (
          <>
            {/* Accessible Modules First */}
            {accessibleGroups.map((group, groupIndex) => (
              <section key={`accessible-${group.title}`} className={groupIndex > 0 ? "mt-8" : ""}>
                <h2 className="text-2xl font-semibold tracking-tight mb-4">
                  {group.title}
                  <span className="ml-2 text-sm font-normal text-green-600 dark:text-green-400">
                    ✓ Accessible
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.modules.map(m => {
                    const moduleData = modulesToDisplay.find(am => am.key === m.key);
                    if (!moduleData) return null;
                    
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
                        lastUsed={moduleData.lastUsed}
                        usageCount={moduleData.usageCount}
                        isFavorite={moduleData.isFavorite}
                        onToggleFavorite={handleToggleFavorite}
                        onModuleOpen={trackModuleUsage}
                      />
                    );
                  })}
                </div>
              </section>
            ))}

            {/* Inaccessible Modules After */}
            {inaccessibleGroups.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-semibold tracking-tight mb-4 text-muted-foreground">
                  Restricted Access
                  <span className="ml-2 text-sm font-normal text-red-600 dark:text-red-400">
                    🔒 Requires Permission
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {inaccessibleGroups.flatMap(group => 
                    group.modules.map(m => (
                      <DisabledModuleCard key={m.key} title={m.title} desc={m.desc} />
                    ))
                  )}
                </div>
              </section>
            )}
          </>
        );
      })()}
    </main>
  );
}
