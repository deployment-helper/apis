import { Injectable } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import { FsService } from '@app/shared/fs/fs.service';

@Injectable()
export class FfmpegService {
  constructor(private fs: FsService) {}
  async mergeMp3AndImage(
    mp3FilePath: string,
    imageFilePath: string,
    outputFilePath: string,
  ): Promise<void> {
    await this.fs.deleteFile(outputFilePath);

    return new Promise((resolve, reject) => {
      ffmpeg()
        // Add the MP3 audio file
        .input(mp3FilePath)
        // Specify the audio codec
        .audioCodec('aac')
        // Add the image as the background
        .input(imageFilePath)
        // Loop the image to match the length of the audio
        .loop()
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
    await this.fs.deleteFile(outputFilePath);

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
          resolve();
        })
        .on('error', (err) => {
          reject(new Error(`An error occurred: ${err.message}`));
        });
    });
  }
}
