import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { ELanguage } from '@app/shared/types';

@Injectable()
export class GeminiService {
  genAi: GoogleGenerativeAI;
  model: GenerativeModel;
  logger = new Logger(GeminiService.name);

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
    this.genAi = new GoogleGenerativeAI(apiKey);
    this.model = this.genAi.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });
  }

  async translateText(
    text: string,
    language: ELanguage,
    tagetLanguage: ELanguage,
  ): Promise<string> {
    // TODO: make those prompts user configurable
    const prompt = `Translate the following ${language} text to ${tagetLanguage} language and use ${tagetLanguage} fonts, use common ${tagetLanguage} language words and professional tone, in ${tagetLanguage} language, Do not translate nouns, like name and persons etc. do not respond with Markdown format, return only translated text "${text}"`;
    this.logger.log(prompt);
    try {
      return await this.prompt(prompt);
    } catch (e) {
      this.logger.error(e);
      return text;
    }
  }

  async prompt(text: string): Promise<string> {
    const result = await this.model.generateContent(text);
    const response = result.response;
    return response.text();
  }

  async translateScenes(
    scenes: any[],
    language: ELanguage,
    targetLanguage: ELanguage,
  ): Promise<any[]> {
    const translatedScenes = await Promise.all(
      scenes.map(async (scene) => {
        const translatedScene = await this.translateText(
          scene.description || '',
          language,
          targetLanguage,
        );
        return { ...scene, description: translatedScene };
      }),
    );

    return translatedScenes;
  }
}
