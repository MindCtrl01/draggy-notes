import { BaseEntity } from './base-entity';
import { NoteTask } from "./noteTask";
import { Tag } from "./tag";

export interface Note extends BaseEntity {
  uuid: string;
  title: string;
  content: string;
  date: Date;
  color: string;
  isDisplayed: boolean;
  isPinned?: boolean;
  position: {
    x: number;
    y: number;
  };
  noteTasks?: NoteTask[];
  isTaskMode?: boolean;
  userId: number;
  tags: Tag[];
}