import { Injectable } from '@nestjs/common';
import { v2 } from '@google-cloud/translate';

// https://cloud.google.com/translate/docs/basic/translate-text-basic?_gl=1*1uw5uln*_up*MQ..&gclid=8ee20d35921d162f0ffa6b15b460ad0c&gclsrc=3p.ds

/**
 * @Deprecated
 * We are using Gemini based translation service
 */
@Injectable()
export class TranslateService {
  private client: v2.Translate;

  constructor() {
    this.client = new v2.Translate();
  }

  async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<string> {
    const [translation] = await this.client.translate(text, {
      from: sourceLanguage,
      to: targetLanguage,
    });
    return translation;
  }

  // translate scenes array
  clearLanguagePostFix(text = '') {
    return text.replace(/-.*$/, '');
  }

  async translateScenes(
    scenes: any[],
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<any[]> {
    const translatedScenes = await Promise.all(
      scenes.map(async (scene) => {
        const translatedScene = await this.translateText(
          scene.description || '',
          this.clearLanguagePostFix(sourceLanguage),
          this.clearLanguagePostFix(targetLanguage),
        );
        return { ...scene, description: translatedScene };
      }),
    );

    return translatedScenes;
  }
}
