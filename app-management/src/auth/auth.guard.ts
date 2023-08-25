import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as jwks from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  private jwksIns: jwks.JwksClient;

  constructor(private readonly configServ: ConfigService) {
    this.jwksIns = new jwks.JwksClient({
      jwksUri: configServ.getOrThrow('AWS_COGNITO_JWKS_URL'),
    });
  }

  getKey(header, callback) {
    this.jwksIns.getSigningKey(header.kid, (err, key) => {
      const signingKey = key.getPublicKey();
      try {
        callback(null, signingKey);
      } catch (e) {
        console.log(e);
      }
    });
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const accessToken = req.headers.authorization;
    const token =
      accessToken && accessToken.split(' ').length >= 2
        ? accessToken.split(' ')[1]
        : accessToken;

    const p = new Promise<boolean>((res, rej) => {
      jwt.verify(token, this.getKey.bind(this), (err, decoded) => {
        if (err) {
          rej(false);
        } else {
          res(true);
        }
      });
    });

    return p;
  }
}
