import { Injectable, Logger } from '@nestjs/common';
import { TSlideInfo } from './types';
import { FsService } from '@app/shared/fs/fs.service';
import { FfmpegService } from '@app/shared/ffmpeg.service';
import { exit } from '@nestjs/cli/actions';

@Injectable()
export class AudioVideoMerger {
  private readonly logger = new Logger(AudioVideoMerger.name);
  constructor(private fs: FsService, private ffmpeg: FfmpegService) {}
  async merge(slideImages: TSlideInfo[], slideAudios: TSlideInfo[]) {
    const videos: string[] = [];
    this.logger.log('Begin Merge');
    for (let i = 0; i < slideImages.length; i++) {
      const slideImage = slideImages[i];
      const slideAudio = slideAudios[i];

      this.logger.log(`Slide no ${i}`);
      if (!slideAudio.file.length) {
        this.logger.log(`Continue ${slideImage}`);
        continue;
      }

      const filename = slideAudio.meta.filename;
      const pid = slideAudio.meta.pid;

      this.logger.log('Create video file');
      this.fs.checkAndCreateDir(`${pid}/video-files`);
      const videoPath = this.fs.getFullPath(
        `${pid}/video-files/${filename}.mp4`,
      );
      this.logger.log('Start ffmpeg');
      try {
        await this.ffmpeg.mergeMp3AndImage(
          slideAudio.file,
          slideImage.file,
          videoPath,
        );
      } catch (e) {
        this.logger.error(e);
        exit();
      }
      this.logger.log('Stop ffmpeg');
      videos.push(videoPath);
    }
    return videos;
    this.logger.log('End Merge');
  }
}
