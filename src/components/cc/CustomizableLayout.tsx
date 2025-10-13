"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Settings, 
  Grid3X3, 
  Layout, 
  Eye, 
  EyeOff,
  Move,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  X,
  Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Local storage keys
const LAYOUT_STORAGE_KEY = "cc.dashboard.layout";
const LAYOUT_STATE_KEY = "cc.dashboard.state";

interface Widget {
  id: string;
  title: string;
  component: React.ReactNode;
  enabled: boolean;
  order: number;
  size: "small" | "medium" | "large";
}

interface LayoutState {
  isCollapsed: boolean;
  isDismissed: boolean;
  isEditMode: boolean;
}

// Helper functions for localStorage
const saveLayoutState = (state: LayoutState) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(LAYOUT_STATE_KEY, JSON.stringify(state));
  }
};

const loadLayoutState = (): LayoutState => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(LAYOUT_STATE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn("Failed to load layout state:", error);
    }
  }
  return {
    isCollapsed: false,
    isDismissed: false,
    isEditMode: false
  };
};

const saveWidgetLayout = (widgets: Widget[]) => {
  if (typeof window !== "undefined") {
    // Save only the layout data, not the React components
    const layoutData = widgets.map(w => ({
      id: w.id,
      enabled: w.enabled,
      order: w.order,
      size: w.size
    }));
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutData));
  }
};

const loadWidgetLayout = (defaultWidgets: Widget[]): Widget[] => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) {
        const layoutData = JSON.parse(saved);
        // Merge saved layout with default widgets
        return defaultWidgets.map(widget => {
          const savedWidget = layoutData.find((w: { id: string; enabled: boolean; position: { x: number; y: number } }) => w.id === widget.id);
          return savedWidget ? {
            ...widget,
            enabled: savedWidget.enabled,
            order: savedWidget.order,
            size: savedWidget.size
          } : widget;
        }).sort((a, b) => a.order - b.order);
      }
    } catch (error) {
      console.warn("Failed to load widget layout:", error);
    }
  }
  return defaultWidgets;
};

interface CustomizableLayoutProps {
  widgets: Widget[];
  onLayoutChange?: (widgets: Widget[]) => void;
  className?: string;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
}

