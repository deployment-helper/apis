export interface IBasePresentation {
  projectId: string;
  pid: string;
  updatedAt: number;
}

export interface IPresentationDto extends IBasePresentation {
  url: string;
  totalDur: number;
}

export interface IMp3GeneratorDto extends IBasePresentation {
  s3File: string;
  s3VideoMetaData: string;
}

export enum EWorkerVersion {
  V1 = 'v1',
  V2 = 'v2',
}

export interface IGenerateVideoDto {
  url: string;
  version: EWorkerVersion;
  speakerRefFile?: string | null;
  videoId: string;
}
