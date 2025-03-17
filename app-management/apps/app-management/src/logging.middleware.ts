import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, NextFunction } from 'express';
const logger = new Logger('App');

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, resp: Response, next: NextFunction) {
    logger.log(`[Request] ${req.method} ${req.url}`);
    next();
  }
}
