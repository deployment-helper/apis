import {
  Body,
  Controller,
  Get,
  Headers,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpExceptionFilter } from '@apps/app-management/http-exception.filter';
import { AuthGuard } from './auth.guard';
import { UserEntity } from '@apps/app-management/aws/user.entity';

@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private serv: AuthService, private userEntity: UserEntity) {}

  @Get('createToken')
  createTokenByCode(@Query('code') code): Promise<any> {
    return this.serv.createToken(code);
  }

  @Get('refreshToken')
  createTokenByRefreshToken(
    @Query('refresh_token') refreshToken,
  ): Promise<any> {
    return this.serv.refreshToken(refreshToken);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getUserInfo(@Headers('Authorization') accessToken): Promise<any> {
    const user = await this.serv.getUserInfo(accessToken);

    const dbUser: any = await this.userEntity.get(user.email);

    return dbUser?.Item;
  }

  @Get('revoke')
  revokeToken(@Body('refresh_token') refreshToken): Promise<any> {
    return this.serv.revokeToken(refreshToken.trim());
  }

  @Get('validateToken')
  @UseGuards(AuthGuard)
  validateToken(@Headers('Authorization') accessToken): Promise<any> {
    return this.serv.validateToken(accessToken);
  }
}
