import { ELanguage } from '@app/shared/types';

/**
 * DTO for creating a video with scenes in one request
 */
export class CreateVideoWithScenesDto {
  /**
   * Name of the video (required)
   */
  name: string;

  /**
   * Description of the video (optional)
   */
  description?: string;

  /**
   * Project ID to associate the video with (required)
   */
  projectId: string;

  /**
   * Language for audio generation (optional)
   */
  audioLanguage?: ELanguage;

  /**
   * Voice code to use for text-to-speech (optional)
   */
  voiceCode?: string;

  /**
   * Background music URL (optional)
   */
  backgroundMusic?: string;

  /**
   * Default asset to use for scenes (optional)
   */
  defaultAsset?: string;

  /**
   * Custom properties as key-value pairs (optional)
   */
  properties?: string;

  /**
   * Layout ID to apply to all scenes (required when scene descriptions are provided)
   */
  layoutId?: string;

  /**
   * Default content structure for scenes (optional)
   * Will be populated based on the layout if not provided
   */
  sceneContent?: Record<string, any>;

  /**
   * Array of scene descriptions, one per scene (optional)
   * Each description will be used to create a separate scene
   */
  sceneDescriptions?: string[];
}
