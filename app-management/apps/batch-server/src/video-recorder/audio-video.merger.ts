import { Injectable, Logger } from '@nestjs/common';
import { TSlideInfo } from './types';
import { FsService } from '@app/shared/fs/fs.service';
import { FfmpegService } from '@app/shared/ffmpeg.service';

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

      this.fs.checkAndCreateDir(`${pid}/mp3-files`);
      this.logger.log('Create mp3 file');
      const audioFilePath = await this.fs.createFile(
        `${pid}/mp3-files/${filename}.mp3`,
        slideAudio.file,
        true,
      );
      this.fs.checkAndCreateDir(`${pid}/image-files`);
      this.logger.log('Create image file');
      const imagePath = await this.fs.createFile(
        `${pid}/image-files/${filename}.png`,
        slideImage.file,
      );

      this.logger.log('Create video file');
      this.fs.checkAndCreateDir(`${pid}/video-files`);
      const videoPath = this.fs.getFullPath(
        `${pid}/video-files/${filename}.mp4`,
      );
      this.logger.log('Start ffmpeg');
      try {
        await this.ffmpeg.mergeMp3AndImage(audioFilePath, imagePath, videoPath);
      } catch (e) {
        this.logger.error(e);
      }
      this.logger.log('Stop ffmpeg');
      videos.push(videoPath);
    }
    return videos;
    this.logger.log('End Merge');
  }
}
