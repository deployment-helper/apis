import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { ChatgptService } from '@app/shared/openapi/chatgpt.service';
import { ELanguage } from '@app/shared/types';
import { AuthGuard } from '@apps/app-management/auth/auth.guard';
import { fetchImageLinks } from '@app/shared/fetchImageLinks';

@Controller('ai/chatgpt')
@UseGuards(AuthGuard)
export class ChatgptController {
  constructor(private readonly chatgptService: ChatgptService) {}

  logger = new Logger(ChatgptController.name);

  @Post('translate')
  async translateText(
    @Body()
    body: {
      text: string;
      language: ELanguage;
      targetLanguage: ELanguage;
    },
  ): Promise<string> {
    return this.chatgptService.translateText(
      body.text,
      body.language,
      body.targetLanguage,
    );
  }

  @Post('scene-images')
  async sceneDescToVisualDesc(
    @Body()
    body: {
      sceneDesc: string;
    },
  ): Promise<string[]> {
    const visualDesc = await this.chatgptService.sceneDescToVisualDesc(
      body.sceneDesc,
    );
    this.logger.log(`Visual description: ${visualDesc}`);
    return fetchImageLinks(`${visualDesc} 16:9 aspect ratio`);
  }
}
