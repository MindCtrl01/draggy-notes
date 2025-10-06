import { BaseEntity } from './base-entity';

export enum GroupRole {
  Owner = 1,
  Admin = 2,
  Member = 3,
  ReadOnly = 4
}

export interface NoteGroup extends BaseEntity {
  uuid: string;
  name: string;
  description?: string;
  shareToken: string;
  shareUrl: string;
  createdBy: number; // User ID who created the group
  expiresAt: Date;
  isExpired: boolean;
}

export interface NoteGroupMember extends BaseEntity {
  groupId: number;
  userId: number;
  role: GroupRole;
  joinedAt: Date;
  isOnline: boolean;
}

// API Response models
export interface GroupResponse {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  shareToken: string;
  shareUrl: string;
  userRole: GroupRole;
  members: GroupMemberResponse[];
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
  createdBy: GroupOwnerResponse;
}

export interface GroupMemberResponse {
  userId: number;
  username: string;
  displayName?: string;
  photoUrl?: string;
  role: GroupRole;
  joinedAt: string;
  isOnline: boolean;
}

export interface GroupOwnerResponse {
  id: number;
  username: string;
  displayName?: string;
  photoUrl?: string;
}

// Request models
export interface CreateGroupRequest {
  name: string;
  description?: string;
  expirationDays?: number;
}

export interface JoinGroupRequest {
  shareToken: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  expirationDays?: number;
}

export interface UpdateMemberRoleRequest {
  userId: number;
  role: GroupRole;
}

// Permission checking helpers
export function canUserEditNote(note: { userId: number; noteGroupId?: number }, userRole: GroupRole, currentUserId: number): boolean {
  // Own notes can always be edited by the creator
  if (note.userId === currentUserId) return true;
  
  // Group notes require appropriate role
  if (note.noteGroupId) {
    return userRole !== GroupRole.ReadOnly;
  }
  
  return false;
}

export function canUserDeleteNote(note: { userId: number; noteGroupId?: number }, userRole: GroupRole, currentUserId: number): boolean {
  // Own notes can always be deleted
  if (note.userId === currentUserId) return true;
  
  // Group notes can only be deleted by owners/admins
  if (note.noteGroupId) {
    return userRole === GroupRole.Owner || userRole === GroupRole.Admin;
  }
  
  return false;
}

export function canUserManageMembers(userRole: GroupRole): boolean {
  return userRole === GroupRole.Owner || userRole === GroupRole.Admin;
}

export function canUserManageGroup(userRole: GroupRole): boolean {
  return userRole === GroupRole.Owner;
}
