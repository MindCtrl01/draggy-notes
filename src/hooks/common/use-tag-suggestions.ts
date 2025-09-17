import { useState, useCallback, useEffect } from 'react';
import { Tag } from '@/domains/note';

interface TagSuggestionState {
  isVisible: boolean;
  position: { x: number; y: number };
  query: string;
  cursorPosition: number;
}

export const useTagSuggestions = (
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  userId: number,
  onTagInsert?: (tag: Tag, position: number) => void
) => {
  const [suggestionState, setSuggestionState] = useState<TagSuggestionState>({
    isVisible: false,
    position: { x: 0, y: 0 },
    query: '',
    cursorPosition: 0,
  });

  const handleTextChange = useCallback((text: string, cursorPosition: number) => {
    if (!textareaRef.current) return;

    // Find if cursor is after a # character
    const beforeCursor = text.substring(0, cursorPosition);
    const hashMatch = beforeCursor.match(/#(\w*)$/);
    
    if (hashMatch) {
      const query = hashMatch[1];
      const hashPosition = cursorPosition - query.length - 1; // Position of #
      
      // Calculate position for suggestion dropdown
      const textarea = textareaRef.current;
      const rect = textarea.getBoundingClientRect();
      const lineHeight = 20; // Approximate line height
      
      // Create a temporary element to measure text position
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.whiteSpace = 'pre-wrap';
      tempDiv.style.font = window.getComputedStyle(textarea).font;
      tempDiv.style.width = textarea.clientWidth + 'px';
      tempDiv.textContent = beforeCursor;
      
      document.body.appendChild(tempDiv);
      const textWidth = tempDiv.scrollWidth;
      const lines = Math.floor(tempDiv.scrollHeight / lineHeight);
      document.body.removeChild(tempDiv);
      
      setSuggestionState({
        isVisible: true,
        position: {
          x: rect.left + (textWidth % textarea.clientWidth),
          y: rect.top + (lines * lineHeight) + lineHeight,
        },
        query,
        cursorPosition: hashPosition,
      });
    } else {
      setSuggestionState(prev => ({ ...prev, isVisible: false }));
    }
  }, [textareaRef]);

  const handleTagSelect = useCallback((tag: Tag) => {
    if (!textareaRef.current || !onTagInsert) return;

    onTagInsert(tag, suggestionState.cursorPosition);
    setSuggestionState(prev => ({ ...prev, isVisible: false }));
  }, [textareaRef, onTagInsert, suggestionState.cursorPosition]);

  const closeSuggestions = useCallback(() => {
    setSuggestionState(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Handle escape key and clicks outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && suggestionState.isVisible) {
        closeSuggestions();
      }
    };

    if (suggestionState.isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [suggestionState.isVisible, closeSuggestions]);

  return {
    suggestionState,
    handleTextChange,
    handleTagSelect,
    closeSuggestions,
  };
};
