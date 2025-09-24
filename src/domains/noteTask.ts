import { BaseEntity } from './base-entity';
import { Tag } from './tag';

export interface NoteTask extends BaseEntity {
    uuid: string;
    taskId: string;
    text: string;
    completed: boolean;
    userId: number;
    noteUuid: string;
    tags: Tag[];
}