import { Tag } from '@/domains/tag';
import { v4 as uuidv4 } from 'uuid';

// Storage keys
const STORAGE_PREFIX = 'draggy-notes';
const TAGS_STORAGE_KEY = (userId: number) => `${STORAGE_PREFIX}-note_tag_${userId}`;

/**
 * Helper functions for managing tags in localStorage
 */
export class TagManager {
  /**
   * Get all tags for a user (including predefined tags)
   * @param userId - The user ID
   * @returns Array of all tags
   */
  static getAllTags(userId: number): Tag[] {
    try {
      const userTags = this.getUserTags(userId);
      return [...userTags];
    } catch (error) {
      console.error('Failed to get all tags:', error);
      return [];
    }
  }

  /**
   * Get user-created tags from localStorage
   * @param userId - The user ID
   * @returns Array of user-created tags
   */
  static getUserTags(userId: number): Tag[] {
    try {
      const key = TAGS_STORAGE_KEY(userId);
      const tagsData = localStorage.getItem(key);
      const tags = tagsData ? JSON.parse(tagsData) : [];
      
      // Ensure all tags have usageCount property (migration for existing tags)
      return tags.map((tag: Partial<Tag>) => ({
        uuid: tag.uuid || uuidv4(),
        name: tag.name || '',
        userId: tag.userId || null,
        usageCount: tag.usageCount || 0
      }));
    } catch (error) {
      console.error('Failed to get user tags from localStorage:', error);
      return [];
    }
  }

  /**
   * Save a tag to localStorage
   * @param tag - The tag to save
   * @param userId - The user ID
   */
  static saveTag(tag: Tag, userId: number): void {
    try {
      const userTags = this.getUserTags(userId);
      const existingTagIndex = userTags.findIndex(t => t.uuid === tag.uuid);
      
      if (existingTagIndex >= 0) {
        userTags[existingTagIndex] = tag;
      } else {
        userTags.push(tag);
      }
      
      const key = TAGS_STORAGE_KEY(userId);
      localStorage.setItem(key, JSON.stringify(userTags));
    } catch (error) {
      console.error('Failed to save tag to localStorage:', error);
    }
  }

  /**
   * Create a new tag from name
   * @param name - The tag name
   * @param userId - The user ID
   * @returns The created tag
   */
  static createTag(name: string, userId: number): Tag {
    const tag: Tag = {
      id: 0,
      uuid: uuidv4(),
      name: name.trim(),
      userId,
      usageCount: 1,
      isPredefined: false,
    };
    
    this.saveTag(tag, userId);
    return tag;
  }

  /**
   * Increment usage count for a tag
   * @param tagUuid - The tag UUID
   * @param userId - The user ID
   */
  static incrementTagUsage(tagUuid: string, userId: number): void {
    try {
      const userTags = this.getUserTags(userId);
      const tagIndex = userTags.findIndex(t => t.uuid === tagUuid);
      
      if (tagIndex >= 0) {
        userTags[tagIndex].usageCount = (userTags[tagIndex].usageCount || 0) + 1;
        const key = TAGS_STORAGE_KEY(userId);
        localStorage.setItem(key, JSON.stringify(userTags));
      }
    } catch (error) {
      console.error('Failed to increment tag usage:', error);
    }
  }


  /**
   * Find or create tags from text content
   * @param text - The text to parse for tags
   * @param userId - The user ID
   * @returns Array of Tag objects found or created
   */
  static findOrCreateTagsFromText(text: string, userId: number): Tag[] {
    const tagRegex = /#(\w+(?:\s+\w+)*)/g;
    const matches = Array.from(text.matchAll(tagRegex));
    const foundTags: Tag[] = [];
    
    if (matches.length === 0) {
      return foundTags;
    }
    
    const allTags = this.getAllTags(userId);
    
    for (const match of matches) {
      const tagName = match[1].trim();
      
      // Find existing tag (case-insensitive)
      let existingTag = allTags.find(tag => 
        tag.name.toLowerCase() === tagName.toLowerCase()
      );
      
      if (!existingTag) {
        // Create new tag
        existingTag = this.createTag(tagName, userId);
        allTags.push(existingTag);
      }
      
      if (!foundTags.some(tag => tag.uuid === existingTag!.uuid)) {
        foundTags.push(existingTag);
      }
    }
    
    return foundTags;
  }

