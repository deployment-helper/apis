export const FOLDER_GROUPS = [
  'video-files',
  'mp3-files',
  'image-files',
  'text-files',
] as const;

export const MP3_SPEAKING_RATES = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5,
];
export const DEFAULT_MP3_SPEAKING_RATE = 0.9;

export const REDIS_QUEUE_VIDEO_RECORDER = 'video-recorder';
export const REDIS_QUEUE_MP3_GENERATOR = 'mp3-generator';
export const REDIS_QUEUE_VIDEO_GENERATOR = 'video-generator';
