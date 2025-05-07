import { ELanguage } from '@app/shared/types';
import { ProjectModel } from './models/user.model';

export interface User {
  name: string;
  email: string;
  image: string;
}

export enum ProjectTypes {
  slideProjects = 'slideProjects',
}

// New enum for video statuses
export enum VideoStatus {
  IN_PROGRESS = 'in_progress',
  PUBLISHED = 'published',
  ERROR = 'error',
}

export interface IProject {
  id: string;
  projectName: string;
  userId: string;
  assets: string[];
  defaultLayout?: string;
  defaultLanguage?: string;
  defaultVoice?: string;
  defaultBackgroundMusic?: string;
  defaultOverlay?: string;
  defaultMp3SpeakingRate?: number;
  sceneRandomAsset?: boolean;
}

export interface IUser {
  email: string;
  updatedAt: Date;
  userId: string;
  name?: string;
  createdAt?: Date;
}

export type IUserWithProjectTypes = {
  [key in ProjectTypes]: Array<ProjectModel>;
} & IUser;

export interface IPresentation {
  id: string;
  isAudioGenerated?: boolean;
  isVideoGenerated?: boolean;
  isVideoProcessed?: boolean;
  isAudioMerged?: boolean;
  s3AudioMergedFile?: string;
  s3VideoFile?: string;
  s3ProcessedFile?: string;
  userId: string;
  name: string;
  projectId: string;
  s3File: string;
  s3MetaFile: string;
  updatedAt?: number;
  createdAt: Date;
}

export interface IVideo {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  userId: string;
  isDeleted: boolean;
  defaultAsset?: string;
  backgroundMusic?: string;
  audioLanguage?: ELanguage;
  voiceCode?: string;
  visualPrompt?: string; // Visual prompt for AI-powered image generation
  scenesId?: string;
status?: VideoStatus; // Track video processing status
}

interface exoportDefault {
  Presentation: IPresentation;
  Project: IProject;
  ProjectTypes: ProjectTypes;
}

export default exoportDefault;
