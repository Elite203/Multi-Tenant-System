import React, { useState, useEffect } from 'react';
import { syncService } from '../../services/syncService';

interface GlobalSyncStatusProps {
  showButton?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const GlobalSyncStatus: React.FC<GlobalSyncStatusProps> = ({ 
  showButton = true, 
  className = '',
  style = {} 
}) => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = syncService.onStatusChange(() => {
      forceUpdate({});
    });

    return unsubscribe;
  }, []);

  const handleSync = async () => {
    try {
      await syncService.syncAllTenants();
    } catch (error) {
      console.error("Error starting global sync:", error);
    }
  };

  const isInProgress = syncService.isSyncInProgress();

  if (!showButton && !isInProgress) {
    return null;
  }

  return (
    <div className={className} style={style}>
      {showButton && (
        <button
          onClick={handleSync}
          disabled={isInProgress}
          style={{
            backgroundColor: isInProgress ? '#93c5fd' : '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: isInProgress ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
            ...style
          }}
        >
          {isInProgress ? '⏳ Syncing All...' : '🔄 Sync All Schema'}
        </button>
      )}
      
      {isInProgress && !showButton && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          fontSize: '0.875rem',
          ...style
        }}>
          <span>⏳</span>
          <span>Syncing Master DB to all tenants...</span>
        </div>
      )}
    </div>
  );
};

export default GlobalSyncStatus;