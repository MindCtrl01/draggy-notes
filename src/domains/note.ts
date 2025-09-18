import { Task } from "./task";

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