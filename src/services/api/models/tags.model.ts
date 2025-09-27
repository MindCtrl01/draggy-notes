// Tag Request Models
export interface CreateTagRequest {
  name: string;
  userId?: number;
}

export interface UpdateTagRequest {
  id: number;
  name: string;
}

export interface DeleteTagRequest {
  id: number;
}

// Tag Response Models
export interface TagResponse {
  id: number;
  uuid: string;
  name: string;
  userId: number | null;
  usageCount: number;
  isPreDefined: boolean;
  createdAt: string; // ISO date string format
  updatedAt: string; // ISO date string format
}

// Top Tags Response Model (simplified for /api/tags/top endpoint)
export interface TopTagResponse {
  id: number;
  name: string;
  usageCount: number;
  isPreDefined: boolean;
}

// Tag Settings Configuration
export interface TagSettings {
  predefinedTags: string[];
  maxUserTagsCount: number;
}