  /**
   * Find or create tags from text content - Legacy UUID version
   * @param text - The text to parse for tags
   * @param userId - The user ID
   * @returns Array of tag UUIDs found or created
   * @deprecated Use findOrCreateTagsFromText instead
   */
  static findOrCreateTagUuidsFromText(text: string, userId: number): string[] {
    return this.findOrCreateTagsFromText(text, userId).map(tag => tag.uuid);
  }

  /**
   * Get tags by UUIDs
   * @param tagUuids - Array of tag UUIDs
   * @param userId - The user ID
   * @returns Array of tags
   */
  static getTagsByUuids(tagUuids: string[], userId: number): Tag[] {
    const allTags = this.getAllTags(userId);
    return tagUuids
      .map(uuid => allTags.find(tag => tag.uuid === uuid))
      .filter((tag): tag is Tag => tag !== undefined);
  }

  /**
   * Search tags by name
   * @param query - Search query
   * @param userId - The user ID
   * @returns Array of matching tags
   */
  static searchTags(query: string, userId: number): Tag[] {
    const allTags = this.getAllTags(userId);
    const lowerQuery = query.toLowerCase();
    
    return allTags.filter(tag =>
      tag.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get tag suggestions for autocomplete
   * @param query - Partial tag name (without #)
   * @param userId - The user ID
   * @returns Array of suggested tags (3 default tags + 2 most used tags when no query, or filtered results when query exists)
   */
  static getTagSuggestions(query: string, userId: number): Tag[] {
    if (!query.trim()) {
      // Return 3 default tags + 2 most used user tags
      const userTags = this.getUserTags(userId);
      const mostUsedUserTags = userTags
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 2);
      
      return [...mostUsedUserTags];
    }
    
    return this.searchTags(query, userId).slice(0, 10);
  }

  /**
   * Extract tags from text content and return tag objects
   * @param text - The text to parse for tags
   * @param userId - The user ID
   * @returns Array of tag objects found in the text
   */
  static extractTagsFromText(text: string, userId: number): Tag[] {
    const tagRegex = /#(\w+(?:\s+\w+)*)/g;
    const matches = Array.from(text.matchAll(tagRegex));
    const tags: Tag[] = [];
    
    if (matches.length === 0) {
      return tags;
    }
    
    const allTags = this.getAllTags(userId);
    
    for (const match of matches) {
      const tagName = match[1].trim();
      
      // Find existing tag (case-insensitive)
      const existingTag = allTags.find(tag => 
        tag.name.toLowerCase() === tagName.toLowerCase()
      );
      
      if (existingTag && !tags.find(t => t.uuid === existingTag.uuid)) {
        tags.push(existingTag);
      }
    }
    
    return tags;
  }

  /**
   * Remove tag text from content for display purposes
   * @param text - The text to clean
   * @returns Text with #tagname patterns removed
   */
  static removeTagsFromText(text: string): string {
    const tagRegex = /#(\w+(?:\s+\w+)*)/g;
    return text.replace(tagRegex, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Delete a user-created tag
   * @param tagUuid - The tag UUID to delete
   * @param userId - The user ID
   */
  static deleteTag(tag: Tag): void {
    try {
      // Don't allow deleting predefined tags
      if (tag.isPredefined) {
        return;
      }
      
      const key = TAGS_STORAGE_KEY(tag.userId);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to delete tag from localStorage:', error);
    }
  }

  /**
   * Check if localStorage is available
   * @returns True if localStorage is available
   */
  static isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

// Export individual functions for convenience
export const {
  getAllTags,
  getUserTags,
  saveTag,
  createTag,
  getTagsByUuids,
  searchTags,
  getTagSuggestions,
  deleteTag,
  isStorageAvailable,
  incrementTagUsage,
} = TagManager;
