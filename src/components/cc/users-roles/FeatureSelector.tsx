"use client";
import { useMemo, memo, useState, useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

// Available features with descriptions
const AVAILABLE_FEATURES = [
  {
    key: 'web_scan',
    name: 'Web Page Scanning',
    description: 'Automated scanning of web pages for accessibility issues. Enables users to scan individual web pages and identify WCAG compliance problems.',
    category: 'Scanning'
  },
  {
    key: 'pdf_scan',
    name: 'PDF Scanning',
    description: 'Automated scanning of PDF documents for accessibility issues. Helps identify and report accessibility problems in PDF files.',
    category: 'Scanning'
  },
  {
    key: 'manual_testing',
    name: 'Manual Testing',
    description: 'Tools for conducting manual accessibility testing. Includes checklists, test session management, and result tracking.',
    category: 'Testing'
  },
  {
    key: 'remediation',
    name: 'Remediation Tools',
    description: 'Tools and workflows for fixing accessibility issues. Includes PDF remediation, issue tracking, and remediation progress monitoring.',
    category: 'Remediation'
  },
  {
    key: 'uptime_monitoring',
    name: 'Uptime Monitoring',
    description: 'Monitor website availability and uptime. Track service status and receive alerts when services are down.',
    category: 'Monitoring'
  },
  {
    key: 'sitemap_scan',
    name: 'Sitemap Scanning',
    description: 'Bulk scanning of entire websites using sitemaps. Automatically discovers and scans all pages in a sitemap.',
    category: 'Scanning'
  },
  {
    key: 'scheduled_scans',
    name: 'Scheduled Scans',
    description: 'Schedule recurring accessibility scans. Automatically run scans on a schedule to monitor ongoing compliance.',
    category: 'Automation'
  },
  {
    key: 'data_export',
    name: 'Data Export',
    description: 'Export scan results, reports, and data in various formats (CSV, JSON, PDF). Useful for reporting and analysis.',
    category: 'Reporting'
  },
  {
    key: 'api_access',
    name: 'API Access',
    description: 'Programmatic access to scanning and data via API. Enables integration with other systems and automated workflows.',
    category: 'Integration'
  },
  {
    key: 'custom_branding',
    name: 'Custom Branding',
    description: 'Customize the interface with organization branding. Add logos, colors, and custom styling.',
    category: 'Customization'
  }
];

interface FeatureSelectorProps {
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
}

function FeatureSelector({ selectedFeatures, onFeaturesChange }: FeatureSelectorProps) {
  // Use local state to prevent infinite loops
  const [localFeatures, setLocalFeatures] = useState<string[]>(() => [...selectedFeatures].sort());
  
  // Sync local state with props only when they actually change (using a ref to track previous value)
  const prevPropsRef = useRef<string>('');
  useEffect(() => {
    const propsStr = [...selectedFeatures].sort().join(',');
    if (prevPropsRef.current !== propsStr) {
      prevPropsRef.current = propsStr;
      setLocalFeatures([...selectedFeatures].sort());
    }
  }, [selectedFeatures]);

  // Show all features (no filtering)
  const filteredFeatures = AVAILABLE_FEATURES;

  const toggleFeature = (featureKey: string) => {
    const newFeatures = localFeatures.includes(featureKey)
      ? localFeatures.filter(f => f !== featureKey)
      : [...localFeatures, featureKey];
    
    setLocalFeatures(newFeatures);
    onFeaturesChange(newFeatures);
  };

  const removeFeature = (featureKey: string) => {
    const newFeatures = localFeatures.filter(f => f !== featureKey);
    setLocalFeatures(newFeatures);
    onFeaturesChange(newFeatures);
  };

  // Group features by category - memoize to prevent unnecessary recalculations
  const featuresByCategory = useMemo(() => {
    return filteredFeatures.reduce((acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    }, {} as Record<string, typeof AVAILABLE_FEATURES>);
  }, []);

  return (
    <div className="space-y-3">
      {/* Selected Features Display */}
      {localFeatures.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Selected ({localFeatures.length})</Label>
          <div className="flex flex-wrap gap-1.5">
            {localFeatures.map(featureKey => {
              const feature = AVAILABLE_FEATURES.find(f => f.key === featureKey);
              return (
                <Badge
                  key={featureKey}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-xs"
                >
                  <span>{feature?.name || featureKey}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(featureKey)}
                    className="ml-0.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Features List */}
      <Card>
        <CardContent className="p-3">
          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
            {Object.entries(featuresByCategory).map(([category, features]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground border-b pb-1 sticky top-0 bg-background z-10">
                  {category}
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {features.map(feature => {
                    const isSelected = localFeatures.includes(feature.key);
                    return (
                      <div
                        key={feature.key}
                        className={`flex items-start gap-2 p-2 rounded-md border transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                        onClick={() => toggleFeature(feature.key)}
                      >
                        <Checkbox
                          id={`feature-${feature.key}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleFeature(feature.key)}
                          className="mt-0.5 shrink-0"
                        />
                        <div className="flex-1 space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Label
                              htmlFor={`feature-${feature.key}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {feature.name}
                            </Label>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {feature.key}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {filteredFeatures.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <p>No features found matching your search.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(FeatureSelector);

