import React from 'react';
import { Tag } from '@/domains/note';

interface TagDisplayProps {
  tags: Tag[];
  className?: string;
}

export const TagDisplay: React.FC<TagDisplayProps> = ({ tags, className = '' }) => {
  if (tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full border border-blue-200 dark:border-blue-700"
          title={`Tag: ${tag.name}${tag.usageCount ? ` (used ${tag.usageCount} times)` : ''}`}
        >
          #{tag.name}
        </span>
      ))}
    </div>
  );
};
