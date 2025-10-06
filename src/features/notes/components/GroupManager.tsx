import React, { useState } from 'react';
import { Users, Share2, Copy, Check, Plus, Settings, Trash2 } from 'lucide-react';
import { useGroups } from '@/hooks/groups';
import { GroupResponse, GroupRole } from '@/domains/group';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/styles/utils';

interface GroupManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreateGroupFormData {
  name: string;
  description: string;
  expirationDays: number;
}

export const GroupManager: React.FC<GroupManagerProps> = ({ isOpen, onClose }) => {
  const {
    groups,
    isLoading,
    isCreating,
    createGroup,
    leaveGroup,
    deleteGroup,
    regenerateShareLink
  } = useGroups();

  const [activeTab, setActiveTab] = useState<'groups' | 'create'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<GroupResponse | null>(null);
  const [copiedShareLinks, setCopiedShareLinks] = useState<Set<number>>(new Set());
  const [createForm, setCreateForm] = useState<CreateGroupFormData>({
    name: '',
    description: '',
    expirationDays: 30
  });

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    const newGroup = await createGroup({
      name: createForm.name.trim(),
      description: createForm.description.trim() || undefined,
      expirationDays: createForm.expirationDays
    });

    if (newGroup) {
      setCreateForm({ name: '', description: '', expirationDays: 30 });
      setActiveTab('groups');
      setSelectedGroup(newGroup);
    }
  };

  const handleCopyShareLink = async (group: GroupResponse) => {
    try {
      await navigator.clipboard.writeText(group.shareUrl);
      setCopiedShareLinks(prev => new Set([...prev, group.id]));
      toast({
        title: "Share Link Copied",
        description: "The share link has been copied to your clipboard.",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedShareLinks(prev => {
          const newSet = new Set(prev);
          newSet.delete(group.id);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy share link:', error);
      toast({
        title: "Error",
        description: "Failed to copy share link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateShareLink = async (group: GroupResponse) => {
    const result = await regenerateShareLink(group.id);
    if (result) {
      toast({
        title: "Share Link Regenerated",
        description: "A new share link has been generated for this group.",
      });
    }
  };

  const handleLeaveGroup = async (group: GroupResponse) => {
    const confirmed = window.confirm(
      `Are you sure you want to leave "${group.name}"? You will lose access to all group notes.`
    );
    
    if (confirmed) {
      const success = await leaveGroup(group.id);
      if (success && selectedGroup?.id === group.id) {
        setSelectedGroup(null);
      }
    }
  };

  const handleDeleteGroup = async (group: GroupResponse) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${group.name}"? This will permanently delete the group and all its notes. This action cannot be undone.`
    );
    
    if (confirmed) {
      const success = await deleteGroup(group.id);
      if (success && selectedGroup?.id === group.id) {
        setSelectedGroup(null);
      }
    }
  };

  const getRoleDisplayName = (role: GroupRole): string => {
    switch (role) {
      case GroupRole.Owner: return 'Owner';
      case GroupRole.Admin: return 'Admin';
      case GroupRole.Member: return 'Member';
      case GroupRole.ReadOnly: return 'Read Only';
      default: return 'Unknown';
    }
  };

  const getRoleColor = (role: GroupRole): string => {
    switch (role) {
      case GroupRole.Owner: return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900';
      case GroupRole.Admin: return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case GroupRole.Member: return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case GroupRole.ReadOnly: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Group Collaboration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('groups')}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === 'groups'
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                My Groups
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === 'create'
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                Create Group
              </button>
            </div>

            {/* Groups List */}
            {activeTab === 'groups' && (
              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No groups yet</p>
                    <p className="text-sm">Create your first group to start collaborating!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groups.map(group => (
                      <div
                        key={group.id}
                        onClick={() => setSelectedGroup(group)}
                        className={cn(
                          "p-3 rounded-lg cursor-pointer transition-colors",
                          selectedGroup?.id === group.id
                            ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                            : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {group.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            getRoleColor(group.userRole)
                          )}>
                            {getRoleDisplayName(group.userRole)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Create Group Form */}
            {activeTab === 'create' && (
              <div className="flex-1 overflow-y-auto p-4">
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter group name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expiration Days
                    </label>
                    <select
                      value={createForm.expirationDays}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, expirationDays: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value={7}>7 days</option>
                      <option value={30}>30 days</option>
                      <option value={90}>90 days</option>
                      <option value={365}>1 year</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreating || !createForm.name.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create Group
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {selectedGroup ? (
              <>
                {/* Group Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedGroup.name}
                      </h3>
                      {selectedGroup.description && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {selectedGroup.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{selectedGroup.members.length} member{selectedGroup.members.length !== 1 ? 's' : ''}</span>
                        <span>Created {new Date(selectedGroup.createdAt).toLocaleDateString()}</span>
                        <span>Expires {new Date(selectedGroup.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-3 py-1 text-sm font-medium rounded-full",
                        getRoleColor(selectedGroup.userRole)
                      )}>
                        {getRoleDisplayName(selectedGroup.userRole)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Share Link Section */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Share Link
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <code className="text-sm text-gray-800 dark:text-gray-200 break-all">
                        {selectedGroup.shareUrl}
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopyShareLink(selectedGroup)}
                      className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      title="Copy share link"
                    >
                      {copiedShareLinks.has(selectedGroup.id) ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    {(selectedGroup.userRole === GroupRole.Owner || selectedGroup.userRole === GroupRole.Admin) && (
                      <button
                        onClick={() => handleRegenerateShareLink(selectedGroup)}
                        className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        title="Regenerate share link"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Share this link with others to invite them to join the group.
                  </p>
                </div>

                {/* Members Section */}
                <div className="flex-1 overflow-y-auto p-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Members
                  </h4>
                  <div className="space-y-3">
                    {selectedGroup.members.map(member => (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {member.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {member.displayName || member.username}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            getRoleColor(member.role)
                          )}>
                            {getRoleDisplayName(member.role)}
                          </span>
                          {member.isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedGroup.isExpired && (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          This group has expired
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedGroup.userRole === GroupRole.Owner ? (
                        <button
                          onClick={() => handleDeleteGroup(selectedGroup)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Group
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLeaveGroup(selectedGroup)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Leave Group
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a group to view details</p>
                  <p className="text-sm">Choose a group from the sidebar to see members and share options</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
