export interface Task {
    id: string;
    taskId: string;
    text: string;
    completed: boolean;
    createdAt: Date;
    userId: number;
    tagIds: string[];
  }