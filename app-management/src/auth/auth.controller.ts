import { Body, Controller, Get, Post, Query, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpExceptionFilter } from 'src/http-exception.filter';

@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private serv: AuthService) {}

  @Get('create-token')
  createToken(@Query('code') code): Promise<any> {
    return this.serv.createToken(code);
  }

  @Post('create-token')
  createRefreshToken(@Body('refresh_token') refreshToken) {
    return this.serv.refreshToken(refreshToken);
  }
}
