import { BaseEntity } from './base-entity';
import { Tag } from './tag';

export interface NoteTask extends BaseEntity {
    id: number;
    uuid: string;
    text: string;
    completed: boolean;
    userId: number;
    noteUuid: string;
    tags: Tag[];
}