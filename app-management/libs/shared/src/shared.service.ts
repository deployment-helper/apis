import { Injectable, Logger } from '@nestjs/common';
import { ServerNames } from '@app/shared/types';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '@app/shared/aws/s3.service';

@Injectable()
export class SharedService {
  public readonly logger = new Logger(SharedService.name);
  serviceKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly s3: S3Service,
  ) {
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

  async deleteS3Assets(
    item: any,
    globalAsset: string[],
    otherAssets?: string[],
  ): Promise<string[]> {
    const stringVideo = JSON.stringify(item);
    const urlPattern =
      /https?:\/\/[a-zA-Z0-9.-]+\.s3\.[a-zA-Z0-9-]+\.amazonaws\.com\/[^\s"]+/g;
    const allS3Urls = stringVideo.match(urlPattern) || [];
    const s3Urls = allS3Urls.filter((url) => !globalAsset.includes(url));
    const deletedKeys = await this.s3.deleteAll(
      s3Urls.concat(otherAssets || []),
    );
    this.logger.log(`Deleted ${deletedKeys.length} assets`);
    return s3Urls;
  }
}
