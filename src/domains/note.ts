export interface Note {
  id: string;
  title: string;
  content: string;
  date: Date;
  color: string;
  isDisplayed: boolean;
  position: {
    x: number;
    y: number;
  };
  createdAt: Date;
  updatedAt: Date;
  tasks?: Task[];
  isTaskMode?: boolean;
  userId: number;
  tagIds: string[];
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  userId: number;
  tagIds: string[];
}

export interface Tag {
  id: string;
  name: string;
  userId: number | null;
}