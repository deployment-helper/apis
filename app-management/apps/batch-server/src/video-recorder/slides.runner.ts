import { IRunner, TSlideInfo } from './types';
import { Page } from 'puppeteer';
import { Injectable } from '@nestjs/common';
import { SharedService } from '@app/shared';

export class SlidesRunner implements IRunner {
  nextArrowSelector = 'aside .navigate-right.enabled .controls-arrow';
  slideSelector = '.slides section.present';
  slides: Array<TSlideInfo> = [];
  constructor(private page: Page, private sharedService: SharedService) {}
  async start(url: string, data?: any): Promise<any> {
    await this.page.goto(url);
    await this.sharedService.wait(2000);

    do {
      const screenshot: Buffer = await this.takeScreenshot();
      const meta: any = await this.getMeta();
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
    }

    return hasNext;
  }
  async getMeta(): Promise<any> {
    const item = await this.page.$(this.slideSelector);

    if (item) {
      const dataset = await item.evaluate((el) => {
        const htmlElement = el as HTMLElement;
        return htmlElement.dataset;
      });
      return dataset;
    }
  }
  async next(): Promise<void> {
    return await this.page.click(this.nextArrowSelector);
  }

  async takeScreenshot(): Promise<Buffer> {
    return await this.page.screenshot({ encoding: 'binary' });
  }
}
