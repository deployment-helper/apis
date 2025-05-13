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
   * Video type to create (required)
   * message - for a message a video where each scene has a simple text description and title.
   * mcq - for a multiple-choice question video where each scene has a question and options and multiple scenes will be created for the single question.
   */
  videoType: 'message' | 'mcq';

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
   * Visual prompt for AI-powered image generation (optional)
   */
  visualPrompt?: string;

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
  raw?: Array<any>;
}
