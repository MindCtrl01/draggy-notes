import { NoteTask } from '@/domains/noteTask';

export const createTask = (text: string, noteUuid: string = ''): NoteTask => {
  const uuid = crypto.randomUUID();
  return {
    uuid,
    taskId: uuid, // Use the same UUID for taskId
    text: text.trim(),
    completed: false,
    createdAt: new Date(),
    userId: -1, // Default userId
    noteUuid, // Required property
    tags: [], // Will be set by the calling function
  };
};

export const toggleTaskCompletion = (task: NoteTask): NoteTask => ({
  ...task,
  completed: !task.completed,
});

export const updateTaskText = (task: NoteTask, text: string): NoteTask => ({
  ...task,
  text: text.trim(),
});

export const getTaskProgress = (tasks: NoteTask[]): { completed: number; total: number; percentage: number } => {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  return { completed, total, percentage };
};

export const getTaskProgressDisplay = (tasks: NoteTask[]): string => {
  if (!tasks || tasks.length === 0) return 'No tasks';
  
  const { completed, total } = getTaskProgress(tasks);
  return `${completed}/${total} tasks`;
};
