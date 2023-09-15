import { IPresentation } from 'src/types';

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
  updatedAt: Date;
  userId: string;
}

export default PresentationCreateDto;
