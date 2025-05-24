import { IWebRunner, TSlideInfo } from './types';
import { Page } from 'puppeteer';
import { SharedService } from '@app/shared';
import { Logger } from '@nestjs/common';
import { FsService } from '@app/shared/fs/fs.service';
import { S3Service } from '@app/shared/aws/s3.service';
import { ImageService } from '@app/shared/image.service';

export class SlidesRunner implements IWebRunner {
  nextArrowSelector = 'aside .navigate-right.enabled .controls-arrow';
  slideSelector = '.slides section.present';
  slides: Array<TSlideInfo> = [];
  private readonly logger = new Logger(SlidesRunner.name);
  private page: Page;

  constructor(
    private sharedService: SharedService,
    private fs: FsService,
    private s3: S3Service,
    private imageService: ImageService,
  ) {}

  async start(
    url: string,
    data?: any,
    page?: Page,
  ): Promise<Array<TSlideInfo>> {
    try {
      this.page = page;
      const pageUrl = this.sharedService.getServiceKeyUrl(url);
      this.logger.log('Start page');
      await this.page.setViewport({ width: 1920, height: 1080 });
      await this.page.goto(pageUrl);
      this.logger.log('Wait for 10 seconds');
      await this.sharedService.wait(10000);
      // create image directory
      this.fs.checkAndCreateDir(`${data.pid}/image-files`);
      do {
        const meta: any = await this.getSlideMeta();
        const imagePath: string = await this.takeScreenshotAndSave(
          meta,
          data.pid,
        );
        this.slides.push({
          file: imagePath,
          description: meta.description,
          layoutId: meta.layoutid,
          slideId: meta.slideid,
          meta,
        });
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
    const booleanKeys = ['applydefaultanimation'];
    try {
      if (item) {
        const dataset: Record<string, string | boolean> = await item.evaluate(
          (el) => {
            const htmlElement = el as HTMLElement;
            const dataset = htmlElement.dataset;
            // Create an empty key-value map
            const datasetMap = {};

            // Iterate through the dataset properties and populate the map
            for (const key in dataset) {
              datasetMap[key] = dataset[key];
            }

            return datasetMap;
          },
        );
        // Convert boolean keys from string to boolean
        for (const key of booleanKeys) {
          if (dataset[key]) {
            dataset[key] = dataset[key] === 'true' ? true : false;
          }
        }
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

  async takeScreenshot(): Promise<Uint8Array> {
    return await this.page.screenshot({ encoding: 'binary' });
  }

  async takeElementScreenshot(elementSelector: string): Promise<Uint8Array> {
    const element = await this.page.$(elementSelector);
    return await element.screenshot({
      encoding: 'binary',
    });
  }

  async takeScreenshotAndSave(meta: any, pid: string) {
    const image = await this.takeElementScreenshot(this.slideSelector);
    const filename = this.s3.mp3FileNameFromS3Key(meta.name, false);
    const imagePath = await this.fs.createFile(
      `${pid}/image-files/${filename}.png`,
      image,
    );

    return imagePath;
  }
}
