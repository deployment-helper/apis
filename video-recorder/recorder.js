import puppeteer from "puppeteer";

import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";

import { RecorderConfig } from "./config";

// Milli seconds
const VIDEO_DURATION = 1000 * 10;
const LOGGING_INTERVAL = 1000 * 2;

export const run = async (pageurl, videoPath) => {
  console.log(pageurl, videoPath);
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  const recorder = new PuppeteerScreenRecorder(page, RecorderConfig);

  // Navigate the page to a URL
  await recorder.start(videoPath);
  await page.goto(pageurl);

  // Set screen size in 16:9 aspect ratio
  // { width: 1600, height: 900 }
  // { width: 1280, height: 720 }
  await page.setViewport({ width: 1280, height: 720 });
  console.log("Application is working and will be closed in two minutes");

  // await stop with mills
  let timeRemaining = VIDEO_DURATION;
  const interval = setInterval(() => {
    timeRemaining = timeRemaining - LOGGING_INTERVAL;
    console.log(`Time reamaining ${timeRemaining} ms`);
  }, LOGGING_INTERVAL);

  const sleep = new Promise((res, rej) => {
    setTimeout(() => {
      // all will check for fun call promises
      Promise.all([recorder.stop(), browser.close()])
        .then(res)
        .catch(rej)
        .finally(() => {
          clearInterval(interval);
        });
    }, VIDEO_DURATION);
  });

  await sleep;
};
