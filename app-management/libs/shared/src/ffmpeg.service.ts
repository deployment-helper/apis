import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import { AudioVideoFilter } from 'fluent-ffmpeg';
import { FsService } from '@app/shared/fs/fs.service';
import { ELanguage } from '@app/shared/types';
import { FontsService } from '@app/shared/fonts.service';

const DEFAULT_FPS = 60;

// Documentation - https://ffmpeg.org/ffmpeg-filters.html#Description
@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);

  constructor(private fs: FsService, private readonly fontServ: FontsService) {}

  async mergeMp3AndImage(
    mp3FilePath: string,
    imageFilePath: string,
    outputFilePath: string,
  ): Promise<void> {
    // TODO: remove hardcoded path
    const backgroundMusic =
      '/Users/vinaymavi/quiz-project-content/deep-meditation-192828.mp3';
    // delete previous output file
    await this.fs.deleteFile(outputFilePath);
    this.logger.log('Start Mp3AndImageMerge');
    const mp3Seconds = await this.mp3Duration(mp3FilePath);
    this.logger.log(`MP3 File duration ${mp3Seconds}`);
    const _ffmpeg = ffmpeg();
    return new Promise((resolve, reject) => {
      _ffmpeg
        // Add the MP3 audio file
        .input(mp3FilePath)
        // Add the background music
        // background file needs to be added at the end this order to match amix duration
        .input(backgroundMusic)
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
              dropout_transition: 3,
              weights: '1 0.25',
            },
            outputs: 'audio',
          },
          this.filterFps('2:v', 'fps'),
          // this.filterScale('fps', 'scaled', {
          //   w: '1920',
          //   h: '1080',
          // }),
          this.filterScaleZoompan('fps', 'scaled'),
          this.filterSetpts('scaled', 'setpts'),
          this.filterSetSar('setpts', 'setsar'),
          this.filterZoomInOut('setsar', 'output', 'in'),
        ])
        // Set the video codec
        .videoCodec('libx264')
        // Specify the audio codec
        .audioCodec('aac')
        // set output options
        .outputOptions([
          '-t ' + mp3Seconds,
          '-map [output]',
          '-map [audio]',
          '-pix_fmt yuv420p',
          '-profile:v baseline',
          '-level 3.0',
          '-movflags +faststart',
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
          _ffmpeg.kill('1');
          reject(new Error(`An error occurred: ${err.message}`));
        })
        .on('stderr', (stderr) => {
          this.logger.error(stderr);
        })
        .on('progress', (progress) => {
          this.logger.log(`Timemark : ${progress.timemark}`);
        });
    });
  }

  escapeText(text: string): string {
    // replace all commas with an empty string because the drawtext filter uses commas as a separator
    return text.replace(/,/g, '').replace(/[:=,']/g, '\\$&');
  }

  filterDrawText(
    videoDuration: number,
    text: string,
    lang: ELanguage,
    wordsPerSubtitle = 10,
  ) {
    // TODO: need to improve this caption logic as some words are long and some are quite sort that making voice and caption out of sync
    const maxLineLength = 40;
    const charDur = videoDuration / text.length;
    const fontFile = this.fontServ.getFontFilePath(lang);
    const videoFilters: AudioVideoFilter[] = [];
    let startTime = 0;
    let endTime = 0;
    let subtitleDuration = 0;
    // Create an array with wordsPerSubtitle words per subtitle

    const words = text.split(' ');
    for (let i = 0; i < words.length; i += wordsPerSubtitle) {
      let subtitle = words.slice(i, i + wordsPerSubtitle).join(' ');
      subtitleDuration = Math.ceil(subtitle.length * charDur);
      endTime += subtitleDuration;
      // Split the subtitle into multiple lines if it exceeds the max line length
      const lines = [];
      while (subtitle.length > maxLineLength) {
        const lastSpace = subtitle.lastIndexOf(' ', maxLineLength);
        const splitPos = lastSpace > 0 ? lastSpace : maxLineLength;
        lines.push(subtitle.substring(0, splitPos));
        subtitle = subtitle.substring(splitPos + 1);
      }
      lines.push(subtitle);

      // Apply a separate drawtext filter for each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        videoFilters.push({
          filter: 'drawtext',
          options: {
            text: this.escapeText(line.trim()),
            fontfile: fontFile,
            fontsize: '62',
            fontcolor: 'white',
            x: '(w-text_w)/2', // Center the text horizontally
            y: `h-250+${i * 70}`, // Adjust the vertical position for each line
            bordercolor: 'black',
            borderw: '4',
            enable: `between(t,${startTime},${endTime})`,
          },
        });
      }
      startTime = endTime;
    }
    return videoFilters;
  }

  filterZoomInOut(inputs: string, outputs: string, dir: 'in' | 'out' = 'in') {
    // TODO: zoom out(out) is not working as expected need to fix this
    const z =
      dir === 'in'
        ? 'min(max(zoom,pzoom)+0.0001,1.5)'
        : 'if(lte(on,1),1.5,max(zoom,pzoom)-0.0001)';
    return {
      filter: 'zoompan',
      inputs: inputs,
      options: {
        z: z,
        d: 500,
        x: 'iw/2-(iw/zoom/2)',
        y: 'ih/2-(ih/zoom/2)',
        fps: DEFAULT_FPS,
        s: '1920x1080',
      },
      outputs: outputs,
    };
  }

  filterSetpts(inputs: string, outputs: string) {
    // Ref - https://ffmpeg.org/ffmpeg-filters.html#setpts
    // Reset the presentation timestamp to 0
    return {
      filter: 'setpts=PTS-STARTPTS',
      inputs: inputs,
      outputs: outputs,
    };
  }

  filterScroll(
    inputs: string,
    outputs: string,
    options: { h: string; v: string },
  ) {
    // Ref - https://ffmpeg.org/ffmpeg-filters.html#scroll
    return {
      filter: 'scroll',
      inputs: inputs,
      options: {
        h: options.h,
        v: options.v,
      },
      outputs: outputs,
    };
  }

  filterMoveUpDown(inputs: string, outputs: string, dir: 'up' | 'down' = 'up') {
    // Ref - https://ffmpeg.org/ffmpeg-filters.html#zoompan
    // need to use crop filter for this movement
    const options = {
      w: '1920',
      h: '1080',
      x: '0',
      y: '2160-t*60',
    };

    return [this.filterCrop(inputs, outputs, options)];
  }

  filterMoveLeftRight(
    inputs: string,
    outputs: string,
    dir: 'left' | 'right' = 'left',
  ) {
    const x =
      dir === 'left' ? 'min(max(x,px)+0.0001,w-iw)' : 'max(min(x,px)-0.0001,0)';
    return {
      filter: 'zoompan',
      inputs: inputs,
      options: {
        z: 'zoom',
        d: 500,
        x: x,
        y: 'ih/2-(ih/zoom/2)',
        fps: DEFAULT_FPS,
        s: '1920x1080',
      },
      outputs: outputs,
    };
  }

  filterRotate(inputs: string, outputs: string) {
    // Ref - https://ffmpeg.org/ffmpeg-filters.html#rotate
    return [
      {
        filter: 'rotate',
        inputs: inputs,
        options: {
          a: 't*PI/1800', // Rotate the image 0.1 degree per second
        },
        outputs: '_rotated',
      },
      // Calculate crop options to keep the video in the frame
      //and want to crop 40 px from all sides
      this.filterCrop('_rotated', outputs, {
        w: '1820',
        h: '960',
        x: '60',
        y: '60',
      }),
    ];
  }

  filterCrop(
    inputs: string,
    outputs: string,
    options: { w: string; h: string; x: string; y: string },
  ) {
    // Ref - https://ffmpeg.org/ffmpeg-filters.html#crop
    return {
      filter: 'crop',
      inputs: inputs,
      options: {
        w: options.w,
        h: options.h,
        x: options.x,
        y: options.y,
      },
      outputs: outputs,
    };
  }

  filterFps(input: string, output: string) {
    return {
      filter: `fps=${DEFAULT_FPS}`,
      inputs: input,
      outputs: output,
    };
  }

  filterScaleZoompan(input: string, output: string) {
    // Here we are using high resolution to avoid jittering/shaking of image during zoompan
    return {
      filter: 'scale=8000:-1',
      inputs: input,
      outputs: output,
    };
  }

  filterSceneRandom(input: string, output: string) {
    const randomFilters = [
      'filterRotate',
      'filterZoomInOut', // 'in' or 'out
      'filterMoveUpDown',
      'filterMoveLeftRight',
    ];

    const randomFilter =
      randomFilters[Math.floor(Math.random() * randomFilters.length)];

    return this[randomFilter](input, output);
  }

  filterSetSar(input: string, output: string) {
    // Ref - https://ffmpeg.org/ffmpeg-filters.html#setsar
    // https://stackoverflow.com/questions/50346707/ffmpeg-scaling-not-working-for-video
    return {
      filter: 'setsar=1',
      inputs: input,
      outputs: output,
    };
  }

  filterScale(
    input: string,
    output: string,
    options: { w: string; h: string },
  ) {
    return {
      filter: 'scale',
      inputs: input,
      outputs: output,
      options: {
        w: options.w,
        h: options.h,
        force_original_aspect_ratio: 'disable',
      },
    };
  }

  filterPad(input: string, output: string) {
    // TODO: incomplete need to fix this
    return {
      filter: 'pad=iw*sqrt(2):ih*sqrt(2):(ow-iw)/2:(oh-ih)/2',
      inputs: input,
      outputs: output,
    };
  }

  async addCaptionToVideo(
    inputFilePath: string,
    outputFilePath: string,
    text: string,
    lang: ELanguage,
    wordsPerSubtitle: number,
  ) {
    const videoDur = await this.mp3Duration(inputFilePath);
    const videoFilters = this.filterDrawText(
      videoDur,
      text,
      lang,
      wordsPerSubtitle,
    );

    const _ffmpeg = ffmpeg();

    return new Promise((resolve, reject) => {
      _ffmpeg
        .input(inputFilePath)
        .videoFilters(videoFilters)
        .output(outputFilePath)
        .on('start', (commandLine) => {
          this.logger.log(commandLine);
        })
        // TODO: Enable this line for debugging
        // .on('stderr', (err) => {
        //   this.logger.error(err);
        // })
        .on('end', () => {
          this.logger.log('End adding caption to video');
          resolve(1);
        })
        .on('error', (err) => {
          this.logger.error(err);
          reject(new Error(`An error occurred: ${err.message}`));
        })
        .run();
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
