import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import { FsService } from '@app/shared/fs/fs.service';

@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);
  constructor(private fs: FsService) {}
  async mergeMp3AndImage(
    mp3FilePath: string,
    imageFilePath: string,
    outputFilePath: string,
  ): Promise<void> {
    // delete previous output file
    await this.fs.deleteFile(outputFilePath);
    this.logger.log('Start Mp3AndImageMerge');

    const mp3Seconds = await this.mp3Duration(mp3FilePath);
    this.logger.log(`MP3 File duration ${mp3Seconds}`);
    return new Promise((resolve, reject) => {
      ffmpeg()
        // Add the MP3 audio file
        .input(mp3FilePath)
        // Specify the audio codec
        .audioCodec('aac')
        // Add the image as the background
        .input(imageFilePath)
        // Loop the image to match the length of the audio
        .loop(mp3Seconds)
        // Set the video codec
        .videoCodec('libx264')
        // Set the video format (MP4)
        .format('mp4')
        // Set the output file path
        .save(outputFilePath)
        // On successful processing
        .on('end', resolve)
        // On error
        .on('error', (err: Error) => {
          reject(new Error(`An error occurred: ${err.message}`));
        });
    });
  }

  async mergeVideos(
    inputFilePaths: string[],
    outputFilePath: string,
  ): Promise<void> {
    // delete previous output file
    await this.fs.deleteFile(outputFilePath);
    this.logger.log('Begin video merge');

    return new Promise((resolve, reject) => {
      const ffmpegInstance = ffmpeg();

      // Add each input file to the ffmpeg instance
      inputFilePaths.forEach((inputFilePath) => {
        ffmpegInstance.input(inputFilePath);
      });

      // Merge and save the video files to the output path
      ffmpegInstance
        .mergeToFile(outputFilePath, '/tmp')
        .on('end', () => {
          this.logger.log('End video merge');
          resolve();
        })
        .on('error', (err) => {
          this.logger.log('End video merge with error');
          this.logger.error(err);
          reject(new Error(`An error occurred: ${err.message}`));
        });
    });
  }

  mp3Duration(mp3File: string) {
    // Use ffprobe to get the duration of the MP3 audio
    return new Promise<number>((resolve, reject) => {
      ffmpeg()
        .input(mp3File)
        .ffprobe((err, data) => {
          if (err) {
            reject(err);
          } else {
            // Parse the duration from the ffprobe data
            const duration = parseFloat(data.format.duration);
            resolve(duration);
          }
        });
    });
  }
}
