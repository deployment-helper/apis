import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ELanguage } from '@app/shared/types';

// Define the map
export const languageFontMap: Record<ELanguage, string> = {
  [ELanguage['Afrikaans (South Africa)']]: 'Roboto-Regular.ttf',
  [ELanguage.Arabic]: 'Amiri-Regular.ttf',
  [ELanguage['Basque (Spain)']]: 'Roboto-Regular.ttf',
  [ELanguage['Bengali (India)']]: 'HindSiliguri-Regular.ttf',
  [ELanguage['Bulgarian (Bulgaria)']]: 'Roboto-Regular.ttf',
  [ELanguage['Catalan (Spain)']]: 'Roboto-Regular.ttf',
  [ELanguage['Chinese (Hong Kong)']]: 'NotoSansHK-Regular.ttf',
  [ELanguage['Czech (Czech Republic)']]: 'Roboto-Regular.ttf',
  [ELanguage['Danish (Denmark)']]: 'Roboto-Regular.ttf',
  [ELanguage['Dutch (Belgium)']]: 'Roboto-Regular.ttf',
  [ELanguage['Dutch (Netherlands)']]: 'Roboto-Regular.ttf',
  [ELanguage['English (Australia)']]: 'Roboto-Regular.ttf',
  [ELanguage['English (India)']]: 'Roboto-Regular.ttf',
  [ELanguage['English (UK)']]: 'Roboto-Regular.ttf',
  [ELanguage['English (US)']]: 'Roboto-Regular.ttf',
  [ELanguage['Filipino (Philippines)']]: 'Roboto-Regular.ttf',
  [ELanguage['Finnish (Finland)']]: 'Roboto-Regular.ttf',
  [ELanguage['French (Canada)']]: 'Roboto-Regular.ttf',
  [ELanguage['French (France)']]: 'Roboto-Regular.ttf',
  [ELanguage['German (Germany)']]: 'Roboto-Regular.ttf',
  [ELanguage['Greek (Greece)']]: 'Roboto-Regular.ttf',
  [ELanguage['Gujarati (India)']]: 'NotoSansGujarati-Regular.ttf',
  [ELanguage['Hebrew (Israel)']]: 'Rubik-Regular.ttf',
  [ELanguage['Hindi (India)']]: 'NotoSansDevanagari-Regular.ttf',
  [ELanguage['Hungarian (Hungary)']]: 'Roboto-Regular.ttf',
  [ELanguage['Icelandic (Iceland)']]: 'Roboto-Regular.ttf',
  [ELanguage['Indonesian (Indonesia)']]: 'Roboto-Regular.ttf',
  [ELanguage['Italian (Italy)']]: 'Roboto-Regular.ttf',
  [ELanguage['Japanese (Japan)']]: 'NotoSansJP-Regular.ttf',
  [ELanguage['Kannada (India)']]: 'NotoSansKannada-Regular.ttf',
  [ELanguage['Korean (South Korea)']]: 'NotoSansKR-Regular.ttf',
  [ELanguage['Latvian (Latvia)']]: 'Roboto-Regular.ttf',
  [ELanguage['Lithuanian (Lithuania)']]: 'Roboto-Regular.ttf',
  [ELanguage['Malay (Malaysia)']]: 'Roboto-Regular.ttf',
  [ELanguage['Malayalam (India)']]: 'NotoSansMalayalam-Regular.ttf',
  [ELanguage['Mandarin Chinese (Taiwan)']]: 'NotoSansTC-Regular.ttf',
  [ELanguage['Marathi (India)']]: 'TiroDevanagariMarathi-Regular.ttf',
  [ELanguage['Norwegian (Norway)']]: 'Roboto-Regular.ttf',
  [ELanguage['Polish (Poland)']]: 'Roboto-Regular.ttf',
  [ELanguage['Portuguese (Brazil)']]: 'Roboto-Regular.ttf',
  [ELanguage['Portuguese (Portugal)']]: 'Roboto-Regular.ttf',
  [ELanguage['Punjabi (India)']]: 'NotoSansGurmukhi-Regular.ttf',
  [ELanguage['Romanian (Romania)']]: 'Roboto-Regular.ttf',
  [ELanguage['Russian (Russia)']]: 'Roboto-Regular.ttf',
  [ELanguage['Serbian (Cyrillic)']]: 'Roboto-Regular.ttf',
  [ELanguage['Slovak (Slovakia)']]: 'Roboto-Regular.ttf',
  [ELanguage['Spanish (Spain)']]: 'Roboto-Regular.ttf',
  [ELanguage['Spanish (US)']]: 'Roboto-Regular.ttf',
  [ELanguage['Swedish (Sweden)']]: 'Roboto-Regular.ttf',
  [ELanguage['Tamil (India)']]: 'NotoSansTamil-Regular.ttf',
  [ELanguage['Telugu (India)']]: 'NotoSansTelugu-Regular.ttf',
  [ELanguage['Thai (Thailand)']]: 'NotoSansThai-Regular.ttf',
  [ELanguage['Turkish (Turkey)']]: 'Roboto-Regular.ttf',
  [ELanguage['Ukrainian (Ukraine)']]: 'Roboto-Regular.ttf',
  [ELanguage['Vietnamese (Vietnam)']]: 'Roboto-Regular.ttf',
};

@Injectable()
export class FontsService {
  fontPath: string;

  constructor(private readonly configService: ConfigService) {
    this.fontPath = configService.getOrThrow('FONT_DIR');
  }

  getFontFilePath(lang: ELanguage): string {
    return `${this.fontPath}/${languageFontMap[lang]}`;
  }
}
