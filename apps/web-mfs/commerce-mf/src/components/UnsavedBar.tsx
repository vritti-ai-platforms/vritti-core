import { Button } from '@vritti/quantum-ui/Button';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';

interface UnsavedBarProps {
  message?: string;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  saveLabel?: string;
  saveDisabled?: boolean;
}

// Sticky bar shown above an editor when local edits diverge from server state
export const UnsavedBar: React.FC<UnsavedBarProps> = ({
  message = 'Unsaved changes',
  onCancel,
  onSave,
  isSaving,
  saveLabel = 'Save',
  saveDisabled = false,
}) => (
  <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
    <Typography variant="body2" intent="muted">
      {message}
    </Typography>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
        Cancel
      </Button>
      <Button size="sm" onClick={onSave} disabled={isSaving || saveDisabled} isLoading={isSaving}>
        {saveLabel}
      </Button>
    </div>
  </div>
);
