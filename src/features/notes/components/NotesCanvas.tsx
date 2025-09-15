import '../styles/notes-canvas.css';
import { Plus } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { useNotes } from '../hooks/use-notes';

export const NotesCanvas = () => {
  const { 
    notes, 
    isLoading,
    createNote, 
    updateNote, 
    deleteNote, 
    dragNote, 
    finalizeDrag,
    isCreating,
    isUpdating,
    isDeleting 
  } = useNotes();

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left - 100, // Center the note
      y: e.clientY - rect.top - 75
    };
    createNote(position);
  };

  if (isLoading) {
    return (
      <div className="canvas-container flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-container group" onDoubleClick={handleCanvasDoubleClick}>
      <div className="absolute top-8 left-8 z-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">FThu Notes 12</h1>
        <p className="text-muted-foreground">
          Double-click anywhere to create a note, or use the + button
          {(isCreating || isUpdating || isDeleting) && (
            <span className="ml-2 text-xs text-primary">
              {isCreating && "Creating..."}
              {isUpdating && "Saving..."}
              {isDeleting && "Deleting..."}
            </span>
          )}
        </p>
      </div>

      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onUpdate={updateNote}
          onDelete={deleteNote}
          onDrag={dragNote}
          onDragEnd={finalizeDrag}
        />
      ))}

      <button
        onClick={() => createNote()}
        disabled={isCreating}
        className="floating-add-btn text-white hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        title={isCreating ? "Creating note..." : "Add new note"}
      >
        {isCreating ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        ) : (
          <Plus size={24} />
        )}
      </button>

      {notes.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold mb-2">No notes yet</h2>
            <p className="text-lg">Double-click anywhere to create your first note!</p>
          </div>
        </div>
      )}
    </div>
  );
};
