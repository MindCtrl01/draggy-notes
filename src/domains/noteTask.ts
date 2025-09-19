export interface NoteTask {
    id: string;
    taskId: string;
    text: string;
    completed: boolean;
    createdAt: Date;
    userId: number;
    tagIds: string[];
  }