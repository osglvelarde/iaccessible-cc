import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import type { EvidenceType } from '@/types';

const EVIDENCE_TYPES: EvidenceType[] = ['Screenshot', 'Video', 'Audio', 'CodeSnippet'];

interface EvidenceUploadModalProps {
  wcagId: string;
  criterionTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (files: { file: File; type: EvidenceType }[]) => void;
}

interface UploadFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export const EvidenceUploadModal = ({ wcagId, criterionTitle, isOpen, onClose, onUploadComplete }: EvidenceUploadModalProps) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('Screenshot');

  // Map evidence type to accepted MIME types/extensions
  const ACCEPT_MAP: Record<EvidenceType, import('react-dropzone').Accept> = {
    Screenshot: { 'image/*': [] },
    Video: { 'video/*': [] },
    Audio: { 'audio/*': [] },
    CodeSnippet: {
      'text/plain': ['.txt', '.md'],
      'application/json': ['.json'],
      'text/javascript': ['.js'],
      'text/typescript': ['.ts', '.tsx'],
      'text/css': ['.css'],
      'text/html': ['.html']
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT_MAP[evidenceType]
  });

  const uploadFiles = async () => {
    // Simulate upload process; replace with real API call
    const updatedFiles = [...files];
    for (let i = 0; i < updatedFiles.length; i++) {
      updatedFiles[i].status = 'uploading';
      setFiles([...updatedFiles]);
      try {
        // TODO: Replace with actual upload logic, e.g. API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        updatedFiles[i].status = 'success';
      } catch (error) {
        updatedFiles[i].status = 'error';
        updatedFiles[i].errorMessage = 'Upload failed';
      }
      setFiles([...updatedFiles]);
    }
    const successfulFiles = updatedFiles
      .filter(f => f.status === 'success')
      .map(f => ({ file: f.file, type: evidenceType }));
    onUploadComplete(successfulFiles);
    onClose();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Evidence for {wcagId}</DialogTitle>
          <p className="mb-4 text-sm text-muted-foreground">{criterionTitle}</p>
        </DialogHeader>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Evidence Type</label>
          <Select value={evidenceType} onValueChange={v => setEvidenceType(v as EvidenceType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select evidence type" />
            </SelectTrigger>
            <SelectContent>
              {EVIDENCE_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-muted'
          }`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <>
              <p>Drag & drop files here, or click to select files</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {evidenceType === 'Screenshot' && 'Only image files are allowed.'}
                {evidenceType === 'Video' && 'Only video files are allowed.'}
                {evidenceType === 'Audio' && 'Only audio files are allowed.'}
                {evidenceType === 'CodeSnippet' && 'Only text/code files (.txt, .js, .ts, .tsx, .json, .css, .html, .md) are allowed.'}
              </p>
            </>
          )}
        </div>
        <ul className="mt-4 max-h-48 overflow-y-auto space-y-2">
          {files.map((uploadFile, index) => (
            <li key={index} className="flex items-center justify-between border rounded p-2">
              <span className="truncate">{uploadFile.file.name}</span>
              <div className="flex items-center gap-2">
                {uploadFile.status === 'uploading' && <span className="text-blue-500">Uploading...</span>}
                {uploadFile.status === 'success' && <span className="text-green-600">Uploaded</span>}
                {uploadFile.status === 'error' && <span className="text-red-600">{uploadFile.errorMessage}</span>}
                <Button size="sm" variant="ghost" onClick={() => removeFile(index)}>Remove</Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={files.length === 0} onClick={uploadFiles}>Upload</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
