import { useState } from 'react';
import { useNotesApi } from '../hooks/use-notes-crud';
import { NoteColor } from '@/domains/note';

// Example component showing how to use the generic CRUD system
export const NotesExample = () => {
  const {
    notes,
    isLoading,
    createNote,
    updateNote,
    patchNote,
    deleteNote,
    duplicateNote,
    searchNotes,
    bulkDeleteNotes,
    searchResults,
    isCreating,
    isUpdating,
    isDeleting,
    isDuplicating,
    isSearching,
    isBulkDeleting,
  } = useNotesApi();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);

  // Example: Create a new note
  const handleCreateNote = () => {
    createNote({
      content: 'New note created with generic CRUD!',
      color: 'yellow' as NoteColor,
      position: { x: Math.random() * 300, y: Math.random() * 300 },
    });
  };

  // Example: Update note content
  const handleUpdateNote = (id: string) => {
    updateNote(id, {
      content: 'Updated content using generic CRUD!',
    });
  };

  // Example: Patch note position (partial update)
  const handleMoveNote = (id: string) => {
    patchNote(id, {
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    });
  };

  // Example: Delete a note
  const handleDeleteNote = (id: string) => {
    deleteNote(id);
  };

  // Example: Duplicate a note
  const handleDuplicateNote = (id: string) => {
    duplicateNote(id);
  };

  // Example: Search notes
  const handleSearchNotes = () => {
    if (searchQuery.trim()) {
      searchNotes(searchQuery);
    }
  };

  // Example: Bulk delete selected notes
  const handleBulkDelete = () => {
    if (selectedNotes.length > 0) {
      bulkDeleteNotes(selectedNotes);
      setSelectedNotes([]);
    }
  };

  // Toggle note selection for bulk operations
  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading notes...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Generic CRUD API Example</h1>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={handleCreateNote}
          disabled={isCreating}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Note'}
        </button>

        <button
          onClick={handleBulkDelete}
          disabled={selectedNotes.length === 0 || isBulkDeleting}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {isBulkDeleting ? 'Deleting...' : `Delete Selected (${selectedNotes.length})`}
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearchNotes}
          disabled={isSearching}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search Results */}
      {searchResults && searchResults.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold mb-2">Search Results ({searchResults.length})</h3>
          <div className="grid gap-2">
            {searchResults.map(note => (
              <div key={note.id} className="p-2 bg-white rounded border">
                <p className="text-sm">{note.content}</p>
                <span className="text-xs text-gray-500">Color: {note.color}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map(note => (
          <div key={note.id} className="p-4 border rounded-lg shadow-sm bg-white">
            {/* Selection checkbox */}
            <div className="flex items-start gap-2 mb-2">
              <input
                type="checkbox"
                checked={selectedNotes.includes(note.id)}
                onChange={() => toggleNoteSelection(note.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">{note.content || 'Empty note'}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className={`px-2 py-1 rounded note-${note.color}`}>
                    {note.color}
                  </span>
                  <span>
                    Position: ({Math.round(note.position.x)}, {Math.round(note.position.y)})
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-1 mt-3">
              <button
                onClick={() => handleUpdateNote(note.id)}
                disabled={isUpdating}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                Update
              </button>
              <button
                onClick={() => handleMoveNote(note.id)}
                disabled={isUpdating}
                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
              >
                Move
              </button>
              <button
                onClick={() => handleDuplicateNote(note.id)}
                disabled={isDuplicating}
                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
              >
                Duplicate
              </button>
              <button
                onClick={() => handleDeleteNote(note.id)}
                disabled={isDeleting}
                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No notes found. Create your first note!</p>
        </div>
      )}
    </div>
  );
};
