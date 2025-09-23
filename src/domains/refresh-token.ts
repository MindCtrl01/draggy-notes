import { BaseEntity } from './base-entity';

export interface RefreshToken extends BaseEntity {
  token: string;
  expires: Date;
  created: Date;
  createdByIp?: string;
  revoked?: Date;
  revokedByIp?: string;
  replacedByToken?: string;
  
  // Foreign key for User
  userId: number;
  
  // Navigation property (using type reference to avoid circular import)
  user?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    isActive: boolean;
    isDelete: boolean;
    roles: string[];
  };
  
  // Computed properties (would be implemented as getters in a class)
  isExpired: boolean;
  isRevoked: boolean;
  isActive: boolean;
}
