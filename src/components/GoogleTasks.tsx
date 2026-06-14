// GoogleTasks integration is currently disabled due to the removal of Google Authentication.
import React from 'react';
import { NothingButton } from './NothingButton';
import { X } from 'lucide-react';

export const GoogleTasks: React.FC<{onToggle?: () => void}> = ({onToggle}) => {
  return (
    <div className="flex flex-col h-full bg-ntg-black overflow-hidden border-l border-ntg-gray/30 w-full shrink-0">
      <div className="p-6 border-b border-ntg-gray/30 flex justify-between items-center bg-ntg-black relative z-10 shrink-0">
        <h2 className="text-2xl font-ndot tracking-widest uppercase">Tasks.</h2>
        {onToggle && (
          <NothingButton variant="icon" onClick={onToggle} title="Close tasks">
            <X size={20} />
          </NothingButton>
        )}
      </div>

      <div className="flex flex-col items-center justify-center p-8 flex-1">
        <p className="font-serif text-ntg-gray text-center mb-6 uppercase tracking-widest text-sm">
          Google Tasks Integration is currently unavailable in local-only mode.
        </p>
      </div>
    </div>
  );
};
