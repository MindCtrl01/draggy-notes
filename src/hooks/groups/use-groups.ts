import { useState, useEffect, useCallback } from 'react';
import { groupsApi } from '@/services/api/groups-api';
import { 
  GroupResponse, 
  CreateGroupRequest, 
  JoinGroupRequest, 
  UpdateGroupRequest,
  UpdateMemberRoleRequest,
  GroupRole 
} from '@/domains/group';
import { toast } from '@/hooks/use-toast';

export const useGroups = () => {
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Load groups on initialization
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await groupsApi.getUserGroups();
      setGroups(response.groups);
    } catch (error) {
      console.error('Failed to load groups:', error);
      toast({
        title: "Error",
        description: "Failed to load groups. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGroup = useCallback(async (request: CreateGroupRequest): Promise<GroupResponse | null> => {
    setIsCreating(true);
    try {
      const newGroup = await groupsApi.createGroup(request);
      setGroups(prev => [...prev, newGroup]);
      toast({
        title: "Group Created",
        description: `Group "${newGroup.name}" has been created successfully.`,
      });
      return newGroup;
    } catch (error) {
      console.error('Failed to create group:', error);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const joinGroup = useCallback(async (request: JoinGroupRequest): Promise<GroupResponse | null> => {
    setIsJoining(true);
    try {
      const joinedGroup = await groupsApi.joinGroup(request);
      setGroups(prev => [...prev, joinedGroup]);
      toast({
        title: "Joined Group",
        description: `You have successfully joined "${joinedGroup.name}".`,
      });
      return joinedGroup;
    } catch (error) {
      console.error('Failed to join group:', error);
      let errorMessage = "Failed to join group. Please try again.";
      
      if (error instanceof Error) {
        switch (error.message) {
          case 'Invalid share link':
            errorMessage = "The share link is invalid or has been revoked.";
            break;
          case 'Share link has expired':
            errorMessage = "This share link has expired. Please request a new one.";
            break;
          case 'You are already a member of this group':
            errorMessage = "You are already a member of this group.";
            break;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsJoining(false);
    }
  }, []);

  const updateGroup = useCallback(async (id: number, request: UpdateGroupRequest): Promise<GroupResponse | null> => {
    setIsUpdating(true);
    try {
      const updatedGroup = await groupsApi.updateGroup(id, request);
      setGroups(prev => prev.map(group => group.id === id ? updatedGroup : group));
      toast({
        title: "Group Updated",
        description: `Group "${updatedGroup.name}" has been updated successfully.`,
      });
      return updatedGroup;
    } catch (error) {
      console.error('Failed to update group:', error);
      toast({
        title: "Error",
        description: "Failed to update group. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const leaveGroup = useCallback(async (id: number): Promise<boolean> => {
    setIsLeaving(true);
    try {
      await groupsApi.leaveGroup(id);
      setGroups(prev => prev.filter(group => group.id !== id));
      toast({
        title: "Left Group",
        description: "You have successfully left the group.",
      });
      return true;
    } catch (error) {
      console.error('Failed to leave group:', error);
      toast({
        title: "Error",
        description: "Failed to leave group. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLeaving(false);
    }
  }, []);

  const deleteGroup = useCallback(async (id: number): Promise<boolean> => {
    try {
      await groupsApi.deleteGroup(id);
      setGroups(prev => prev.filter(group => group.id !== id));
      toast({
        title: "Group Deleted",
        description: "The group has been deleted successfully.",
      });
      return true;
    } catch (error) {
      console.error('Failed to delete group:', error);
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, []);

  const updateMemberRole = useCallback(async (groupId: number, request: UpdateMemberRoleRequest): Promise<boolean> => {
    try {
      await groupsApi.updateMemberRole(groupId, request);
      // Refresh the specific group to get updated member list
      const updatedGroup = await groupsApi.getGroupById(groupId);
      setGroups(prev => prev.map(group => group.id === groupId ? updatedGroup : group));
      toast({
        title: "Role Updated",
        description: "Member role has been updated successfully.",
      });
      return true;
    } catch (error) {
      console.error('Failed to update member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, []);

  const removeMember = useCallback(async (groupId: number, userId: number): Promise<boolean> => {
    try {
      await groupsApi.removeMember(groupId, userId);
      // Refresh the specific group to get updated member list
      const updatedGroup = await groupsApi.getGroupById(groupId);
      setGroups(prev => prev.map(group => group.id === groupId ? updatedGroup : group));
      toast({
        title: "Member Removed",
        description: "Member has been removed from the group.",
      });
      return true;
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, []);

  const regenerateShareLink = useCallback(async (groupId: number): Promise<{ shareToken: string; shareUrl: string } | null> => {
    try {
      const result = await groupsApi.regenerateShareLink(groupId);
      // Update the group with new share link
      const updatedGroup = await groupsApi.getGroupById(groupId);
      setGroups(prev => prev.map(group => group.id === groupId ? updatedGroup : group));
      toast({
        title: "Share Link Regenerated",
        description: "New share link has been generated successfully.",
      });
      return result;
    } catch (error) {
      console.error('Failed to regenerate share link:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate share link. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }, []);

  const getGroupById = useCallback(async (id: number): Promise<GroupResponse | null> => {
    try {
      return await groupsApi.getGroupById(id);
    } catch (error) {
      console.error('Failed to get group:', error);
      return null;
    }
  }, []);

  return {
    groups,
    isLoading,
    isCreating,
    isJoining,
    isUpdating,
    isLeaving,
    loadGroups,
    createGroup,
    joinGroup,
    updateGroup,
    leaveGroup,
    deleteGroup,
    updateMemberRole,
    removeMember,
    regenerateShareLink,
    getGroupById,
  };
};

// Hook for managing a specific group
export const useGroup = (groupId: number) => {
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (groupId) {
      loadGroup();
    }
  }, [groupId]);

  const loadGroup = useCallback(async () => {
    setIsLoading(true);
    try {
      const groupData = await groupsApi.getGroupById(groupId);
      setGroup(groupData);
    } catch (error) {
      console.error('Failed to load group:', error);
      setGroup(null);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  return {
    group,
    isLoading,
    loadGroup,
  };
};
