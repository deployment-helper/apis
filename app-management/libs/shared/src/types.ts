import { FOLDER_GROUPS } from '@app/shared/constants';

export enum ServerNames {
  'docs.google.com' = 'google-docs',
  'localhost:3000' = 'slides',
  'webapps-psi.vercel.app' = 'slides',
  // This temporary server name and used to work with apis calls of the application
  'apis.app-management.com' = 'apis.app-management',
}

export interface IGeneratedVideoInfo {
  cloudFile: string;
  version: string;
}

export enum ELanguage {
  'Afrikaans (South Africa)' = 'af-ZA',
  'Arabic' = 'ar-XA',
  'Basque (Spain)' = 'eu-ES',
  'Bengali (India)' = 'bn-IN',
  'Bulgarian (Bulgaria)' = 'bg-BG',
  'Catalan (Spain)' = 'ca-ES',
  'Chinese (Hong Kong)' = 'yue-HK',
  'Czech (Czech Republic)' = 'cs-CZ',
  'Danish (Denmark)' = 'da-DK',
  'Dutch (Belgium)' = 'nl-BE',
  'Dutch (Netherlands)' = 'nl-NL',
  'English (Australia)' = 'en-AU',
  'English (India)' = 'en-IN',
  'English (UK)' = 'en-GB',
  'English (US)' = 'en-US',
  'Filipino (Philippines)' = 'fil-PH',
  'Finnish (Finland)' = 'fi-FI',
  'French (Canada)' = 'fr-CA',
  'French (France)' = 'fr-FR',
  'German (Germany)' = 'de-DE',
  'Greek (Greece)' = 'el-GR',
  'Gujarati (India)' = 'gu-IN',
  'Hebrew (Israel)' = 'he-IL',
  'Hindi (India)' = 'hi-IN',
  'Hungarian (Hungary)' = 'hu-HU',
  'Icelandic (Iceland)' = 'is-IS',
  'Indonesian (Indonesia)' = 'id-ID',
  'Italian (Italy)' = 'it-IT',
  'Japanese (Japan)' = 'ja-JP',
  'Kannada (India)' = 'kn-IN',
  'Korean (South Korea)' = 'ko-KR',
  'Latvian (Latvia)' = 'lv-LV',
  'Lithuanian (Lithuania)' = 'lt-LT',
  'Malay (Malaysia)' = 'ms-MY',
  'Malayalam (India)' = 'ml-IN',
  'Mandarin Chinese (Taiwan)' = 'cmn-TW',
  'Marathi (India)' = 'mr-IN',
  'Norwegian (Norway)' = 'nb-NO',
  'Polish (Poland)' = 'pl-PL',
  'Portuguese (Brazil)' = 'pt-BR',
  'Portuguese (Portugal)' = 'pt-PT',
  'Punjabi (India)' = 'pa-IN',
  'Romanian (Romania)' = 'ro-RO',
  'Russian (Russia)' = 'ru-RU',
  'Serbian (Cyrillic)' = 'sr-RS',
  'Slovak (Slovakia)' = 'sk-SK',
  'Spanish (Spain)' = 'es-ES',
  'Spanish (US)' = 'es-US',
  'Swedish (Sweden)' = 'sv-SE',
  'Tamil (India)' = 'ta-IN',
  'Telugu (India)' = 'te-IN',
  'Thai (Thailand)' = 'th-TH',
  'Turkish (Turkey)' = 'tr-TR',
  'Ukrainian (Ukraine)' = 'uk-UA',
  'Vietnamese (Vietnam)' = 'vi-VN',
}

export interface IVideo {
  id: string;
  name: string;
  description?: string;
  audioLanguage?: ELanguage;
  voiceCode?: string;
  backgroundMusic?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  scenesId: string;
  projectId: string;
  generatedVideoInfo?: IGeneratedVideoInfo[];
  artifacts?: string[];
}

export interface IScene {
  createdAt: string;
  updatedAt: string;
  id: string;
  description: string;
  layoutId: string;
  image: string;
  content: Record<string, any>;
}

export interface IScenes {
  createdAt: string;
  scenes: IScene[];
  updatedAt: string;
  videoId: string;
}

export type T_FOLDER_GROUPS = (typeof FOLDER_GROUPS)[number];
export type BodyCopyTypes = 'title' | 'subtitle';

export interface IBodyCopyDrawText {
  text: string;
  type: BodyCopyTypes;
}