export default function CustomizableLayout({ 
  widgets, 
  onLayoutChange,
  className,
  isCollapsible = true,
  defaultCollapsed = false
}: CustomizableLayoutProps) {
  // Load initial state from localStorage (client-side only)
  const [layoutState, setLayoutState] = useState<LayoutState>(() => {
    if (typeof window === "undefined") {
      return {
        isCollapsed: defaultCollapsed,
        isDismissed: false,
        isEditMode: false
      };
    }
    const savedState = loadLayoutState();
    return {
      isCollapsed: defaultCollapsed || savedState.isCollapsed,
      isDismissed: savedState.isDismissed,
      isEditMode: false // Always start in non-edit mode
    };
  });
  
  const [localWidgets, setLocalWidgets] = useState<Widget[]>(() => {
    if (typeof window === "undefined") {
      return widgets;
    }
    return loadWidgetLayout(widgets);
  });

  // Update local widgets when props change
  useEffect(() => {
    setLocalWidgets(loadWidgetLayout(widgets));
  }, [widgets]);

  // Save state whenever it changes
  useEffect(() => {
    saveLayoutState(layoutState);
  }, [layoutState]);

  // Save widget layout whenever it changes
  useEffect(() => {
    saveWidgetLayout(localWidgets);
    onLayoutChange?.(localWidgets);
  }, [localWidgets, onLayoutChange]);

  const { isCollapsed, isDismissed, isEditMode } = layoutState;

  const toggleWidget = (widgetId: string) => {
    const updatedWidgets = localWidgets.map(widget =>
      widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget
    );
    setLocalWidgets(updatedWidgets);
  };

  const moveWidget = (widgetId: string, direction: "up" | "down") => {
    const currentIndex = localWidgets.findIndex(w => w.id === widgetId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= localWidgets.length) return;

    const updatedWidgets = [...localWidgets];
    [updatedWidgets[currentIndex], updatedWidgets[newIndex]] = 
    [updatedWidgets[newIndex], updatedWidgets[currentIndex]];
    
    // Update order values
    updatedWidgets.forEach((widget, index) => {
      widget.order = index;
    });
    
    setLocalWidgets(updatedWidgets);
  };

  const resetLayout = () => {
    setLocalWidgets(widgets);
    // Clear all saved preferences
    if (typeof window !== "undefined") {
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
      localStorage.removeItem(LAYOUT_STATE_KEY);
    }
    // Reset state to defaults
    setLayoutState({
      isCollapsed: false,
      isDismissed: false,
      isEditMode: false
    });
  };

  const toggleCollapsed = () => {
    setLayoutState(prev => ({ ...prev, isCollapsed: !prev.isCollapsed }));
  };

  const toggleDismissed = () => {
    setLayoutState(prev => ({ ...prev, isDismissed: !prev.isDismissed }));
  };

  const toggleEditMode = () => {
    setLayoutState(prev => ({ ...prev, isEditMode: !prev.isEditMode }));
  };

  const getGridCols = (size: string) => {
    switch (size) {
      case "small": return "md:col-span-1";
      case "medium": return "md:col-span-2";
      case "large": return "md:col-span-3";
      default: return "md:col-span-2";
    }
  };

  const enabledWidgets = localWidgets.filter(w => w.enabled);

  // Don't render anything if dismissed
  if (isDismissed) {
    return (
      <div className={cn("mb-4", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDismissed}
          className="text-muted-foreground hover:text-foreground"
        >
          <Layout className="h-4 w-4 mr-2" />
          Show Dashboard Layout
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Layout Controls */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Dashboard Layout
            </CardTitle>
            <div className="flex gap-2">
              {isCollapsible && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleCollapsed}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isCollapsed ? "Expand layout" : "Collapse layout"}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleDismissed}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Hide dashboard layout</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isEditMode ? "default" : "outline"}
                    size="sm"
                    onClick={toggleEditMode}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {isEditMode ? "Done" : "Customize"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isEditMode ? "Finish customizing layout" : "Customize your dashboard layout"}</p>
                </TooltipContent>
              </Tooltip>

              {isEditMode && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetLayout}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset to default layout</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <>
          {/* Widget Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enabledWidgets.map((widget, index) => (
              <div
                key={widget.id}
                className={cn(
                  "relative group",
                  getGridCols(widget.size),
                  "animate-in fade-in-0 slide-in-from-bottom-2"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Widget Controls (Edit Mode) */}
                {isEditMode && (
                  <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => moveWidget(widget.id, "up")}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Move up</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => moveWidget(widget.id, "down")}
                          disabled={index === enabledWidgets.length - 1}
                        >
                          ↓
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Move down</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleWidget(widget.id)}
                        >
                          <EyeOff className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Hide widget</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}

                {/* Widget Content */}
                <div className={cn(
                  "h-full",
                  isEditMode && "ring-2 ring-dashed ring-muted-foreground/25 rounded-lg p-1"
                )}>
                  {widget.component}
                </div>
              </div>
            ))}
          </div>

          {/* Widget Management (Edit Mode) */}
          {isEditMode && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Widget Management</CardTitle>
              </CardHeader>
              <div className="p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {localWidgets.map(widget => (
                    <div
                      key={widget.id}
                      className={cn(
                        "flex items-center justify-between p-3 border rounded-lg",
                        widget.enabled 
                          ? "bg-primary/5 border-primary/20" 
                          : "bg-muted/50 border-muted"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div>
                          <div className="font-medium text-sm">{widget.title}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {widget.size} widget
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleWidget(widget.id)}
                      >
                        {widget.enabled ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
