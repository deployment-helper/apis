import { ProjectModel } from './models/user.model';

export interface Option {
  en: string;
  hi?: string;
  isRight?: boolean;
  audioDurEn?: number;
  audioDurHi?: number;
}

export interface Slide {
  questionEn: string;
  questionHi?: string;
  audioDurEn?: number;
  audioDurHi?: number;
  rightAnswer: Option;
  explanationEn: string;
  explanationHi?: string;
  audioDurExplanationEn?: number;
  audioDurExplanationHi?: number;
  options: Array<Option>;
}

export interface Presentation {
  titleEn: string;
  titleHi?: string;
  slides: Array<Slide>;
  descEn: string;
  descHi?: string;
  audioDurTitleEn?: number;
  audioDurTitleHi?: number;
  audioDurDescEn?: number;
  audioDurDescHi?: number;
  projectId?: string;
  presentationId?: string;
}

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
}

export interface IUser {
  email: string;
  updated_at: Date;
  userId: string;
  name?: string;
}

export type IUserWithProjectTypes = {
  [key in ProjectTypes]: Array<ProjectModel>;
} & IUser;

interface exoportDefault {
  Presentation: Presentation;
  Slide: Slide;
  Option: Option;
  Project: IProject;
  ProjectTypes: ProjectTypes;
}

export default exoportDefault;
