export interface NoteTask {
    id: number;
    taskId: string;
    text: string;
    completed: boolean;
    createdAt: Date;
    userId: number;
    noteId: number;
    tagIds: string[];
  }