import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './services/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  getHealth(): string {
    return this.appService.getHealth();
  }
}
