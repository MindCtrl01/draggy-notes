import { Tag } from '@/domains/note';

// Storage keys
const STORAGE_PREFIX = 'draggy-notes';
const TAGS_STORAGE_KEY = (userId: number) => `${STORAGE_PREFIX}-note_tag_${userId}`;

// Predefined tags
export const PREDEFINED_TAGS: Tag[] = [
  { id: '-1', name: 'Công việc', userId: null, usageCount: 0 },
  { id: '-2', name: 'Cá nhân', userId: null, usageCount: 0 },
  { id: '-3', name: 'Gấp', userId: null, usageCount: 0 },
];

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
      return [...PREDEFINED_TAGS, ...userTags];
    } catch (error) {
      console.error('Failed to get all tags:', error);
      return PREDEFINED_TAGS;
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
      return tags.map((tag: any) => ({
        ...tag,
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
      const existingTagIndex = userTags.findIndex(t => t.id === tag.id);
      
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
      id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: name.trim(),
      userId,
      usageCount: 1,
    };
    
    this.saveTag(tag, userId);
    return tag;
  }

  /**
   * Increment usage count for a tag
   * @param tagId - The tag ID
   * @param userId - The user ID
   */
  static incrementTagUsage(tagId: string, userId: number): void {
    try {
      // Handle predefined tags
      if (tagId.startsWith('-')) {
        // For predefined tags, we don't track usage in localStorage
        return;
      }

      const userTags = this.getUserTags(userId);
      const tagIndex = userTags.findIndex(t => t.id === tagId);
      
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
   * @returns Array of tag IDs found or created
   */
  static findOrCreateTagsFromText(text: string, userId: number): string[] {
    const tagRegex = /#(\w+(?:\s+\w+)*)/g;
    const matches = Array.from(text.matchAll(tagRegex));
    const tagIds: string[] = [];
    
    if (matches.length === 0) {
      return tagIds;
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
      
      if (!tagIds.includes(existingTag.id)) {
        tagIds.push(existingTag.id);
      }
    }
    
    return tagIds;
  }

  /**
   * Get tags by IDs
   * @param tagIds - Array of tag IDs
   * @param userId - The user ID
   * @returns Array of tags
   */
  static getTagsByIds(tagIds: string[], userId: number): Tag[] {
    const allTags = this.getAllTags(userId);
    return tagIds
      .map(id => allTags.find(tag => tag.id === id))
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
      
      return [...PREDEFINED_TAGS, ...mostUsedUserTags];
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
      
      if (existingTag && !tags.find(t => t.id === existingTag.id)) {
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
   * @param tagId - The tag ID to delete
   * @param userId - The user ID
   */
  static deleteTag(tagId: string, userId: number): void {
    try {
      // Don't allow deleting predefined tags
      if (PREDEFINED_TAGS.some(tag => tag.id === tagId)) {
        return;
      }
      
      const userTags = this.getUserTags(userId);
      const filteredTags = userTags.filter(tag => tag.id !== tagId);
      
      const key = TAGS_STORAGE_KEY(userId);
      localStorage.setItem(key, JSON.stringify(filteredTags));
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
  findOrCreateTagsFromText,
  extractTagsFromText,
  removeTagsFromText,
  getTagsByIds,
  searchTags,
  getTagSuggestions,
  deleteTag,
  isStorageAvailable,
  incrementTagUsage,
} = TagManager;
