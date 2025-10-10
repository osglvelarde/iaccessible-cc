'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface TestNoteDialogProps {
  wcagId: string;
  criterionTitle: string;
  isOpen: boolean;
  initialNote?: string;
  onClose: () => void;
  onSave: (note: string) => void;
}

export default function TestNoteDialog({
  wcagId,
  criterionTitle,
  isOpen,
  initialNote = '',
  onClose,
  onSave,
}: TestNoteDialogProps) {
  const [note, setNote] = useState(initialNote);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(note);
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setNote(initialNote); // Reset to initial value
    onClose();
  };

  const characterCount = note.length;
  const maxCharacters = 2000;
  const isOverLimit = characterCount > maxCharacters;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Note for {wcagId}</DialogTitle>
          <p className="mb-4 text-sm text-muted-foreground">{criterionTitle}</p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-textarea" className="text-sm font-medium">
              Testing Notes
            </Label>
            <Textarea
              id="note-textarea"
              className="w-full min-h-[120px] resize-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter your testing notes here... Include details about what you tested, any issues found, or observations about the accessibility of this criterion."
              maxLength={maxCharacters}
            />
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  Character count: {characterCount}/{maxCharacters}
                </span>
                {isOverLimit && (
                  <Badge variant="destructive" className="text-xs">
                    Over limit
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground">
                {characterCount > maxCharacters * 0.9 && (
                  <span className="text-amber-600">
                    Approaching limit
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-md">
            <h4 className="text-sm font-medium mb-2">Note Guidelines</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Describe what you tested and how</li>
              <li>• Include specific examples of issues found</li>
              <li>• Note any assistive technology used</li>
              <li>• Mention browser/device used for testing</li>
              <li>• Be specific about locations of issues</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={note.trim().length === 0 || isOverLimit || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Note'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
