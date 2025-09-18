import { Task } from '@/domains/task';

export const createTask = (text: string): Task => {
  const id = crypto.randomUUID();
  return {
    id,
    taskId: id, // Use the same ID for taskId
    text: text.trim(),
    completed: false,
    createdAt: new Date(),
    userId: -1, // Default userId
    tagIds: [], // Will be set by the calling function
  };
};

export const toggleTaskCompletion = (task: Task): Task => ({
  ...task,
  completed: !task.completed,
});

export const updateTaskText = (task: Task, text: string): Task => ({
  ...task,
  text: text.trim(),
});

export const getTaskProgress = (tasks: Task[]): { completed: number; total: number; percentage: number } => {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  return { completed, total, percentage };
};

export const getTaskProgressDisplay = (tasks: Task[]): string => {
  if (!tasks || tasks.length === 0) return 'No tasks';
  
  const { completed, total } = getTaskProgress(tasks);
  return `${completed}/${total} tasks`;
};
