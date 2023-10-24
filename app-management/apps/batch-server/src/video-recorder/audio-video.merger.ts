import { Injectable } from '@nestjs/common';
import { TSlideInfo } from './types';
import { FsService } from '@app/shared/fs/fs.service';
import { FfmpegService } from '@app/shared/ffmpeg.service';

@Injectable()
export class AudioVideoMerger {
  constructor(private fs: FsService, private ffmpeg: FfmpegService) {}
  async merge(slideImages: TSlideInfo[], slideAudios: TSlideInfo[]) {
    const videos: string[] = [];
    for (let i = 0; i < slideImages.length; i++) {
      const slideImage = slideImages[i];
      const slideAudio = slideAudios[i];

      if (!slideAudio.file.length) {
        continue;
      }

      const filename = slideAudio.meta.filename;
      const pid = slideAudio.meta.pid;

      this.fs.checkAndCreateDir(pid);
      const audioFilePath = await this.fs.createFile(
        `${pid}/mp3-files/${filename}.mp3`,
        slideAudio.file,
        true,
      );
      const imagePath = await this.fs.createFile(
        `${pid}/image-files/${filename}.png`,
        slideImage.file,
      );

      const videoPath = this.fs.getFullPath(
        `${pid}/video-files/${filename}.mp4`,
      );

      await this.ffmpeg.mergeMp3AndImage(audioFilePath, imagePath, videoPath);
      videos.push(videoPath);
    }
  }
}
