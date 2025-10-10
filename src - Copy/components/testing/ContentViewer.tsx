import { useState, useEffect } from 'react';
import { RefreshCw, Monitor, Tablet, Smartphone, Maximize2, Settings, ExternalLink, Copy, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ScopeType } from '@/types';

interface ContentViewerProps {
  url: string;
  scopeType: ScopeType;
}

const DEVICE_PRESETS = [
  { name: 'Desktop', width: 1200, icon: Monitor },
  { name: 'Tablet', width: 768, icon: Tablet },
  { name: 'Mobile', width: 375, icon: Smartphone },
];

import { useRef } from 'react';

export const ContentViewer = ({ url, scopeType }: ContentViewerProps) => {
  const [currentDevice, setCurrentDevice] = useState(DEVICE_PRESETS[0]);
  const [showFocusOutlines, setShowFocusOutlines] = useState(false);
  const [inputUrl, setInputUrl] = useState(url);
  const [viewerUrl, setViewerUrl] = useState(url);
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [externalMode, setExternalMode] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-update inputUrl and viewerUrl when url prop changes
  useEffect(() => {
    setInputUrl(url);
    setViewerUrl(url);
    setIframeError(false);
    setIsLoading(true);
    setUseProxy(false);
    
    // Set a timeout to detect iframe loading issues
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIframeError(true);
        setIsLoading(false);
      }
    }, 8000); // 8 second timeout
    
    return () => clearTimeout(timeout);
  }, [url]);

  // Inject/remove focus outline CSS in iframe
  useEffect(() => {
    const injectFocusCSS = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        let styleTag = doc.getElementById('focus-outline-style');
        if (showFocusOutlines) {
          if (!styleTag) {
            styleTag = doc.createElement('style');
            styleTag.id = 'focus-outline-style';
            styleTag.innerHTML = `*:focus {
              outline: 5px solid #00ff00 !important;
              outline-offset: 3px !important;
              box-shadow: 0 0 0 4px #fff, 0 0 0 8px #00ff00 !important;
              background-color: #ffffe0 !important;
              z-index: 9999 !important;
            }`;
            doc.head.appendChild(styleTag);
          }
        } else {
          if (styleTag) styleTag.remove();
        }
      } catch (e) {
        // Cross-origin iframe, cannot inject
      }
    };
    // Try to inject after iframe loads
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.onload = injectFocusCSS;
      // Also try immediately in case iframe is already loaded
      injectFocusCSS();
    }
    // Cleanup: remove style on unmount
    return () => {
      const iframe = iframeRef.current;
      if (iframe) {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            const styleTag = doc.getElementById('focus-outline-style');
            if (styleTag) styleTag.remove();
          }
        } catch (e) {}
      }
    };
  }, [showFocusOutlines, viewerUrl]);

  const handleRefresh = () => {
    setIframeError(false);
    setIsLoading(true);
    setUseProxy(false);
    setViewerUrl(inputUrl + '?t=' + Date.now());
  };

  const handleGoClick = () => {
    setIframeError(false);
    setIsLoading(true);
    setUseProxy(false);
    setViewerUrl(inputUrl);
  };

  const handleOpenExternal = () => {
    window.open(viewerUrl, '_blank');
    setExternalMode(true);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(viewerUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleTryProxy = () => {
    setUseProxy(true);
    setIframeError(false);
    setIsLoading(true);
    // Use local proxy server
    const proxyUrl = `http://localhost:3002/proxy?url=${encodeURIComponent(viewerUrl)}`;
    setViewerUrl(proxyUrl);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    // Check if we can access the iframe content (CORS check)
    const iframe = iframeRef.current;
    if (iframe) {
      try {
        // Try to access iframe content - this will throw if CORS blocks it
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) {
          setIframeError(true);
        } else {
          setIframeError(false);
        }
      } catch (e) {
        // CORS error - iframe loaded but we can't access content
        setIframeError(true);
      }
    } else {
      // Iframe reference is null, something went wrong
      setIframeError(true);
    }
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setIframeError(true);
  };

  if (scopeType === 'pdf') {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">PDF Viewer</h4>
              <Badge variant="outline" className="text-xs">
                Preliminary checks only
              </Badge>
            </div>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
              PDF Tools
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Automated checks are preliminary and do not prove full PDF/UA conformance.
            Manual testing is required for complete accessibility assessment.
          </p>
        </div>
        
        <div className="flex-1 p-4">
          <Card className="h-full">
            <CardContent className="p-4 h-full flex items-center justify-center text-muted-foreground">
              PDF viewer would be embedded here
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (scopeType === 'mobile') {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Mobile App Testing</h4>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
              Tools
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Use your device to test the mobile app and record evidence here.
          </p>
        </div>
        
        <div className="flex-1 p-4">
          <Card className="h-full">
            <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center space-y-4">
              <Smartphone className="h-16 w-16 text-muted-foreground" />
              <div>
                <h3 className="font-medium mb-2">Mobile App Testing Mode</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Follow the manual testing steps and upload screen recordings or screenshots as evidence.
                </p>
                <Button>Upload Evidence</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Web content viewer
  return (
    <div className="h-full flex flex-col">
      {/* Viewer Controls */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border">
              {DEVICE_PRESETS.map((device) => {
                const Icon = device.icon;
                return (
                  <Button
                    key={device.name}
                    variant={currentDevice.name === device.name ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentDevice(device)}
                    className="rounded-none first:rounded-l-md last:rounded-r-md"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">{device.name} view</span>
                  </Button>
                );
              })}
            </div>
            
            <Badge variant="outline" className="text-xs">
              {currentDevice.width}px
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showFocusOutlines ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFocusOutlines(!showFocusOutlines)}
            >
              {showFocusOutlines ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Focus Outlines
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Refresh
            </Button>
            
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Fullscreen
            </Button>
          </div>
        </div>

        {/* URL Bar */}
        <div className="flex items-center gap-2">
          <input
            type="url"
            className="flex-1 bg-background border rounded-md px-3 py-2 text-sm font-mono"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            aria-label="URL input"
          />
          <Button variant="outline" size="sm" onClick={handleGoClick}>
            Go
          </Button>
        </div>
      </div>

      {/* Content Frame */}
      <div className="flex-1 p-4 bg-muted/10">
        <div 
          className="mx-auto bg-background border rounded-lg shadow-lg overflow-hidden relative"
          style={{ 
            width: Math.min(currentDevice.width, window.innerWidth - 100),
            height: '100%'
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {useProxy ? 'Loading via proxy...' : 'Loading page...'}
                </p>
              </div>
            </div>
          )}
          
                     {iframeError && !useProxy && (
             <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
               <div className="text-center p-6 max-w-md">
                 <div className="mb-4">
                   <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                   <h3 className="font-medium mb-2">Interactive Testing Options</h3>
                   <p className="text-sm text-muted-foreground mb-4">
                     This page has security restrictions. Choose how you'd like to test it:
                   </p>
                 </div>
                 <div className="space-y-3">
                   <Button 
                     onClick={handleOpenExternal}
                     className="w-full"
                   >
                     <ExternalLink className="h-4 w-4 mr-2" />
                     Open in New Tab (Recommended)
                   </Button>
                   <Button 
                     onClick={handleTryProxy}
                     variant="outline"
                     className="w-full"
                   >
                     Try Basic Proxy (Limited)
                   </Button>
                   <div className="text-xs text-muted-foreground mt-2">
                     💡 New tab gives you full functionality for testing
                   </div>
                 </div>
               </div>
             </div>
           )}
          
          {iframeError && useProxy && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="text-center p-6 max-w-md">
                <div className="mb-4">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-2">Proxy Loading Failed</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The proxy service couldn't load this page. You can still test accessibility by opening the page in a new tab.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button 
                    onClick={handleOpenExternal}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    className="w-full"
                  >
                    Try Direct Loading
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <iframe
            ref={iframeRef}
            src={viewerUrl}
            className="w-full h-full"
            title="Content being tested for accessibility"
            style={{
              filter: showFocusOutlines ? 'contrast(1.1)' : 'none'
            }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      </div>

      {/* External Testing Mode Panel */}
      {externalMode && (
        <div className="border-t bg-blue-50 dark:bg-blue-950/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <strong>External Testing Mode Active</strong>
              <p className="text-sm text-muted-foreground mt-1">
                The page is open in a new tab. Use the checklist on the left while testing in the external tab.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="text-xs"
              >
                {urlCopied ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy URL
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExternal}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Reopen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Tools Panel */}
      <div className="border-t bg-card/50 p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Accessibility Tools</h4>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Headings Outline
            </Button>
            <Button size="sm" variant="outline">
              Landmarks
            </Button>
            <Button size="sm" variant="outline">
              Tab Order
            </Button>
            <Button size="sm" variant="outline">
              Color Contrast
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
