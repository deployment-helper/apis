import { Page } from 'puppeteer';

export interface IWorker {
  start(url: string, data?: any): Promise<any>;
  stop?(): Promise<any>;
}

export interface IRunner extends IWorker {
  hasNext(): Promise<boolean>;
  takeScreenshot(): Promise<ArrayBuffer>;
  next(): Promise<void>;
  getSlideMeta(): Promise<any>;
  hasNextAndClick(): Promise<boolean>;
}

export type TSlideInfo = {
  file: string;
  meta?: any;
};
