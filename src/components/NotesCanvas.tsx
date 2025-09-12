import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Note, NoteColor } from '@/types/note';
import { NoteCard } from './NoteCard';
import { toast } from 'sonner';

const NOTE_COLORS: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'];

export const NotesCanvas = () => {
  const [notes, setNotes] = useState<Note[]>([]);

  const createNote = useCallback((position?: { x: number; y: number }) => {
    const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    const defaultPosition = position || { 
      x: Math.random() * (window.innerWidth - 250), 
      y: Math.random() * (window.innerHeight - 200) + 100 
    };

    const newNote: Note = {
      id: Date.now().toString(),
      content: '',
      color: randomColor,
      position: defaultPosition,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setNotes(prev => [...prev, newNote]);
    toast.success('New note created!');
  }, []);

  const updateNote = useCallback((updatedNote: Note) => {
    setNotes(prev => prev.map(note => 
      note.id === updatedNote.id ? updatedNote : note
    ));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    toast.success('Note deleted!');
  }, []);

  const dragNote = useCallback((id: string, position: { x: number; y: number }) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, position } : note
    ));
  }, []);

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left - 100, // Center the note
      y: e.clientY - rect.top - 75
    };
    createNote(position);
  };

  return (
    <div className="canvas-container group" onDoubleClick={handleCanvasDoubleClick}>
      <div className="absolute top-8 left-8 z-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Notes</h1>
        <p className="text-muted-foreground">Double-click anywhere to create a note, or use the + button</p>
      </div>

      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onUpdate={updateNote}
          onDelete={deleteNote}
          onDrag={dragNote}
        />
      ))}

      <button
        onClick={() => createNote()}
        className="floating-add-btn text-white hover:text-white"
        title="Add new note"
      >
        <Plus size={24} />
      </button>

      {notes.length === 0 && (
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