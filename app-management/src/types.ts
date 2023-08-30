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

interface exoportDefault {
  Presentation: Presentation;
  Slide: Slide;
  Option: Option;
}

export default exoportDefault;
