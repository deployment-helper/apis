import { AppService } from '@apps/app-management/app.service';
import { Controller, Get } from '@nestjs/common';

@Controller()
export class BatchServerController {
  constructor(private readonly service: AppService) {}

  @Get()
  getHello(): string {
    return this.service.getHello();
  }
}
