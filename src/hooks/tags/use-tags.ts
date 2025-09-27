import { useState, useEffect, useCallback } from 'react';
import { Tag } from '@/domains/tag';
import { TagsSyncService } from '@/services/tags-sync-service';
import { useAuth } from '@/hooks/auth/use-auth';

interface UseTagsResult {
  tags: Tag[];
  topTags: Tag[];
  isLoading: boolean;
  error: string | null;
  createTag: (name: string) => Promise<Tag | null>;
  updateTag: (tag: Tag) => Promise<Tag | null>;
  deleteTag: (tag: Tag) => Promise<boolean>;
  searchTags: (query: string) => Tag[];
  getTagSuggestions: (query: string) => Tag[];
  incrementTagUsage: (tagUuid: string) => Promise<void>;
  refreshTags: () => Promise<void>;
  syncTags: () => Promise<void>;
}

/**
 * Hook for managing tags with API synchronization and localStorage fallback
 */
export const useTags = (): UseTagsResult => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [topTags, setTopTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const userId = user?.id || -1;

  // Load tags on mount and when user changes
  useEffect(() => {
    if (userId !== -1) {
      loadTags();
      loadTopTags();
    }
  }, [userId]);

  const loadTags = useCallback(async () => {
    if (userId === -1) return;

    setIsLoading(true);
    setError(null);

    try {
      const allTags = await TagsSyncService.getAllTags(userId);
      setTags(allTags);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tags';
      setError(errorMessage);
      console.error('Failed to load tags:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const loadTopTags = useCallback(async () => {
    if (userId === -1) return;

    try {
      const topTagsList = await TagsSyncService.getTopTags(userId);
      setTopTags(topTagsList);
    } catch (err) {
      console.error('Failed to load top tags:', err);
      // Don't set error for top tags failure, it's not critical
    }
  }, [userId]);

  const createTag = useCallback(async (name: string): Promise<Tag | null> => {
    if (userId === -1) return null;

    setError(null);

    try {
      const newTag = await TagsSyncService.createTag(name, userId);
      
      // Update local state
      setTags(prev => [...prev, newTag]);
      
      // Refresh top tags to include the new tag if it becomes popular
      await loadTopTags();
      
      return newTag;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tag';
      setError(errorMessage);
      console.error('Failed to create tag:', err);
      return null;
    }
  }, [userId, loadTopTags]);

  const updateTag = useCallback(async (tag: Tag): Promise<Tag | null> => {
    if (userId === -1) return null;

    setError(null);

    try {
      const updatedTag = await TagsSyncService.updateTag(tag);
      
      // Update local state
      setTags(prev => prev.map(t => t.uuid === updatedTag.uuid ? updatedTag : t));
      
      return updatedTag;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tag';
      setError(errorMessage);
      console.error('Failed to update tag:', err);
      return null;
    }
  }, [userId]);

  const deleteTag = useCallback(async (tag: Tag): Promise<boolean> => {
    if (userId === -1) return false;

    setError(null);

    try {
      await TagsSyncService.deleteTag(tag);
      
      // Update local state
      setTags(prev => prev.filter(t => t.uuid !== tag.uuid));
      setTopTags(prev => prev.filter(t => t.uuid !== tag.uuid));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tag';
      setError(errorMessage);
      console.error('Failed to delete tag:', err);
      return false;
    }
  }, [userId]);

  const searchTags = useCallback((query: string): Tag[] => {
    if (userId === -1) return [];
    return TagsSyncService.searchTags(query, userId);
  }, [userId]);

  const getTagSuggestions = useCallback((query: string): Tag[] => {
    if (userId === -1) return [];
    return TagsSyncService.getTagSuggestions(query, userId);
  }, [userId]);

  const incrementTagUsage = useCallback(async (tagUuid: string): Promise<void> => {
    if (userId === -1) return;

    try {
      await TagsSyncService.incrementTagUsage(tagUuid, userId);
      
      // Update local state to reflect usage count change
      setTags(prev => prev.map(tag => 
        tag.uuid === tagUuid 
          ? { ...tag, usageCount: tag.usageCount + 1 }
          : tag
      ));
    } catch (err) {
      console.error('Failed to increment tag usage:', err);
      // Don't show error to user for usage count updates
    }
  }, [userId]);

  const refreshTags = useCallback(async (): Promise<void> => {
    await Promise.all([loadTags(), loadTopTags()]);
  }, [loadTags, loadTopTags]);

  const syncTags = useCallback(async (): Promise<void> => {
    if (userId === -1) return;

    try {
      await TagsSyncService.syncTags(userId);
      await refreshTags();
    } catch (err) {
      console.error('Failed to sync tags:', err);
      // Don't show error to user for background sync
    }
  }, [userId, refreshTags]);

  return {
    tags,
    topTags,
    isLoading,
    error,
    createTag,
    updateTag,
    deleteTag,
    searchTags,
    getTagSuggestions,
    incrementTagUsage,
    refreshTags,
    syncTags,
  };
};
