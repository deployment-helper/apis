import {
  Body,
  Controller,
  Get,
  Headers,
  Query,
  UseFilters,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpExceptionFilter } from 'src/http-exception.filter';

@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private serv: AuthService) {}

  @Get('createToken')
  createTokenByCode(@Query('code') code): Promise<any> {
    return this.serv.createToken(code);
  }

  @Get('refreshToken')
  createTokenByRefreshToken(@Body('refresh_token') refreshToken): Promise<any> {
    return this.serv.refreshToken(refreshToken);
  }

  @Get('me')
  getUserInfo(@Headers('Authorization') accessToken): Promise<any> {
    return this.serv.getUserInfo(accessToken);
  }

  @Get('revoke')
  revokeToken(@Body('refresh_token') refreshToken): Promise<any> {
    return this.serv.revokeToken(refreshToken.trim());
  }

  @Get('validateToken')
  validateToken(@Headers('Authorization') accessToken): Promise<any> {
    return this.serv.validateToken(accessToken);
  }
}
