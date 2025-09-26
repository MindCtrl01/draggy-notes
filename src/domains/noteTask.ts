import { BaseEntity } from './base-entity';

export interface NoteTask extends BaseEntity {
    id: number;
    uuid: string;
    text: string;
    completed: boolean;
    noteId: number;
}