import { VIDEO_LOCATION } from "./config";
import { run } from "./recorder";

const pageurl = process.argv[2];
const pagename = process.argv[3];
const videoName = `${VIDEO_LOCATION}${pagename}.mp4`;
const instance = run(pageurl, videoName);

instance.then(() => {
  console.log(`Processing done. File generaged ${videoName}`);
});
