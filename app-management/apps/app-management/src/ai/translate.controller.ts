import { Body, Controller, Post } from '@nestjs/common';
import { TranslateService } from '@app/shared/gcp/translate.service';

@Controller('ai/translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Post()
  async translate(@Body() body: { text: string; language: string }) {
    const { text, language } = body;
    const translatedText = await this.translateService.translateText(
      text,
      'en',
      language,
    );
    return { translatedText };
  }
}
