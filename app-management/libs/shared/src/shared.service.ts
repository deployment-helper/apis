import { Injectable, Logger } from '@nestjs/common';
import { ServerNames } from '@app/shared/types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SharedService {
  public readonly logger = new Logger(SharedService.name);
  serviceKey: string;

  constructor(private readonly config: ConfigService) {
    this.serviceKey = config.getOrThrow('SERVICE_KEY');
  }

  getServerName(urlStr: string) {
    const url = new URL(urlStr);
    const serverName = ServerNames[url.host];

    if (!serverName) {
      this.logger.warn(`Invalid URL ${urlStr}`);
    }

    return serverName;
  }

  wait(ms: number): Promise<boolean> {
    this.logger.log('Start Waiting');
    return new Promise((res) =>
      setTimeout(() => {
        this.logger.log('End Waiting');
        res(true);
      }, ms),
    );
  }

  getServiceKeyUrl(urlStr: string): string {
    const url = new URL(urlStr);
    url.searchParams.set('apiKey', this.serviceKey);
    return url.toString();
  }
}
