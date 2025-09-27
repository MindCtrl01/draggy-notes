import { Tag } from '@/domains/tag';
import { TagResponse, TopTagResponse, CreateTagRequest, UpdateTagRequest } from '../models/tags.model';

/**
 * Transform TagResponse from API to Tag domain model
 */
export function transformTagResponseToTag(response: TagResponse): Tag {
  return {
    id: response.id,
    uuid: response.uuid,
    name: response.name,
    userId: response.userId,
    usageCount: response.usageCount,
    isPreDefined: response.isPreDefined,
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.updatedAt),
  };
}

/**
 * Transform TopTagResponse from API to Tag domain model
 */
export function transformTopTagResponseToTag(response: TopTagResponse): Tag {
  return {
    id: response.id,
    uuid: `predefined-${response.id}`, // Generate UUID for predefined tags
    name: response.name,
    userId: response.isPreDefined ? null : response.id, // Predefined tags have null userId
    usageCount: response.usageCount,
    isPreDefined: response.isPreDefined,
    createdAt: new Date(), // Default date for predefined tags
    updatedAt: new Date(), // Default date for predefined tags
  };
}

/**
 * Transform Tag domain model to CreateTagRequest for API
 */
export function transformTagToCreateRequest(tag: Tag): CreateTagRequest {
  return {
    name: tag.name,
    userId: tag.userId || undefined,
  };
}

/**
 * Transform Tag domain model to UpdateTagRequest for API
 */
export function transformTagToUpdateRequest(tag: Tag): UpdateTagRequest {
  return {
    id: tag.id,
    name: tag.name,
  };
}

/**
 * Transform array of TagResponse to array of Tag domain models
 */
export function transformTagResponseArrayToTags(responses: TagResponse[]): Tag[] {
  return responses.map(transformTagResponseToTag);
}

/**
 * Transform array of TopTagResponse to array of Tag domain models
 */
export function transformTopTagResponseArrayToTags(responses: TopTagResponse[]): Tag[] {
  return responses.map(transformTopTagResponseToTag);
}
