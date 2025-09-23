import { BaseEntity } from './base-entity';

export interface NoteTask extends BaseEntity {
    taskId: string;
    text: string;
    completed: boolean;
    userId: number;
    noteId: number;
    tagIds: number[];
}