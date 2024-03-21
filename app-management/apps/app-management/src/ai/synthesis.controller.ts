import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@apps/app-management/auth/auth.guard';
import { SynthesisService } from '@app/shared/gcp/synthesis.service';

@Controller('ai/synthesis')
@UseGuards(AuthGuard)
export class SynthesisController {
  constructor(private readonly synthesisService: SynthesisService) {}

  @Post()
  async synthesize(@Body() body: { text: string[] }) {
    return this.synthesisService.synthesize(body.text);
  }
}
