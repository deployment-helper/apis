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
import { S3Service } from '@app/shared/aws/s3.service';

@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(
    private serv: AuthService,
    private userEntity: UserEntity,
    private s3: S3Service,
  ) {}

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

  @Get('downloadS3ObjUrl')
  @UseGuards(AuthGuard)
  async downloadS3ObjUrl(@Query('key') key: string): Promise<{ url: string }> {
    return { url: await this.s3.getSignedUrlForDownload(key) };
  }

  @Get('uploadS3ObjUrl')
  @UseGuards(AuthGuard)
  async uploadS3ObjUrl(
    @Query('key') key: string,
    @Query('public') isPublic: boolean,
  ): Promise<{ url: string; publicUrl: string }> {
    let publicUrl = '';

    if (isPublic) {
      publicUrl = this.s3.getPublicUrl(key);
    }

    return {
      url: await this.s3.getSignedUrl(key),
      publicUrl: publicUrl,
    };
  }
}
