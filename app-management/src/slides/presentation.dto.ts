import { Presentation, Slide } from 'src/types';

export class PresentationDto implements Presentation {
  titleEn: string;
  titleHi?: string;
  slides: Array<Slide>;
  descEn: string;
  descHi?: string;
  projectId?: string;
  presentationId?: string;
}

export default PresentationDto;
