import { BaseEntity } from './base-entity';

export interface ClientDeviceInfo extends BaseEntity {
  clientId: string;
  requestCount: number;
  windowStart: Date;
  lastRequestAt: Date;
}
