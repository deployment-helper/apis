import { Injectable, Logger } from '@nestjs/common';
import { ServerNames } from '@app/shared/types';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class SharedService {
  public static readonly logger = new Logger(SharedService.name);
  serviceKey:string;
  constructor(private readonly config:ConfigService) {
    this.serviceKey = config.getOrThrow('SERVICE_KEY');
  }
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

  getServiceKeyUrl(urlStr:string):string{
    const url = new URL(urlStr);
    url.searchParams.set('apiKey', this.serviceKey);
    return  url.toString();
  }
}
