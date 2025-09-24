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
    uuid: string;
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
    uuid: string;
    title: string;
    content: string;
    date: Date;
    color: string;
    isDisplayed: boolean;
    isPinned?: boolean;
    position: { x: number; y: number };
    isTaskMode?: boolean;
    userId: number;
    tags: Array<{
      uuid: string;
      name: string;
      userId: number | null;
      usageCount: number;
    }>;
  }>;
  
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}
