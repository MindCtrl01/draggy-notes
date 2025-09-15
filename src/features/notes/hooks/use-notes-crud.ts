import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
// import { createCrudHooks } from '@/hooks/api/use-api'; // Temporarily disabled - missing function
import { notesApi, CreateNoteRequest, UpdateNoteRequest } from '../api/notes-crud-api';
import { Note, NoteColor } from '@/domains/note';

// Create standard CRUD hooks for notes (temporarily disabled)
/*
const {
  useGetAll: useGetAllNotes,
  useGetById: useGetNoteById,
  useCreate: useCreateNote,
  useUpdate: useUpdateNote,
  usePatch: usePatchNote,
  useDelete: useDeleteNote,
  queryKeys: notesQueryKeys,
} = createCrudHooks(notesApi, {
  resource: 'note',
  successMessages: {
    create: 'Note created successfully!',
    update: 'Note saved successfully!',
    delete: 'Note deleted successfully!',
  },
  errorMessages: {
    create: 'Failed to create note. Please try again.',
    update: 'Failed to save note. Please try again.',
    delete: 'Failed to delete note. Please try again.',
    fetch: 'Failed to load notes. Please try again.',
  },
});
*/

// Custom hooks for specific note operations (temporarily disabled)
export const useNotesApi = () => {
  // API temporarily disabled - returning mock data
  return {
    notes: [],
    isLoading: false,
    error: null,
    refetch: () => {},
    createNote: () => {},
    updateNote: () => {},
    patchNote: () => {},
    deleteNote: () => {},
    duplicateNote: () => {},
    searchNotes: () => {},
    bulkDeleteNotes: () => {},
    isCreating: false,
    isUpdating: false,
    isPatching: false,
    isDeleting: false,
    isDuplicating: false,
    isSearching: false,
    isBulkDeleting: false,
    createError: null,
    updateError: null,
    patchError: null,
    deleteError: null,
    duplicateError: null,
    searchError: null,
    bulkDeleteError: null,
    queryKeys: {},
    searchResults: [],
  };
  
  /*
  const queryClient = useQueryClient();

  // Standard CRUD operations
  const {
    data: notes = [],
    isLoading,
    error,
    refetch,
  } = useGetAllNotes();

  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const patchNoteMutation = usePatchNote();
  const deleteNoteMutation = useDeleteNote();

  // Custom operations using mutations
  const duplicateNoteMutation = useMutation({
    mutationFn: (id: string) => notesApi.duplicateNote(id),
    onSuccess: (duplicatedNote) => {
      queryClient.setQueryData<Note[]>(notesQueryKeys.lists(), (oldNotes) => [
        ...(oldNotes || []),
        duplicatedNote,
      ]);
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.lists() });
      toast.success('Note duplicated successfully!');
    },
    onError: (error) => {
      console.error('Failed to duplicate note:', error);
      toast.error('Failed to duplicate note. Please try again.');
    },
  });

  const searchNotesMutation = useMutation({
    mutationFn: (query: string) => notesApi.searchNotes(query),
    onError: (error) => {
      console.error('Failed to search notes:', error);
      toast.error('Failed to search notes. Please try again.');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => notesApi.bulkDelete(ids),
    onSuccess: (_, deletedIds) => {
      queryClient.setQueryData<Note[]>(notesQueryKeys.lists(), (oldNotes) =>
        oldNotes?.filter((note) => !deletedIds.includes(note.id)) || []
      );
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.lists() });
      toast.success(`${deletedIds.length} notes deleted successfully!`);
    },
    onError: (error) => {
      console.error('Failed to bulk delete notes:', error);
      toast.error('Failed to delete notes. Please try again.');
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

  const patchNote = (id: string, noteData: Partial<UpdateNoteRequest>) => {
    return patchNoteMutation.mutate({ id, data: noteData });
  };

  const deleteNote = (id: string) => {
    return deleteNoteMutation.mutate(id);
  };

  const duplicateNote = (id: string) => {
    return duplicateNoteMutation.mutate(id);
  };

  const searchNotes = (query: string) => {
    return searchNotesMutation.mutate(query);
  };

  const bulkDeleteNotes = (ids: string[]) => {
    return bulkDeleteMutation.mutate(ids);
  };

  return {
    // Data
    notes,
    isLoading,
    error,
    searchResults: searchNotesMutation.data,
    
    // Actions
    createNote,
    updateNote,
    patchNote,
    deleteNote,
    duplicateNote,
    searchNotes,
    bulkDeleteNotes,
    refetch,
    
    // Loading states
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isPatching: patchNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
    isDuplicating: duplicateNoteMutation.isPending,
    isSearching: searchNotesMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
    
    // Error states
    createError: createNoteMutation.error,
    updateError: updateNoteMutation.error,
    patchError: patchNoteMutation.error,
    deleteError: deleteNoteMutation.error,
    duplicateError: duplicateNoteMutation.error,
    searchError: searchNotesMutation.error,
    bulkDeleteError: bulkDeleteMutation.error,

    // Query keys for manual cache management
    queryKeys: notesQueryKeys,
  };
  */
};

// Export individual hooks for granular usage (temporarily disabled)
/*
export {
  useGetAllNotes,
  useGetNoteById,
  useCreateNote,
  useUpdateNote,
  usePatchNote,
  useDeleteNote,
  notesQueryKeys,
};
*/
