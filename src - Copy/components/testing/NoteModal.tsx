import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface NoteModalProps {
  wcagId: string;
  criterionTitle: string;
  isOpen: boolean;
  initialNote?: string;
  onClose: () => void;
  onSave: (note: string) => void;
}

export const NoteModal = ({
  wcagId,
  criterionTitle,
  isOpen,
  initialNote = '',
  onClose,
  onSave,
}: NoteModalProps) => {
  const [note, setNote] = useState(initialNote);

  const handleSave = () => {
    onSave(note);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Note for {wcagId}</DialogTitle>
          <p className="mb-4 text-sm text-muted-foreground">{criterionTitle}</p>
        </DialogHeader>
        <Textarea
          className="w-full min-h-[100px] mb-4"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Enter your note here..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={note.trim().length === 0} onClick={handleSave}>Save Note</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
