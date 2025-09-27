import React, { useState, useEffect } from 'react';
import { Tag, Edit2, Trash2, Plus, Search, Hash } from 'lucide-react';
import { Tag as TagType } from '@/domains/tag';
import { useTags } from '@/hooks/tags';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTagSelect?: (tag: TagType) => void;
}

export const TagManager: React.FC<TagManagerProps> = ({
  isOpen,
  onClose,
  onTagSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const {
    tags,
    topTags,
    isLoading,
    error,
    createTag,
    updateTag,
    deleteTag,
    searchTags,
  } = useTags();

  // Filter tags based on search query
  const filteredTags = searchQuery.trim()
    ? searchTags(searchQuery)
    : tags;

  // Handle creating a new tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const success = await createTag(newTagName.trim());
    if (success) {
      setNewTagName('');
      setIsCreating(false);
    }
  };

  // Handle editing a tag
  const handleEditTag = async (tag: TagType) => {
    if (!editingName.trim() || editingName === tag.name) {
      setEditingTag(null);
      setEditingName('');
      return;
    }

    const updatedTag = { ...tag, name: editingName.trim() };
    const success = await updateTag(updatedTag);
    if (success) {
      setEditingTag(null);
      setEditingName('');
    }
  };

  // Handle deleting a tag
  const handleDeleteTag = async (tag: TagType) => {
    if (tag.isPreDefined) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete the tag "${tag.name}"?`);
    if (confirmed) {
      await deleteTag(tag);
    }
  };

  // Start editing a tag
  const startEditing = (tag: TagType) => {
    if (tag.isPreDefined) return;
    setEditingTag(tag);
    setEditingName(tag.name);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTag(null);
    setEditingName('');
  };

  // Handle key press for editing
  const handleEditKeyPress = (e: React.KeyboardEvent, tag: TagType) => {
    if (e.key === 'Enter') {
      handleEditTag(tag);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Handle key press for creating
  const handleCreateKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTag();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewTagName('');
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setEditingTag(null);
      setEditingName('');
      setIsCreating(false);
      setNewTagName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tag Manager
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search and Create */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Tag
            </button>
          </div>

          {/* Create new tag input */}
          {isCreating && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={handleCreateKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleCreateTag}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewTagName('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-96">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading tags...
            </div>
          ) : (
            <>
              {/* Top Tags Section */}
              {!searchQuery && topTags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Popular Tags
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {topTags.map((tag) => (
                      <TagItem
                        key={tag.uuid}
                        tag={tag}
                        isEditing={editingTag?.uuid === tag.uuid}
                        editingName={editingName}
                        onEditingNameChange={setEditingName}
                        onStartEdit={startEditing}
                        onSaveEdit={handleEditTag}
                        onCancelEdit={cancelEditing}
                        onDelete={handleDeleteTag}
                        onSelect={onTagSelect}
                        onKeyPress={handleEditKeyPress}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Tags Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  {searchQuery ? `Search Results (${filteredTags.length})` : `All Tags (${tags.length})`}
                </h3>
                {filteredTags.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No tags found matching your search.' : 'No tags created yet.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredTags.map((tag) => (
                      <TagItem
                        key={tag.uuid}
                        tag={tag}
                        isEditing={editingTag?.uuid === tag.uuid}
                        editingName={editingName}
                        onEditingNameChange={setEditingName}
                        onStartEdit={startEditing}
                        onSaveEdit={handleEditTag}
                        onCancelEdit={cancelEditing}
                        onDelete={handleDeleteTag}
                        onSelect={onTagSelect}
                        onKeyPress={handleEditKeyPress}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface TagItemProps {
  tag: TagType;
  isEditing: boolean;
  editingName: string;
  onEditingNameChange: (name: string) => void;
  onStartEdit: (tag: TagType) => void;
  onSaveEdit: (tag: TagType) => void;
  onCancelEdit: () => void;
  onDelete: (tag: TagType) => void;
  onSelect?: (tag: TagType) => void;
  onKeyPress: (e: React.KeyboardEvent, tag: TagType) => void;
}

const TagItem: React.FC<TagItemProps> = ({
  tag,
  isEditing,
  editingName,
  onEditingNameChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onSelect,
  onKeyPress,
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onKeyDown={(e) => onKeyPress(e, tag)}
            onBlur={() => onSaveEdit(tag)}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <>
            <span className="text-blue-500">#</span>
            <span 
              className="font-medium text-gray-900 dark:text-white truncate cursor-pointer"
              onClick={() => onSelect?.(tag)}
              title={tag.name}
            >
              {tag.name}
            </span>
            {tag.isPreDefined && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                predefined
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({tag.usageCount})
            </span>
          </>
        )}
      </div>
      
      {!tag.isPreDefined && (
        <div className="flex items-center gap-1 ml-2">
          {isEditing ? (
            <>
              <button
                onClick={() => onSaveEdit(tag)}
                className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                title="Save"
              >
                ✓
              </button>
              <button
                onClick={onCancelEdit}
                className="p-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title="Cancel"
              >
                ×
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onStartEdit(tag)}
                className="p-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title="Edit tag"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDelete(tag)}
                className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                title="Delete tag"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
