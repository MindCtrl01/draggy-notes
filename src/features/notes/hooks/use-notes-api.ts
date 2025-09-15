import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Note, NoteColor } from '@/domains/note';
import { notesApi, CreateNoteRequest, UpdateNoteRequest } from '@/services/api/notes-api';

// Query keys for React Query
const QUERY_KEYS = {
  notes: ['notes'] as const,
  note: (id: string) => ['notes', id] as const,
};

// Custom hook for notes API operations
export const useNotesApi = () => {
  const queryClient = useQueryClient();

  // Fetch all notes
  const {
    data: notes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.notes,
    queryFn: notesApi.getAllNotes,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: notesApi.createNote,
    onSuccess: (newNote) => {
      // Update the cache with the new note
      queryClient.setQueryData<Note[]>(QUERY_KEYS.notes, (oldNotes) => [
        ...(oldNotes || []),
        newNote,
      ]);
      toast.success('Note created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create note:', error);
      toast.error('Failed to create note. Please try again.');
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteRequest }) =>
      notesApi.updateNote(id, data),
    onSuccess: (updatedNote) => {
      // Update the cache with the updated note
      queryClient.setQueryData<Note[]>(QUERY_KEYS.notes, (oldNotes) =>
        oldNotes?.map((note) =>
          note.id === updatedNote.id ? updatedNote : note
        ) || []
      );
      toast.success('Note updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update note:', error);
      toast.error('Failed to update note. Please try again.');
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: notesApi.deleteNote,
    onSuccess: (_, deletedId) => {
      // Remove the note from cache
      queryClient.setQueryData<Note[]>(QUERY_KEYS.notes, (oldNotes) =>
        oldNotes?.filter((note) => note.id !== deletedId) || []
      );
      toast.success('Note deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete note:', error);
      toast.error('Failed to delete note. Please try again.');
    },
  });

  // Helper functions for easier usage
  const createNote = (noteData: {
    content: string;
    color: NoteColor;
    position: { x: number; y: number };
  }) => {
    const createData: CreateNoteRequest = {
      content: noteData.content,
      color: noteData.color,
      position: noteData.position,
    };
    return createNoteMutation.mutate(createData);
  };

  const updateNote = (id: string, noteData: Partial<Note>) => {
    const updateData: UpdateNoteRequest = {};
    
    if (noteData.content !== undefined) updateData.content = noteData.content;
    if (noteData.color !== undefined) updateData.color = noteData.color;
    if (noteData.position !== undefined) updateData.position = noteData.position;

    return updateNoteMutation.mutate({ id, data: updateData });
  };

  const deleteNote = (id: string) => {
    return deleteNoteMutation.mutate(id);
  };

  return {
    // Data
    notes,
    isLoading,
    error,
    
    // Actions
    createNote,
    updateNote,
    deleteNote,
    refetch,
    
    // Loading states
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
    
    // Error states
    createError: createNoteMutation.error,
    updateError: updateNoteMutation.error,
    deleteError: deleteNoteMutation.error,
  };
};
