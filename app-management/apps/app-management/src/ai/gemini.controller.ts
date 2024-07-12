import { Body, Controller, Logger, Post } from '@nestjs/common';
import { GeminiService } from '@app/shared/gcp/gemini.service';
import { ELanguage } from '@app/shared/types';

@Controller('ai/gemini')
export class GeminiController {
  logger: Logger = new Logger(GeminiController.name);

  constructor(private readonly gemini: GeminiService) {}

  @Post('translate')
  async translateText(
    @Body()
    body: {
      text: string;
      language: ELanguage;
      targetLanguage: ELanguage;
    },
  ): Promise<string> {
    return this.gemini.translateText(
      body.text,
      body.language,
      body.targetLanguage,
    );
  }
}
