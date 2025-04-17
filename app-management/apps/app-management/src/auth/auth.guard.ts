import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwks from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  private jwksIns: jwks.JwksClient;
  private serviceKey: string;
  logger = new Logger(AuthGuard.name);

  constructor(private readonly configServ: ConfigService) {
    this.serviceKey = configServ.getOrThrow('SERVICE_KEY');
    this.jwksIns = new jwks.JwksClient({
      jwksUri: configServ.getOrThrow('AWS_COGNITO_JWKS_URL'),
    });
  }

  getKey(header, callback) {
    this.jwksIns.getSigningKey(header.kid, (err, key) => {
      if (err) {
        this.logger.error(err);
        throw new Error(err.toString());
      }
      const signingKey = key.getPublicKey();
      try {
        callback(null, signingKey);
      } catch (e) {
        console.log(e);
      }
    });
  }

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();

    const key = req?.query?.key;
    if (key === this.serviceKey) {
      this.logger.log('LOGIN WITH DEVELOPMENT KEY');
      req['user'] = {
        // TODO: read api key name from database.
        // How to store api key and name in database and read it here?
        // considering security best practices.
        sub: 'dev-key',
        email: 'no-email@example.com',
      };
      return true;
    }

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
          req['user'] = decoded;
          res(true);
        }
      });
    });

    const isValid = await p.catch(() => {
      throw new UnauthorizedException('Invalid token');
    });

    return await isValid;
  }
}
