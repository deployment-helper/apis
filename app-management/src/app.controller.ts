import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './services/app.service';
import { ConfigService } from '@nestjs/config';
import { PermissionEntity } from './entities/permission.entity';
import { PermissionService } from './services/permission.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,private permServ:PermissionService) {}

  @Get('/health')
  getHealth(): string {
    return this.appService.getHealth();
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/project')
  createProject(): string {
    const permission = new PermissionEntity();
    permission.userId = "123456789";
    permission.permission = 'create_project';
    this.permServ.create(permission); 
    return permission.userId;

  }

}
