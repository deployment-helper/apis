export enum ServerNames {
  'docs.google.com' = 'google-docs',
  'localhost:3000' = 'slides',
  'webapps-psi.vercel.app' = 'slides',
}

export interface IGeneratedVideoInfo {
  cloudFile: string;
  version: string;
}

export enum ELanguage {
  Hindi = 'hi-IN',
  English = 'en-US',
}

export interface IVideo {
  id: string;
  name: string;
  description?: string;
  audioLanguage?: ELanguage;
  createdAt: string;
  updatedAt: string;
  userId: string;
  scenesId: string;
  generatedVideoInfo?: IGeneratedVideoInfo[];
}

export interface IScene {
  videoId: string;
  scenes: any[];
}
