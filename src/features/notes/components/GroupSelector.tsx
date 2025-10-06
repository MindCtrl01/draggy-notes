import React, { useState } from 'react';
import { Users, User, ChevronDown } from 'lucide-react';
import { useGroups } from '@/hooks/groups';
import { GroupResponse } from '@/domains/group';
import { cn } from '@/styles/utils';

interface GroupSelectorProps {
  selectedGroupId?: number;
  onGroupSelect: (groupId: number | undefined) => void;
  className?: string;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({ 
  selectedGroupId, 
  onGroupSelect, 
  className 
}) => {
  const { groups, isLoading } = useGroups();
  const [isOpen, setIsOpen] = useState(false);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const handleGroupSelect = (groupId: number | undefined) => {
    onGroupSelect(groupId);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100/90 dark:hover:bg-gray-700/90 text-sm font-medium transition-colors"
        disabled={isLoading}
      >
        {selectedGroup ? (
          <>
            <Users className="h-4 w-4" />
            <span className="truncate max-w-32">{selectedGroup.name}</span>
          </>
        ) : (
          <>
            <User className="h-4 w-4" />
            <span>Personal</span>
          </>
        )}
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            <div className="p-2">
              {/* Personal Notes Option */}
              <button
                onClick={() => handleGroupSelect(undefined)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors",
                  !selectedGroupId
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <User className="h-4 w-4" />
                <div>
                  <div className="font-medium">Personal Notes</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Your private notes
                  </div>
                </div>
              </button>

              {/* Group Notes Options */}
              {groups.length > 0 && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1">
                    Group Notes
                  </div>
                  {groups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => handleGroupSelect(group.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors",
                        selectedGroupId === group.id
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      <Users className="h-4 w-4" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{group.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {groups.length === 0 && !isLoading && (
                <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">No groups yet</div>
                  <div className="text-xs">Create a group to start collaborating</div>
                </div>
              )}

              {isLoading && (
                <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto"></div>
                  <div className="text-sm mt-2">Loading groups...</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
