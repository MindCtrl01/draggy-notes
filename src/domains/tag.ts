import { BaseEntity } from './base-entity';

export interface Tag extends BaseEntity {
    uuid: string;
    name: string;
    userId: number | null;
    usageCount: number;
    isPreDefined: boolean;
}