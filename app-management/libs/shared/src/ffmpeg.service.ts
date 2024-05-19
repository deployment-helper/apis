import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import { FsService } from '@app/shared/fs/fs.service';

// Documentation - https://ffmpeg.org/ffmpeg-filters.html#Description
@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);
  constructor(private fs: FsService) {}
  async mergeMp3AndImage(
    mp3FilePath: string,
    imageFilePath: string,
    outputFilePath: string,
  ): Promise<void> {
    // TODO: remove hardcoded path
    const backgroundMusic =
      '/Users/vinaymavi/quiz-project-content/kOSH0KB0GGtQgt1m9XFd/deep-meditation-192828.mp3';
    // delete previous output file
    await this.fs.deleteFile(outputFilePath);
    this.logger.log('Start Mp3AndImageMerge');
    const mp3Seconds = await this.mp3Duration(mp3FilePath);
    this.logger.log(`MP3 File duration ${mp3Seconds}`);
    const _ffmpeg = ffmpeg();
    return new Promise((resolve, reject) => {
      _ffmpeg
        .on('sdtderr', (err: Error) => {
          this.logger.error(err);
        })
        // Add the MP3 audio file
        .input(mp3FilePath)
        // Add the background music
        // background file needs to be added at the end this order to match amix duration
        .input(backgroundMusic)
        // Specify the audio codec
        .audioCodec('aac')
        // Add the image as the background
        .input(imageFilePath)
        .loop(1)
        // amix the audio files
        .complexFilter([
          {
            filter: 'amix',
            options: {
              inputs: 2,
              duration: 'first',
              weights: '1 0.25',
            },
          },
        ])
        .duration(mp3Seconds)
        // Set the video codec
        .videoCodec('libx264')
        // set output options
        .outputOptions([
          '-pix_fmt yuv420p',
          '-profile:v baseline',
          '-level 3.0',
          '-movflags +faststart',
          '-r 30',
        ])
        .format('mp4')
        // Set the output file path
        .save(outputFilePath)
        // On successful processing
        .on('start', (commandLine: string) => {
          this.logger.log(commandLine);
        })
        .on('end', () => {
          this.logger.log('End Mp3AndImageMerge');
          _ffmpeg.kill('0');
          resolve();
        })
        // On error
        .on('error', (err: Error, stdout, stderr) => {
          this.logger.error(err);
          this.logger.error(stdout);
          this.logger.error(stderr);
          _ffmpeg.kill('1');
          reject(new Error(`An error occurred: ${err.message}`));
        })
        .on('progress', (progress) => {
          this.logger.log('Processing: ' + progress.percent + '% done');
        });
    });
  }

  async mergeToFile(
    inputFilePaths: string[],
    outputFilePath: string,
    duration: number,
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
        // Adding duration as this merging was increasing  duration of the video
        .duration(duration)
        .on('start', (commandLine) => {
          this.logger.log(commandLine);
        })
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
            const duration = data.format.duration;
            resolve(duration);
          }
        });
    });
  }

  async getTotalDuration(filePaths: string[]): Promise<number> {
    let totalDuration = 0;

    for (const filePath of filePaths) {
      const duration = await this.mp3Duration(filePath);
      totalDuration += duration;
    }

    return totalDuration;
  }

  async trimVideo(
    inputFilePath: string,
    outputFilePath: string,
    startTrim: number,
    endTrim: number,
  ): Promise<void> {
    // Get the duration of the video
    const duration = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(inputFilePath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration);
      });
    });

    // Subtract 6 seconds from the duration
    const newDuration = duration - (startTrim + endTrim);

    // Trim the video
    return new Promise((resolve, reject) => {
      ffmpeg(inputFilePath)
        .setStartTime(startTrim) // Start from 3 seconds
        .setDuration(newDuration) // Set the new duration
        .output(outputFilePath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  async cropVideo(
    inputFilePath: string,
    outputFilePath: string,
    cropOptions: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    },
  ): Promise<void> {
    // Get the dimensions of the video
    const dimensions = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        ffmpeg.ffprobe(inputFilePath, (err, metadata) => {
          if (err) reject(err);
          else
            resolve({
              width: metadata.streams[0].width,
              height: metadata.streams[0].height,
            });
        });
      },
    );

    // Calculate the new dimensions
    const newWidth = dimensions.width - (cropOptions.left + cropOptions.right); // Subtract  pixels from both sides
    const newHeight =
      dimensions.height - (cropOptions.top + cropOptions.bottom); // Subtract  pixels from top and bottom

    // Crop the video
    return new Promise((resolve, reject) => {
      ffmpeg(inputFilePath)
        .videoFilters([
          {
            filter: 'crop',
            options: {
              w: newWidth,
              h: newHeight,
              x: cropOptions.left,
              y: cropOptions.top,
            },
          },
        ])
        .output(outputFilePath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }
}
