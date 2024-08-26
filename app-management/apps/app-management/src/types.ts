import { ProjectModel } from './models/user.model';

export interface User {
  name: string;
  email: string;
  image: string;
}

export enum ProjectTypes {
  slideProjects = 'slideProjects',
}

export interface IProject {
  projectId: string;
  projectName: string;
  userId: string;
  assets: string[];
  defaultLanguage?: string;
  defaultVoice?: string;
  defaultBackgroundMusic?: string;
  defaultOverlay?: string;
  defaultMp3SpeakingRate?: number;
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

interface exoportDefault {
  Presentation: IPresentation;
  Project: IProject;
  ProjectTypes: ProjectTypes;
}

export default exoportDefault;
