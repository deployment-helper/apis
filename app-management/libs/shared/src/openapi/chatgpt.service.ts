import { Injectable, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';
import { ELanguage } from '@app/shared/types';

@Injectable()
export class ChatgptService {
  openapi: OpenAI;
  logger = new Logger(ChatgptService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
    this.openapi = new OpenAI({
      apiKey,
    });
  }

  async translateText(
    text: string,
    language: ELanguage,
    targetLanguage: ELanguage,
  ): Promise<string> {
    const prompt = `Translate the following ${language} text to ${targetLanguage} language and use ${targetLanguage} fonts, use common ${targetLanguage} language words and casual tone, use English language for acronym, use english for common words in ${targetLanguage} language, return only translated text "${text}"`;

    return await this.sentPrompt(prompt);
  }

  async sentPrompt(text: string): Promise<string> {
    this.logger.log(`Sending prompt to OpenAI: ${text}`);
    const completion = await this.openapi.chat.completions.create({
      // model: 'gpt-3.5-turbo',
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: text,
        },
      ],
    });

    return completion.choices[0].message.content;
  }
}
