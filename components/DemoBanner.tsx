import React from 'react';

export const DemoBanner: React.FC = () => {
  return (
    <div className="bg-amber-100 text-amber-800 text-xs font-medium text-center py-1 border-b border-amber-200 sticky top-0 z-50">
      DEMO MODE: Data is stored locally and will not persist across devices.
    </div>
  );
};