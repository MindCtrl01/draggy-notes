import { BaseEntity } from './base-entity';

export interface User extends BaseEntity {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  isDelete: boolean;
  passwordHash?: string;
  googleId?: string;
  roles: string[];
  
  // Navigation properties (using type references to avoid circular imports)
  refreshTokens?: Array<{
    id: number;
    token: string;
    expires: Date;
    created: Date;
    createdByIp?: string;
    revoked?: Date;
    revokedByIp?: string;
    replacedByToken?: string;
    userId: number;
    isExpired: boolean;
    isRevoked: boolean;
    isActive: boolean;
  }>;
  notes?: Array<{
    id: number;
    title: string;
    content: string;
    date: Date;
    color: string;
    isDisplayed: boolean;
    isPinned?: boolean;
    position: { x: number; y: number };
    isTaskMode?: boolean;
    userId: number;
    tagIds: number[];
  }>;
  
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}
