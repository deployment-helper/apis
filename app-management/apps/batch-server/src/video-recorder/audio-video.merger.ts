import { Injectable, Logger } from '@nestjs/common';
import { TSlideInfo } from './types';
import { FsService } from '@app/shared/fs/fs.service';
import { FfmpegService } from '@app/shared/ffmpeg.service';
import { IBodyCopyDrawText } from '@app/shared/types';

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
        if (sceneInfo.layout === 'layout2') {
          await this.layout2(sceneAudio.file, sceneInfo.file, videoPath);
        } else if (sceneInfo.layout === 'layout4') {
          await this.layout4(sceneAudio.file, sceneInfo.file, videoPath);
        } else if (sceneInfo.layout === 'layout5') {
          await this.layout5(sceneAudio.file, sceneInfo.file, videoPath, {
            text: sceneInfo.meta.title,
            type: 'title',
          });
        } else if (sceneInfo.layout === 'layout6') {
          await this.layout6(sceneAudio.file, sceneInfo.file, videoPath, {
            text: sceneInfo.meta.title,
            type: 'title',
          });
        } else {
          this.logger.error(`Layout not found ${sceneInfo.layout}`);
        }

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

  // Image layout
  async layout2(
    mp3FilePath: string,
    imageFilePath: string,
    outputFilePath: string,
  ) {
    await this.ffmpeg.mergeMp3AndImage(
      mp3FilePath,
      imageFilePath,
      outputFilePath,
    );
  }

  // Video layout
  async layout4(
    mp3FilePath: string,
    videoFilePath: string,
    outputFilePath: string,
  ) {
    await this.ffmpeg.mergeMp3AndVideo(
      mp3FilePath,
      videoFilePath,
      outputFilePath,
    );
  }

  // Image + Title layout
  async layout5(
    mp3FilePath: string,
    videoFilePath: string,
    outputFilePath: string,
    bodyCopy: IBodyCopyDrawText,
  ) {
    await this.ffmpeg.mergeMp3AndImage(
      mp3FilePath,
      videoFilePath,
      outputFilePath,
      bodyCopy,
    );
  }

  // Video + Title layout
  async layout6(
    mp3FilePath: string,
    videoFilePath: string,
    outputFilePath: string,
    bodyCopy: IBodyCopyDrawText,
  ) {
    await this.ffmpeg.mergeMp3AndVideo(
      mp3FilePath,
      videoFilePath,
      outputFilePath,
      bodyCopy,
    );
  }
}
