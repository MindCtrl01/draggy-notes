import { BaseEntity } from './base-entity';

export interface NoteTask extends BaseEntity {
    uuid: string;
    taskId: string;
    text: string;
    completed: boolean;
    userId: number;
    noteUuid: string;
    tagUuids: string[];
}