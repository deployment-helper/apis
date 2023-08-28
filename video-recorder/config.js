import { config } from "dotenv";

config();

export const RecorderConfig = {
    followNewTab: true,
    fps: 25,    
    videoFrame: {
      width: 1024,
      height: 768,
    },
    videoCrf: 18,
    videoCodec: 'libx264',
    videoPreset: 'ultrafast',
    videoBitrate: 1000,
    autopad: {
      color: 'black' | '#35A5FF',
    },
    aspectRatio: '16:9',
  };

export const VIDEO_LOCATION = process.env.VIDEO_LOCATION;
