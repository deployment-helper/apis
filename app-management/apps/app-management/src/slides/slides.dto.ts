import { IPresentation } from '@apps/app-management/types';

export class PresentationCreateDto {
  file: any;
  name: string;
  projectId: string;
}

export class PresentationUpdateDto implements IPresentation {
  createdAt: Date;
  id: string;
  name: string;
  projectId: string;
  s3File: string;
  s3MetaFile: string;
  updatedAt: number;
  userId: string;
}

export interface IVideoMetaData {
  data: any;
  id: string;
}

export default PresentationCreateDto;
