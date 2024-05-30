import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { ELanguage } from '@app/shared/types';

@Injectable()
export class GeminiService {
  genAi: GoogleGenerativeAI;
  model: GenerativeModel;

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
    const prompt = `Translate the following ${language} text to ${tagetLanguage} language and use ${tagetLanguage} fonts, use common ${tagetLanguage} language words and professional tone, use english for common words in ${tagetLanguage} language, return only translated text "${text}"`;
    return await this.prompt(prompt);
  }

  async prompt(text: string): Promise<string> {
    const result = await this.model.generateContent(text);
    const response = result.response;
    return response.text();
  }
}
