/**
 * Data Transfer Objects for Project operations
 */

/**
 * DTO for creating a new project
 * Contains mandatory fields for project creation
 */
export class CreateProjectDto {
  /**
   * Name of the project (mandatory)
   */
  projectName: string;

  /**
   * Description of the project (mandatory)
   */
  projectDesc: string;
}

/**
 * DTO for updating an existing project
 * All fields are optional since partial updates are allowed
 */
export class UpdateProjectDto {
  /**
   * Name of the project (optional for updates)
   */
  projectName?: string;

  /**
   * Description of the project (optional for updates)
   */
  projectDesc?: string;

  /**
   * Branch name for CI/CD
   */
  CIBranchName?: string;

  /**
   * Array of media asset URLs
   */
  assets?: string[];

  /**
   * Default background music URL
   */
  defaultBackgroundMusic?: string;

  /**
   * Default language for voice synthesis
   */
  defaultLanguage?: string;

  /**
   * Default layout template
   */
  defaultLayout?: string;

  /**
   * Default speaking rate for MP3
   */
  defaultMp3SpeakingRate?: number;

  /**
   * Default voice for text-to-speech
   */
  defaultVoice?: string;

  /**
   * Effect for merging scenes
   */
  mergeEffect?: string;

  /**
   * URL for silent audio to append at the end
   */
  postFixSilence?: string;

  /**
   * URL for silent audio to prepend at the beginning
   */
  preFixSilence?: string;

  /**
   * Whether to use random assets for scenes
   */
  sceneRandomAsset?: boolean;

  /**
   * Whether to include subtitles in video
   */
  videoSubtitles?: boolean;

  /**
   * Whether to use default settings for video generation
   */
  videoWithDefaultSettings?: boolean;
}

/**
 * DTO for project responses
 * Contains all fields from the Firestore document
 */
export class ProjectResponseDto {
  /**
   * Unique identifier for the project
   */
  id: string;

  /**
   * Name of the project
   */
  projectName: string;

  /**
   * Description of the project
   */
  projectDesc: string;

  /**
   * Owner user ID
   */
  userId: string;

  /**
   * Branch name for CI/CD
   */
  CIBranchName?: string;

  /**
   * Array of media asset URLs
   */
  assets?: string[];

  /**
   * Timestamp when the project was created
   */
  createdAt: string;

  /**
   * Default background music URL
   */
  defaultBackgroundMusic?: string;

  /**
   * Default language for voice synthesis
   */
  defaultLanguage?: string;

  /**
   * Default layout template
   */
  defaultLayout?: string;

  /**
   * Default speaking rate for MP3
   */
  defaultMp3SpeakingRate?: number;

  /**
   * Default voice for text-to-speech
   */
  defaultVoice?: string;

  /**
   * Effect for merging scenes
   */
  mergeEffect?: string;

  /**
   * URL for silent audio to append at the end
   */
  postFixSilence?: string;

  /**
   * URL for silent audio to prepend at the beginning
   */
  preFixSilence?: string;

  /**
   * Whether to use random assets for scenes
   */
  sceneRandomAsset?: boolean;

  /**
   * Timestamp when the project was last updated
   */
  updatedAt: string;

  /**
   * Whether to include subtitles in video
   */
  videoSubtitles?: boolean;

  /**
   * Whether to use default settings for video generation
   */
  videoWithDefaultSettings?: boolean;
}
