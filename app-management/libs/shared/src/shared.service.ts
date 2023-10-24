import { Injectable, Logger } from '@nestjs/common';
import { ServerNames } from '@app/shared/types';

@Injectable()
export class SharedService {
  public static readonly logger = new Logger(SharedService.name);
  getServerName(urlStr: string) {
    const url = new URL(urlStr);
    const serverName = ServerNames[url.host];

    if (!serverName) {
      SharedService.logger.warn(`Invalid URL ${urlStr}`);
    }

    return serverName;
  }

  wait(ms: number): Promise<boolean> {
    return new Promise((res) => setTimeout(() => res(true), ms));
  }
}
