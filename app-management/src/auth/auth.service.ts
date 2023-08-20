import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private AWS_COGNITO_POOL_URL: string;
  private GRANT_TYPE: string;
  private REDIRECT_URI: string;
  private CLIENT_ID: string;

  constructor(
    private readonly httpserv: HttpService,
    private readonly configServ: ConfigService,
  ) {
    this.AWS_COGNITO_POOL_URL = configServ.getOrThrow('AWS_COGNITO_POOL_URL');
    this.CLIENT_ID = configServ.getOrThrow('CLIENT_ID');
    this.REDIRECT_URI = configServ.getOrThrow('REDIRECT_URI');
    this.GRANT_TYPE = configServ.getOrThrow('GRANT_TYPE');
  }

  async createToken(code: string): Promise<any> {
    const url = new URL('/oauth2/token', this.AWS_COGNITO_POOL_URL);
    const { data } = await firstValueFrom(
      this.httpserv
        .post(url.href, undefined, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          params: {
            grant_type: this.GRANT_TYPE,
            client_id: this.CLIENT_ID,
            redirect_uri: this.REDIRECT_URI,
            code,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new HttpException(
              'Something went wrong',
              error.response.status,
            );
          }),
        ),
    );

    return data;
  }

  async refreshToken(refreshToken: string): Promise<any> {
    const url = new URL('/oauth2/token', this.AWS_COGNITO_POOL_URL);
    const { data } = await firstValueFrom(
      this.httpserv
        .post(url.href, undefined, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          params: {
            grant_type: 'refresh_token',
            client_id: this.CLIENT_ID,
            refresh_token: refreshToken,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new HttpException('Error', error.response.status);
          }),
        ),
    );

    return data;
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const url = new URL('/oauth2/userInfo', this.AWS_COGNITO_POOL_URL);
    const { data } = await firstValueFrom(
      this.httpserv
        .get(url.href, {
          headers: {
            Authorization: accessToken,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new HttpException('Error', error.response.status);
          }),
        ),
    );

    return data;
  }

  async revokeToken(accessToken: string): Promise<any> {
    const url = new URL('/oauth2/revoke', this.AWS_COGNITO_POOL_URL);

    const { data } = await firstValueFrom(
      this.httpserv
        .post(url.href, undefined, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          params: {
            token: accessToken,
            client_id: this.CLIENT_ID,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            console.log(error);
            throw new HttpException('Error', error.response.status);
          }),
        ),
    );

    return data;
  }
}
