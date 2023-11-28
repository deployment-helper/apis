import { IRunner, TSlideInfo } from './types';
import { Page } from 'puppeteer';
import { SharedService } from '@app/shared';
import { Logger } from '@nestjs/common';
import { FsService } from '@app/shared/fs/fs.service';
import { S3Service } from '@apps/app-management/aws/s3.service';

/**
 * This Slide runner is designed for Vinay's slides portal.
 * Runner take screenshot and get meta information for provided URLs slides
 */
export class SlidesRunner implements IRunner {
  nextArrowSelector = 'aside .navigate-right.enabled .controls-arrow';
  slideSelector = '.slides section.present';
  slides: Array<TSlideInfo> = [];
  private readonly logger = new Logger(SlidesRunner.name);

  constructor(
    private page: Page,
    private sharedService: SharedService,
    private fs: FsService,
    private s3: S3Service,
  ) {}
  async start(url: string, data?: any): Promise<any> {
    try {
      const pageUrl = this.sharedService.getServiceKeyUrl(url);
      this.logger.log('Start page');
      await this.page.setViewport({ width: 1920, height: 1080 });
      await this.page.goto(pageUrl);
      // this.logger.log('Wait for 10 seconds');
      // await this.sharedService.wait(10000);
      // create image directory
      this.fs.checkAndCreateDir(`${data.pid}/image-files`);
      do {
        const meta: any = await this.getSlideMeta();
        const imagePath: string = await this.takeScreenshotAndSave(
          meta,
          data.pid,
        );
        this.slides.push({ file: imagePath, meta });
      } while (await this.hasNextAndClick());
      return this.slides;
    } catch (e) {
      this.logger.error(e);
    }
  }

  async stop(): Promise<any> {
    await this.page.close();
  }

  async hasNext(): Promise<boolean> {
    const arrow = await this.page.$(this.nextArrowSelector);
    return !!arrow;
  }
  async hasNextAndClick(): Promise<boolean> {
    const hasNext = await this.hasNext();
    if (hasNext) {
      await this.next();
      await this.sharedService.wait(2000);
    }

    return hasNext;
  }
  async getSlideMeta(): Promise<any> {
    const item = await this.page.$(this.slideSelector);
    try {
      if (item) {
        const dataset = await item.evaluate((el) => {
          const htmlElement = el as HTMLElement;
          const dataset = htmlElement.dataset;
          // Create an empty key-value map
          const datasetMap = {};

          // Iterate through the dataset properties and populate the map
          for (const key in dataset) {
            datasetMap[key] = dataset[key];
          }

          return datasetMap;
        });
        this.logger.debug(`Dataset ${JSON.stringify(dataset)}`);
        return dataset;
      }
    } catch (e) {
      this.logger.error(e);
    }
  }
  async next(): Promise<void> {
    return await this.page.click(this.nextArrowSelector);
  }

  async takeScreenshot(): Promise<Buffer> {
    return await this.page.screenshot({ encoding: 'binary' });
  }

  async takeScreenshotAndSave(meta: any, pid: string) {
    const image = await this.takeScreenshot();
    const filename = this.s3.mp3FileNameFromS3Key(meta.name, false);
    const imagePath = await this.fs.createFile(
      `${pid}/image-files/${filename}.png`,
      image,
    );

    return imagePath;
  }
}
