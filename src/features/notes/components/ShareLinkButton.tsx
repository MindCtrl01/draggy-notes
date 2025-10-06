import React, { useState } from 'react';
import { Share2, Users } from 'lucide-react';
import { GroupManager } from './GroupManager';

interface ShareLinkButtonProps {
  className?: string;
}

export const ShareLinkButton: React.FC<ShareLinkButtonProps> = ({ className }) => {
  const [showGroupManager, setShowGroupManager] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowGroupManager(true)}
        className={className}
        title="Manage groups and share links"
      >
        <Share2 size={16} />
        <span>Groups</span>
      </button>

      <GroupManager
        isOpen={showGroupManager}
        onClose={() => setShowGroupManager(false)}
      />
    </>
  );
};
