'use client';

import React, { useState } from 'react';
import { ExternalLink, Copy, CheckCircle, Upload, FileText, AlertCircle, Lightbulb, Zap, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ExternalLaunchPanelProps {
  url: string;
  onEvidenceUpload?: (evidence: { file: File; description: string }) => void;
  onNoteUpdate?: (note: string) => void;
  currentNote?: string;
}

const ACCESSIBILITY_TOOLS = [
  {
    name: 'ANDI',
    description: 'Accessible Name & Description Inspector',
    url: 'https://www.ssa.gov/accessibility/andi/help/install.html',
    icon: Search,
    color: 'bg-blue-500'
  },
  {
    name: 'axe DevTools',
    description: 'Browser extension for automated testing',
    url: 'https://www.deque.com/axe/devtools/',
    icon: Zap,
    color: 'bg-green-500'
  },
  {
    name: 'Lighthouse',
    description: 'Chrome DevTools accessibility audit',
    url: 'https://developers.google.com/web/tools/lighthouse',
    icon: Eye,
    color: 'bg-yellow-500'
  },
  {
    name: 'WAVE',
    description: 'Web Accessibility Evaluation Tool',
    url: 'https://wave.webaim.org/',
    icon: AlertCircle,
    color: 'bg-purple-500'
  }
];

export default function ExternalLaunchPanel({ 
  url, 
  onEvidenceUpload, 
  onNoteUpdate, 
  currentNote = '' 
}: ExternalLaunchPanelProps) {
  const [urlCopied, setUrlCopied] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [note, setNote] = useState(currentNote);
  const [isUploading, setIsUploading] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleOpenPage = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEvidenceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEvidenceFile(file);
    }
  };

  const handleEvidenceUpload = () => {
    if (evidenceFile && evidenceDescription && onEvidenceUpload) {
      onEvidenceUpload({
        file: evidenceFile,
        description: evidenceDescription
      });
      setEvidenceFile(null);
      setEvidenceDescription('');
      setIsUploading(true);
      setTimeout(() => setIsUploading(false), 1000);
    }
  };

  const handleNoteChange = (value: string) => {
    setNote(value);
    if (onNoteUpdate) {
      onNoteUpdate(value);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">External Launch Panel</h3>
            <Badge variant="outline" className="text-xs">
              Accessibility Testing
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Page Actions */}
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Page Under Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={url}
                  readOnly
                  className="flex-1 text-sm font-mono bg-muted"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="shrink-0"
                >
                  {urlCopied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              
              <Button 
                onClick={handleOpenPage}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Page in New Tab
              </Button>
              
              <div className="text-xs text-muted-foreground text-center">
                💡 Open the page in a new tab for full accessibility testing with screen readers and tools
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Tools */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Recommended Testing Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ACCESSIBILITY_TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div key={tool.name} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-md ${tool.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">{tool.description}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(tool.url, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Testing Instructions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                  <p>Open the page in a new tab using the button above</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                  <p>Use screen readers (NVDA, JAWS, VoiceOver) to test navigation</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                  <p>Test keyboard navigation (Tab, Enter, Space, Arrow keys)</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                  <p>Use automated tools (ANDI, axe, WAVE) to identify issues</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                  <p>Test with different zoom levels (200%, 400%)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Upload */}
          {onEvidenceUpload && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Evidence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="evidence-file" className="text-sm">Screenshot or Document</Label>
                  <Input
                    id="evidence-file"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleEvidenceFileChange}
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="evidence-description" className="text-sm">Description</Label>
                  <Textarea
                    id="evidence-description"
                    placeholder="Describe what this evidence shows..."
                    value={evidenceDescription}
                    onChange={(e) => setEvidenceDescription(e.target.value)}
                    className="text-sm min-h-[60px]"
                  />
                </div>
                
                <Button
                  onClick={handleEvidenceUpload}
                  disabled={!evidenceFile || !evidenceDescription || isUploading}
                  className="w-full"
                  size="sm"
                >
                  {isUploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-pulse" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Evidence
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {onNoteUpdate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Testing Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add your testing observations, issues found, or general notes..."
                  value={note}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  className="min-h-[100px] text-sm"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}