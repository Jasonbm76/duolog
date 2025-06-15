"use client";

import { useState, useEffect } from 'react';

interface DevModeToggleProps {
  isMockMode: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function DevModeToggle({ isMockMode, onToggle }: DevModeToggleProps) {
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    // Only show on localhost
    setIsLocalhost(
      typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    );
  }, []);

  if (!isLocalhost) return null;

  return (
    <div className="flex items-center gap-3 text-xs text-on-dark-muted">
      <span>Dev Mode</span>
      
      <button
        onClick={() => onToggle(!isMockMode)}
        className={`
          relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none
          ${isMockMode ? 'bg-primary' : 'bg-on-dark/20'}
        `}
      >
        <span
          className={`
            inline-block h-3 w-3 transform rounded-full bg-white transition-transform
            ${isMockMode ? 'translate-x-5' : 'translate-x-1'}
          `}
        />
      </button>
      
      <span>Mock Responses</span>
    </div>
  );
}