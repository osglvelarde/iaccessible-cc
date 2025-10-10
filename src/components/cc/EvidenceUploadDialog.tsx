'use client';

import React, { useState, useCallback } from 'react';
import { Upload, X, FileImage, FileVideo, FileAudio, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface EvidenceUploadDialogProps {
  wcagId: string;
  criterionTitle: string;
  testId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (files: { file: File; type: string }[]) => void;
}

type EvidenceType = 'Photo' | 'Video' | 'Audio' | 'Code Snippet';

interface UploadFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  progress?: number;
}

const EVIDENCE_TYPES: EvidenceType[] = ['Photo', 'Video', 'Audio', 'Code Snippet'];

const ACCEPT_MAP: Record<EvidenceType, Record<string, string[]>> = {
  Photo: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
  Video: { 'video/*': ['.mp4', '.mov', '.webm', '.avi'] },
  Audio: { 'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'] },
  'Code Snippet': {
    'text/plain': ['.txt', '.md'],
    'application/json': ['.json'],
    'text/javascript': ['.js'],
    'text/typescript': ['.ts', '.tsx'],
    'text/css': ['.css'],
    'text/html': ['.html']
  }
};

export default function EvidenceUploadDialog({
  wcagId,
  criterionTitle,
  testId,
  isOpen,
  onClose,
  onUploadComplete
}: EvidenceUploadDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('Photo');
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDropHandler = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const acceptedExtensions = Object.values(ACCEPT_MAP[evidenceType]).flat();
    
    const validFiles = droppedFiles.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return acceptedExtensions.includes(extension);
    });
    
    onDrop(validFiles);
  }, [evidenceType, onDrop]);

  const uploadFiles = async () => {
    const updatedFiles = [...files];
    
    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status !== 'pending') continue;
      
      updatedFiles[i].status = 'uploading';
      updatedFiles[i].progress = 0;
      setFiles([...updatedFiles]);
      
      try {
        const formData = new FormData();
        formData.append('file', updatedFiles[i].file);
        formData.append('testId', testId);
        formData.append('wcagId', wcagId);
        formData.append('evidenceType', evidenceType);
        
        // Simulate progress
        const progressInterval = setInterval(() => {
          updatedFiles[i].progress = Math.min((updatedFiles[i].progress || 0) + 10, 90);
          setFiles([...updatedFiles]);
        }, 100);
        
        const response = await fetch('/api/manual-testing/evidence', {
          method: 'POST',
          body: formData,
        });
        
        clearInterval(progressInterval);
        
        if (response.ok) {
          updatedFiles[i].status = 'success';
          updatedFiles[i].progress = 100;
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        updatedFiles[i].status = 'error';
        updatedFiles[i].errorMessage = 'Upload failed';
        updatedFiles[i].progress = 0;
      }
      
      setFiles([...updatedFiles]);
    }
    
    const successfulFiles = updatedFiles
      .filter(f => f.status === 'success')
      .map(f => ({ file: f.file, type: evidenceType }));
    
    if (successfulFiles.length > 0) {
      onUploadComplete(successfulFiles);
    }
    
    // Close dialog after a short delay to show success state
    setTimeout(() => {
      onClose();
      setFiles([]);
    }, 1000);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: EvidenceType) => {
    switch (type) {
      case 'Photo':
        return FileImage;
      case 'Video':
        return FileVideo;
      case 'Audio':
        return FileAudio;
      case 'Code Snippet':
        return FileText;
      default:
        return FileText;
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Evidence for {wcagId}</DialogTitle>
          <p className="mb-4 text-sm text-muted-foreground">{criterionTitle}</p>
        </DialogHeader>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Evidence Type</label>
          <Select value={evidenceType} onValueChange={(v) => setEvidenceType(v as EvidenceType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select evidence type" />
            </SelectTrigger>
            <SelectContent>
              {EVIDENCE_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    {React.createElement(getFileIcon(type), { className: "h-4 w-4" })}
                    {type}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDropHandler}
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
            dragActive ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'
          }`}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = Object.keys(ACCEPT_MAP[evidenceType]).join(',');
            input.onchange = (e) => {
              const files = Array.from((e.target as HTMLInputElement).files || []);
              onDrop(files);
            };
            input.click();
          }}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            {dragActive ? 'Drop files here...' : 'Click to select files or drag and drop'}
          </p>
          <p className="text-xs text-muted-foreground">
            {evidenceType === 'Photo' && 'Images: JPG, PNG, GIF, WebP'}
            {evidenceType === 'Video' && 'Videos: MP4, MOV, WebM, AVI'}
            {evidenceType === 'Audio' && 'Audio: MP3, WAV, M4A, OGG'}
            {evidenceType === 'Code Snippet' && 'Text files: TXT, MD, JS, TS, CSS, HTML, JSON'}
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">Files to Upload</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {files.map((uploadFile, index) => (
                <Card key={index} className="p-3">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {React.createElement(getFileIcon(evidenceType), { className: "h-4 w-4 text-muted-foreground flex-shrink-0" })}
                        <span className="text-sm truncate">{uploadFile.file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(uploadFile.file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(uploadFile.status)}
                        {uploadFile.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {uploadFile.status === 'uploading' && uploadFile.progress !== undefined && (
                      <div className="mt-2">
                        <Progress value={uploadFile.progress} className="h-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploading... {uploadFile.progress}%
                        </p>
                      </div>
                    )}
                    
                    {uploadFile.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1">
                        {uploadFile.errorMessage}
                      </p>
                    )}
                    
                    {uploadFile.status === 'success' && (
                      <p className="text-xs text-green-600 mt-1">
                        Upload successful!
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            disabled={files.length === 0 || files.some(f => f.status === 'uploading')} 
            onClick={uploadFiles}
          >
            Upload {files.length > 0 && `(${files.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
