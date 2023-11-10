import { IRunner, TSlideInfo } from './types';
import { Page } from 'puppeteer';
import { SharedService } from '@app/shared';
import { Logger } from '@nestjs/common';

/**
 * This Slide runner is desinged for Vinay's slides portal.
 * Runner take screenshot and get meta informatoin for provided URLs slides
 */
export class SlidesRunner implements IRunner {
  nextArrowSelector = 'aside .navigate-right.enabled .controls-arrow';
  slideSelector = '.slides section.present';
  slides: Array<TSlideInfo> = [];
  private readonly logger = new Logger(SlidesRunner.name);
  constructor(private page: Page, private sharedService: SharedService) {}
  async start(url: string, data?: any): Promise<any> {
    // TODO: should be utility function to create URL
    const pageUrl = `${url}&apiKey=THISISLOCALDEVELOPMENTKEY`;
    this.logger.log(`PageURL ${pageUrl}`);
    this.logger.log('Start page');
    await this.page.goto(pageUrl);
    this.logger.log('Wait for 10 seconds');
    await this.sharedService.wait(10000);

    do {
      const screenshot: Buffer = await this.takeScreenshot();
      const meta: any = await this.getSlideMeta();
      this.slides.push({ file: screenshot, meta });
    } while (await this.hasNextAndClick());
    return this.slides;
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
}
