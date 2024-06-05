import { Page } from 'puppeteer';

export interface IWorker {
  start(url: string, data?: any): Promise<any>;

  stop?(): Promise<any>;
}

export interface IWebRunner {
  hasNext(): Promise<boolean>;

  takeScreenshot(): Promise<ArrayBuffer>;

  next(): Promise<void>;

  getSlideMeta(): Promise<any>;

  hasNextAndClick(): Promise<boolean>;

  start(url: string, data?: any, page?: Page): Promise<any>;

  stop?(): Promise<any>;
}

export interface IApiRunner {
  start<T>(url: string, data: any): Promise<T>;

  stop?(): Promise<any>;
}

export type TSlideInfo = {
  file: string;
  meta?: any;
  description?: string;
};

export type TSlideInfoArray = Array<TSlideInfo>;
