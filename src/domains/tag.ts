import { BaseEntity } from './base-entity';

export interface Tag extends BaseEntity {
    name: string;
    userId: number | null;
    usageCount: number;
}