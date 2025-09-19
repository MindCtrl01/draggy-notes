import { NoteTask } from "./noteTask";

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
  noteTasks?: NoteTask[];
  isTaskMode?: boolean;
  userId: number;
  tagIds: string[];
}