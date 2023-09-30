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
}
