import React from 'react';

interface SidebarControlsProps {
  onClose: () => void;
  onPin: (pinned: boolean) => void;
  isPinned: boolean;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({ onClose, onPin, isPinned }) => {
  return (
    <div className="sidebar-header">
      <div className="sidebar-title">Documentation</div>
      <div className="sidebar-controls">
        <button
          className="sidebar-control-btn sidebar-pin-btn"
          onClick={() => onPin(!isPinned)}
          data-pinned={isPinned}
          title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1" />
            <path d="M12 1v6M12 17v6M1 12h6M17 12h6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
          </svg>
        </button>
        <button
          className="sidebar-control-btn"
          onClick={onClose}
          title="Close sidebar"
          aria-label="Close sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SidebarControls;
