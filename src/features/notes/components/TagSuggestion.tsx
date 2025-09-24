import { useState, useEffect, useRef } from 'react';
import { Tag } from '@/domains/tag';
import { TagManager } from '@/helpers/tag-manager';

interface TagSuggestionProps {
  isVisible: boolean;
  position: { x: number; y: number };
  query: string;
  userId: number;
  onTagSelect: (tag: Tag) => void;
  onClose: () => void;
}

export const TagSuggestion = ({
  isVisible,
  position,
  query,
  userId,
  onTagSelect,
  onClose,
}: TagSuggestionProps) => {
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) {
      const tags = TagManager.getTagSuggestions(query, userId);
      setSuggestions(tags);
      setSelectedIndex(0);
    }
  }, [isVisible, query, userId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            onTagSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, suggestions, selectedIndex, onTagSelect, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-48"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="p-1">
        {suggestions.map((tag, index) => (
          <div
            key={tag.uuid}
            className={`px-3 py-2 cursor-pointer rounded text-sm flex items-center gap-2 ${
              index === selectedIndex
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => onTagSelect(tag)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className="text-blue-500">#</span>
            <span>{tag.name}</span>
            {tag.userId === null && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                default
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
