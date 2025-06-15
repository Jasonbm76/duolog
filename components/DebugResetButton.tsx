"use client";

import { RotateCcw } from 'lucide-react';

export default function DebugResetButton() {
  const handleClick = () => {
    console.log('🔴 DEBUG RESET BUTTON CLICKED!');
    console.log('🔴 This button always shows and should always work');
    console.log('🔴 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔴 Window hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server');
    alert('Debug reset button clicked! Check console for details.');
  };

  return (
    <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
      <h3 className="text-sm font-medium text-error mb-2">Debug Reset Button Test</h3>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-error/10 border border-error/25 text-error rounded-lg hover:bg-error/20 transition-all duration-200 text-sm font-medium"
      >
        <RotateCcw className="w-4 h-4" />
        Test Click Handler
      </button>
      <div className="text-xs text-error/70 mt-2">
        <p>NODE_ENV: {process.env.NODE_ENV || 'undefined'}</p>
        <p>Hostname: {typeof window !== 'undefined' ? window.location.hostname : 'server'}</p>
      </div>
    </div>
  );
}