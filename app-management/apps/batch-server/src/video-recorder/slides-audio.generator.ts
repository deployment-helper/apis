import { Logger } from '@nestjs/common';
import { TSlideInfo } from './types';
import { S3Service } from '@apps/app-management/aws/s3.service';
import { FsService } from '@app/shared/fs/fs.service';
import { FfmpegService } from '@app/shared/ffmpeg.service';
import { SynthesisService } from '@app/shared/gcp/synthesis.service';
import { IGenerateVideoDto } from '../types';
import { DEFAULT_MP3_SPEAKING_RATE } from '@app/shared/constants';

/**
 * This file create a arrary of MP3 info from S3 file
 */
export class SlidesAudioGenerator {
  private readonly logger = new Logger(SlidesAudioGenerator.name);

  constructor(
    private s3: S3Service,
    private fs: FsService,
    private ffmpeg: FfmpegService,
  ) {}

  async start(slides: Array<TSlideInfo>, data?: any) {
    const audioFiles: Array<TSlideInfo> = [];
    this.logger.log('Begin audio generator');
    this.fs.checkAndCreateDir(`${data.pid}/mp3-files`);
    for (const slide of slides) {
      const meta = slide.meta;
      this.logger.debug(meta);
      this.logger.log(`Meta ${JSON.stringify(meta)}`);
      if (meta?.audiourl) {
        const audioFilePath = await this.getFileFromAudioUrl(
          meta.audiourl,
          data.pid,
        );
        audioFiles.push({
          file: audioFilePath,
          meta: {
            filename: this.s3.mp3FileNameFromS3Key(meta.name, false),
            pid: data.pid,
          },
        });
      } else {
        this.logger.log('Generating empty file');
        audioFiles.push({
          file: '',
        });
      }
    }
    this.logger.log('End audio generator');
    return audioFiles;
  }

  async startV2(slides: Array<TSlideInfo>, data?: IGenerateVideoDto) {
    try {
      const audioFiles: Array<TSlideInfo> = [];
      this.logger.log('Begin audio generator');
      this.fs.checkAndCreateDir(`${data.videoId}/mp3-files`);
      for (const slide of slides) {
        const description =
          slide.description?.trim() || 'no description provided';

        // TODO: run this in parallel
        const audioFilePath = await this.getAudioFromTextAndSave(
          description,
          data.videoId,
          slide.meta.name,
          slide.meta?.defaultMp3SpeakingRate || DEFAULT_MP3_SPEAKING_RATE,
          slide.meta.language || 'en-US',
          slide.meta.voiceCode,
        );
        audioFiles.push({
          file: audioFilePath,
          meta: {
            // TODO: rename this filename, needs to check .mp3 extension use
            filename: `${slide.meta.name}.mp3`,
            // TODO: rename this pid to videoId
            pid: data.videoId,
          },
        });
      }

      this.logger.log('End audio generator');
      return audioFiles;
    } catch (e) {
      this.logger.error(e);
    }
  }

  async getFileFromAudioUrl(audiourl: string, pid) {
    let audioFilePath;
    if (audiourl.split(',').length === 1) {
      audioFilePath = await this.getS3FileAndSave(audiourl, pid);
    } else {
      const mp3Files = [];
      for (const url of audiourl.split(',')) {
        audioFilePath = await this.getS3FileAndSave(url, pid);
        mp3Files.push(audioFilePath);
      }
      const mp3MergeFullPath = audioFilePath.split('.mp3').join('-merge.mp3');

      const totalDuration = await this.ffmpeg.getTotalDuration(mp3Files);
      this.logger.debug('Total duration', totalDuration);
      await this.ffmpeg.mergeToFile(mp3Files, mp3MergeFullPath, totalDuration);

      audioFilePath = mp3MergeFullPath;
    }

    return audioFilePath;
  }

  async getAudioFromTextAndSave(
    text: string,
    sceneId: string,
    name: string,
    speakingRate: number,
    language: string,
    voiceCode?: string,
  ) {
    const synthesisService = new SynthesisService();
    const audio = await synthesisService.synthesize(
      [text],
      speakingRate,
      voiceCode,
      language,
      true,
    );
    const filename = `${sceneId}/mp3-files/${name}.mp3`;
    const audioFilePath = await this.fs.createFile(
      filename,
      audio[0].data,
      true,
    );
    return audioFilePath;
  }

  async getS3FileAndSave(key, pid) {
    const fileStr = await this.s3.getAsString(key);
    const fileJson = JSON.parse(fileStr);
    const filename = this.s3.mp3FileNameFromS3Key(key, false);
    const audioFilePath = await this.fs.createFile(
      `${pid}/mp3-files/${filename}.mp3`,
      fileJson.audioContent,
      true,
    );
    return audioFilePath;
  }
}
