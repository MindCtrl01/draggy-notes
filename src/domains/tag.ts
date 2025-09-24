import { BaseEntity } from './base-entity';

export interface Tag extends BaseEntity {
    uuid: string;
    name: string;
    userId: number;
    usageCount: number;
    isPredefined: boolean;
}