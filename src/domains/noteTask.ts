import { BaseEntity } from './base-entity';

export interface NoteTask extends BaseEntity {
    uuid: string;
    text: string;
    completed: boolean;
    noteId: number;
}