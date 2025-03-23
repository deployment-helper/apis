import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { fetchImageLinks } from '@app/shared/fetchImageLinks';
import { ChatgptService } from '@app/shared/openapi/chatgpt.service';
import { AuthGuard } from '@apps/app-management/auth/auth.guard';

@Controller('ai/images/')
export class ImageGenerationController {
  constructor(private readonly chatgptService: ChatgptService) {}

  logger = new Logger(ImageGenerationController.name);

  @Get('/health')
  healthCheck(): string {
    return 'OK';
  }

  @UseGuards(AuthGuard)
  @Post('scene-images')
  async sceneDescToVisualDesc(
    @Body()
    body: {
      sceneDesc: string;
      visualDesc?: string;
    },
  ): Promise<{ visualDesc: string; links: string[] }> {
    let visualDesc = body.visualDesc;
    if (visualDesc?.length === 0) {
      visualDesc = await this.chatgptService.sceneDescToVisualDesc(
        body.sceneDesc,
      );
      visualDesc = `${visualDesc} 16:9 aspect ratio`;
    }

    this.logger.log(`Visual description: ${visualDesc}`);
    const links = await fetchImageLinks(visualDesc);
    return {
      visualDesc: `${visualDesc}`,
      links,
    };
  }
}
