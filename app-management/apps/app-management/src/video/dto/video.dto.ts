import { ELanguage, IGeneratedVideoInfo } from '@app/shared/types';

/**
 * DTO for creating a new video
 */
export class CreateVideoDto {
  name: string;
  description?: string;
  projectId: string;
  projectName?: string;
  audioLanguage?: ELanguage;
  voiceCode?: string;
  backgroundMusic?: string;
  defaultAsset?: string;
  isPublished?: boolean;
  properties?: string;
}

/**
 * DTO for updating an existing video
 */
export class UpdateVideoDto {
  name?: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  audioLanguage?: ELanguage;
  voiceCode?: string;
  backgroundMusic?: string;
  defaultAsset?: string;
  isPublished?: boolean;
  thumbnailUrl?: string;
}

/**
 * DTO for video generated info
 */
export class GeneratedVideoInfoDto implements IGeneratedVideoInfo {
  cloudFile: string;
  version: string;
  date?: string;
}

/**
 * DTO for artifact operations
 */
export class ArtifactDto {
  name: string;
  s3Key: string;
}

/**
 * DTO for deleting an artifact
 */
export class DeleteArtifactDto {
  s3Key: string;
  dbKey: string;
  keyToCompare: string;
}

/**
 * DTO for YouTube upload operations
 */
export class YoutubeUploadDto {
  branch: string;
  title: string;
  desc: string;
}
