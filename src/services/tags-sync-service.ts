import { Tag } from '@/domains/tag';
import { tagsApi } from './api/tags-api';
import { TagManager } from '@/helpers/tag-manager';
import { SessionManager } from '@/helpers/session-manager';
import { 
  transformTagResponseArrayToTags, 
  transformTopTagResponseArrayToTags,
  transformTagToCreateRequest,
  transformTagToUpdateRequest
} from './api/transformers/tag-transformers';

/**
 * Service that handles synchronization between Tag API and localStorage
 * Provides offline-first approach with API sync for authenticated users
 */
export class TagsSyncService {
  private static isSyncing = false;

  /**
   * Get all tags (predefined + user tags)
   * Tries API first, falls back to localStorage
   */
  static async getAllTags(userId: number): Promise<Tag[]> {
    try {
      // If authenticated, try to fetch from API
      if (SessionManager.isAuthenticated()) {
        const apiTags = await tagsApi.getAllTags();
        const tags = transformTagResponseArrayToTags(apiTags);
        
        // Update localStorage with API data
        this.updateLocalStorageWithApiTags(tags, userId);
        
        return tags;
      }
    } catch (error) {
      console.warn('Failed to fetch tags from API, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    return TagManager.getAllTags(userId);
  }

  /**
   * Get top tags (predefined + most used user tags)
   * Tries API first, falls back to localStorage
   */
  static async getTopTags(userId: number): Promise<Tag[]> {
    try {
      // If authenticated, try to fetch from API
      if (SessionManager.isAuthenticated()) {
        const apiTags = await tagsApi.getTopTags();
        const tags = transformTopTagResponseArrayToTags(apiTags);
        
        return tags;
      }
    } catch (error) {
      console.warn('Failed to fetch top tags from API, falling back to localStorage:', error);
    }

    // Fallback to localStorage suggestions
    return TagManager.getTagSuggestions('', userId);
  }

  /**
   * Create a new tag
   * Creates in API if authenticated, otherwise creates locally
   */
  static async createTag(name: string, userId: number): Promise<Tag> {
    try {
      // If authenticated, create via API
      if (SessionManager.isAuthenticated()) {
        const request = transformTagToCreateRequest({
          id: 0,
          uuid: '',
          name: name.trim(),
          userId,
          usageCount: 1,
          isPreDefined: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const apiTag = await tagsApi.createTag(request);
        const tag = transformTagResponseArrayToTags([apiTag])[0];
        
        // Update localStorage
        TagManager.saveTag(tag, userId);
        
        return tag;
      }
    } catch (error) {
      console.warn('Failed to create tag via API, creating locally:', error);
    }

    // Fallback to local creation
    return TagManager.createTag(name, userId);
  }

  /**
   * Update an existing tag
   * Updates in API if authenticated and tag has server ID, otherwise updates locally
   */
  static async updateTag(tag: Tag): Promise<Tag> {
    try {
      // If authenticated and tag has server ID, update via API
      if (SessionManager.isAuthenticated() && tag.id > 0 && !tag.isPreDefined) {
        const request = transformTagToUpdateRequest(tag);
        const apiTag = await tagsApi.updateTag(tag.id, request);
        const updatedTag = transformTagResponseArrayToTags([apiTag])[0];
        
        // Update localStorage
        TagManager.saveTag(updatedTag, tag.userId || 0);
        
        return updatedTag;
      }
    } catch (error) {
      console.warn('Failed to update tag via API, updating locally:', error);
    }

    // Fallback to local update
    const updatedTag = { ...tag, updatedAt: new Date() };
    TagManager.saveTag(updatedTag, tag.userId || 0);
    return updatedTag;
  }

  /**
   * Delete a tag
   * Deletes from API if authenticated and tag has server ID, otherwise deletes locally
   */
  static async deleteTag(tag: Tag): Promise<void> {
    // Cannot delete predefined tags
    if (tag.isPreDefined) {
      throw new Error('Cannot delete predefined tags');
    }

    try {
      // If authenticated and tag has server ID, delete via API
      if (SessionManager.isAuthenticated() && tag.id > 0) {
        await tagsApi.deleteTag(tag.id);
      }
    } catch (error) {
      console.warn('Failed to delete tag via API, deleting locally:', error);
    }

    // Always delete from localStorage
    TagManager.deleteTag(tag);
  }

  /**
   * Search tags by name
   * Uses localStorage for consistent offline experience
   */
  static searchTags(query: string, userId: number): Tag[] {
    return TagManager.searchTags(query, userId);
  }

  /**
   * Get tag suggestions for autocomplete
   * Uses localStorage for consistent offline experience
   */
  static getTagSuggestions(query: string, userId: number): Tag[] {
    return TagManager.getTagSuggestions(query, userId);
  }

  /**
   * Increment tag usage count
   * Updates locally and syncs to API in background
   */
  static async incrementTagUsage(tagUuid: string, userId: number): Promise<void> {
    // Update locally first for immediate feedback
    TagManager.incrementTagUsage(tagUuid, userId);

    // TODO: Implement background sync to API for usage count updates
    // This could be part of a batch sync operation
  }

  /**
   * Sync tags with API
   * Performs full synchronization between localStorage and API
   */
  static async syncTags(userId: number): Promise<void> {
    if (this.isSyncing || !SessionManager.isAuthenticated()) {
      return;
    }

    this.isSyncing = true;

    try {
      // Fetch all tags from API
      const apiTags = await tagsApi.getAllTags();
      const tags = transformTagResponseArrayToTags(apiTags);
      
      // Update localStorage with API data
      this.updateLocalStorageWithApiTags(tags, userId);
      
      console.log(`Synced ${tags.length} tags from API`);
    } catch (error) {
      console.error('Failed to sync tags:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Update localStorage with tags from API
   * Merges API data with local data, preserving local-only tags
   */
  private static updateLocalStorageWithApiTags(apiTags: Tag[], userId: number): void {
    try {
      // Get current local tags
      const localTags = TagManager.getUserTags(userId);
      
      // Create a map of API tags by UUID for quick lookup
      const apiTagsMap = new Map(apiTags.map(tag => [tag.uuid, tag]));
      
      // Update or add API tags to localStorage
      apiTags.forEach(tag => {
        TagManager.saveTag(tag, userId);
      });
      
      // Keep local-only tags (tags that don't exist in API)
      localTags.forEach(localTag => {
        if (!apiTagsMap.has(localTag.uuid) && localTag.id === 0) {
          // This is a local-only tag, keep it
          TagManager.saveTag(localTag, userId);
        }
      });
    } catch (error) {
      console.error('Failed to update localStorage with API tags:', error);
    }
  }

  /**
   * Check if tags are currently syncing
   */
  static get isSyncingTags(): boolean {
    return this.isSyncing;
  }
}
