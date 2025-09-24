import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { TagManager } from '@/helpers/tag-manager';
import { Tag } from '@/domains/tag';

interface TagDisplayProps {
  tags: Tag[];
  className?: string;
  onTagsChange?: (tags: Tag[]) => void;
  userId?: number;
  readOnly?: boolean;
}

export const TagDisplay: React.FC<TagDisplayProps> = ({ 
  tags, 
  className = '', 
  onTagsChange,
  userId = -1,
  readOnly = false
}) => {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when adding tag
  useEffect(() => {
    if (isAddingTag && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTag]);

  // Update suggestions when input changes
  useEffect(() => {
    if (tagInput.trim()) {
      const allSuggestions = TagManager.getTagSuggestions(tagInput.trim(), userId);
      const filteredSuggestions = allSuggestions.filter(suggestion => 
        !tags.some(tag => tag.uuid === suggestion.uuid)
      );
      setSuggestions(filteredSuggestions);
      setSelectedSuggestionIndex(0);
    } else {
      const defaultSuggestions = TagManager.getTagSuggestions('', userId);
      const filteredSuggestions = defaultSuggestions.filter(suggestion => 
        !tags.some(tag => tag.uuid === suggestion.uuid)
      );
      setSuggestions(filteredSuggestions);
      setSelectedSuggestionIndex(0);
    }
  }, [tagInput, tags, userId]);

  // Handle click outside to close input
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleCancelAdd();
      }
    };

    if (isAddingTag) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAddingTag]);

  const handleAddTag = () => {
    if (readOnly) return;
    setIsAddingTag(true);
    setTagInput('');

    const defaultSuggestions = TagManager.getTagSuggestions('', userId);
    const filteredSuggestions = defaultSuggestions.filter(suggestion => 
      !tags.some(tag => tag.uuid === suggestion.uuid)
    );
    setSuggestions(filteredSuggestions);
    setSelectedSuggestionIndex(0);
  };

  const handleCancelAdd = () => {
    setIsAddingTag(false);
    setTagInput('');
    setSuggestions([]);
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelAdd();
      return;
    }

    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && selectedSuggestionIndex < suggestions.length) {
        selectTag(suggestions[selectedSuggestionIndex]);
      } else if (tagInput.trim()) {
        createAndSelectTag(tagInput.trim());
      }
    }
  };

  const selectTag = (tag: Tag) => {
    const newTags = [...tags, tag];
    onTagsChange?.(newTags);
    TagManager.incrementTagUsage(tag.uuid, userId);
    handleCancelAdd();
  };

  const createAndSelectTag = (tagName: string) => {
    const newTag = TagManager.createTag(tagName, userId);
    const newTags = [...tags, newTag];
    onTagsChange?.(newTags);
    handleCancelAdd();
  };

  const handleRemoveTag = (tagToRemove: Tag) => {
    if (readOnly) return;
    const newTags = tags.filter(tag => tag.uuid !== tagToRemove.uuid);
    onTagsChange?.(newTags);
  };

  const handleSuggestionClick = (suggestion: Tag) => {
    selectTag(suggestion);
  };

  return (
    <div ref={containerRef} className={`flex flex-wrap items-center gap-1 ${className}`}>
      {/* Existing tags */}
      {tags.map((tag) => (
        <span
          key={tag.uuid}
          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full border border-blue-200 dark:border-blue-700 group max-w-60"
          title={`Tag: ${tag.name}${tag.usageCount ? ` (used ${tag.usageCount} times)` : ''}`}
        >
          <span className="truncate">
            {tag.name}
          </span>
          {!readOnly && (
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 p-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              title="Remove tag"
            >
              <X size={10} />
            </button>
          )}
        </span>
      ))}

      {/* Add tag input/button */}
      {!readOnly && (
        <div className="relative">
          {isAddingTag ? (
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-24"
                placeholder="Add tag..."
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-32 overflow-y-auto min-w-32 z-50 scrollbar-hide">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.uuid}
                      className={`px-3 py-2 cursor-pointer text-xs ${
                        index === selectedSuggestionIndex
                          ? 'bg-blue-100 dark:bg-blue-700 text-blue-900 dark:text-blue-100'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    >
                      {suggestion.name}
                      {suggestion.userId === null && (
                        <span className="ml-2 text-xs text-gray-400 dark:text-gray-300">
                          (default)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleAddTag}
              className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-100 rounded-full border border-gray-300 dark:border-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              title="Add tag"
            >
              <Plus size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};