import { Injectable, Logger } from '@nestjs/common';
import { TSlideInfo } from './types';
import { FsService } from '@app/shared/fs/fs.service';
import { FfmpegService } from '@app/shared/ffmpeg.service';

@Injectable()
export class AudioVideoMerger {
  private readonly logger = new Logger(AudioVideoMerger.name);

  constructor(private fs: FsService, private ffmpeg: FfmpegService) {}

  async merge(
    scenesInfo: TSlideInfo[],
    slideAudios: TSlideInfo[],
    isSkipFirtAndLastSlide = true,
  ) {
    const videos: string[] = [];
    this.logger.log('Begin Merge');
    for (let i = 0; i < scenesInfo.length; i++) {
      // We are start and end slide in our application to have reveal.js layout work properly
      // So we need to trim the video to remove start and end slide
      // continue if first and last slide
      if (isSkipFirtAndLastSlide && (i === 0 || i === scenesInfo.length - 1)) {
        continue;
      }
      const sceneInfo = scenesInfo[i];
      const sceneAudio = slideAudios[i];

      this.logger.log(`Slide no ${i}`);
      if (!sceneAudio.file.length) {
        this.logger.log(`Continue ${sceneInfo}`);
        this.logger.warn('No audio file found for slide');
        continue;
      }

      const filename = sceneAudio.meta.filename;
      const videoId = sceneAudio.meta.pid;

      this.logger.log('Create video file');
      this.fs.checkAndCreateDir(`${videoId}/video-files`);
      const videoPath = this.fs.getFullPath(
        `${videoId}/video-files/${filename}.mp4`,
      );
      // TODO: caption is not synced and not working for some languages like Hindi.
      //  disabling it for now
      // const captionVideoPath = this.fs.getFullPath(
      //   `${videoId}/video-files/${filename}-caption.mp4`,
      // );
      this.logger.log('Start ffmpeg');
      try {
        await this.ffmpeg.mergeMp3AndImage(
          sceneAudio.file,
          sceneInfo.file,
          videoPath,
        );
        // this.logger.log('Add caption to video');
        // TODO: caption is not synced and not working for some languages like Hindi.
        //  disabling it for now
        // await this.ffmpeg.addCaptionToVideo(
        //   videoPath,
        //   captionVideoPath,
        //   sceneInfo.description || '',
        //   sceneInfo.meta.language,
        //   // TODO read wordsPerSubtitle form video
        //   10,
        // );
      } catch (e) {
        this.logger.error(e);
      }

      this.logger.log('Stop ffmpeg');
      videos.push(videoPath);
    }
    this.logger.log('End Merge');
    return videos;
  }
}
