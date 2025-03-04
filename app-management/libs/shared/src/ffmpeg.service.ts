import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import { AudioVideoFilter } from 'fluent-ffmpeg';
import { FsService } from '@app/shared/fs/fs.service';
import { ELanguage, IBodyCopyDrawText } from '@app/shared/types';
import { FontsService } from '@app/shared/fonts.service';

// TODO: keep this settings at project level
const DEFAULT_FPS = 30;
const DURATION_XFADE = 2;

// Documentation - https://ffmpeg.org/ffmpeg-filters.html#Description
@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);

  constructor(private fs: FsService, private readonly fontServ: FontsService) {}

  async mergeMp3AndImage(
    mp3FilePath: string,
    imageFilePath: string,
    outputFilePath: string,
    bodyCopy?: IBodyCopyDrawText,
  ): Promise<void> {
    // delete previous output file
    await this.fs.deleteFile(outputFilePath);
    this.logger.log('Start Mp3AndImageMerge');
    const mp3Seconds = await this.mp3Duration(mp3FilePath);
    this.logger.log(`MP3 File duration ${mp3Seconds}`);
    const _ffmpeg = ffmpeg();
    return new Promise(async (resolve, reject) => {
      let output = 'output';
      _ffmpeg
        // Add the MP3 audio file
        .input(mp3FilePath)
        // Add the image as the background
        .input(imageFilePath)
        .inputOption('-loop 1');

      const complexFilter = [
        this.filterFps('1:v', 'fps'),
        this.filterSetpts('fps', 'setpts'),
        ...this.applyRandomSceneFilter('setpts', 'randomFiltered'),
        this.filterScale('randomFiltered', 'scaled', {
          w: '1920',
          h: '1080',
        }),
        this.filterSetSar('scaled', 'output'),
      ];

      if (bodyCopy) {
        output = 'bodyCopyOutput';
        const bodyCopyFiler = await this.filterDrawTextV2(
          bodyCopy,
          mp3Seconds,
          'output',
          output,
          mp3FilePath,
        );
        complexFilter.push(bodyCopyFiler);
      }

      _ffmpeg
        .complexFilter(complexFilter)
        // Set the video codec
        .videoCodec('libx264')
        // Specify the audio codec
        .audioCodec('aac')
        // set output options
        .outputOptions([
          `-map [${output}]`,
          '-map 0:a',
          '-pix_fmt yuv420p',
          '-profile:v baseline',
          '-level 3.0',
          `-r ${DEFAULT_FPS}`,
          '-preset superfast',
          '-threads 10',
          `-t ${mp3Seconds}`,
          '-hide_banner',
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

  async mergeMp3AndVideo(
    mp3FilePath: string,
    videoFilePath: string,
    outputFilePath: string,
    bodyCopy?: IBodyCopyDrawText,
  ) {
    // delete previous output file
    await this.fs.deleteFile(outputFilePath);
    this.logger.log('Start Mp3AndVideoMerge');
    const mp3Seconds = await this.mp3Duration(mp3FilePath);
    this.logger.log(`MP3 File duration ${mp3Seconds}`);
    const _ffmpeg = ffmpeg();

    return new Promise<void>(async (resolve, reject) => {
      let output = 'setsared';
      _ffmpeg
        .input(mp3FilePath)
        .input(videoFilePath)
        .inputOption('-stream_loop -1')
        .videoCodec('libx264')
        .audioCodec('aac');

      const complexFilter = [
        this.filterScale('1:v', 'scaled', {
          w: '1920',
          h: '1080',
        }),
        this.filterSetSar('scaled', 'setsared'),
      ];

      if (bodyCopy) {
        output = 'output';
        // setsared is the output of the previous filter
        const filter = await this.filterDrawTextV2(
          bodyCopy,
          mp3Seconds,
          'setsared',
          'output',
          mp3FilePath,
        );

        complexFilter.push(filter);
      }

      const outputOptions = [
        `-map [${output}]`,
        '-map 0:a',
        '-pix_fmt yuv420p',
        '-profile:v baseline',
        '-level 3.0',
        `-r ${DEFAULT_FPS}`,
        '-preset superfast',
        '-threads 10',
        `-t ${mp3Seconds}`,
        '-hide_banner',
      ];

      _ffmpeg
        .complexFilter(complexFilter)
        .outputOptions(outputOptions)
        .format('mp4')
        .save(outputFilePath)
        .on('start', (commandLine) => {
          this.logger.log(commandLine);
        })
        .on('end', () => {
          this.logger.log('End Mp3AndVideoMerge');
          _ffmpeg.kill('0');
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(err);
          _ffmpeg.kill('1');
          reject(new Error(`An error occurred: ${err.message}`));
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

  applyRandomSceneFilter(inputs: string, outputs: string) {
    const randomFilters = ['filterZoomOut', 'filterZoomIn'];

    const randomFilter =
      randomFilters[Math.floor(Math.random() * randomFilters.length)];

    return this[randomFilter](inputs, outputs);
  }

  async filterDrawTextV2(
    bodyCopy: IBodyCopyDrawText,
    duration: number,
    input: string,
    output: string,
    // referenceFilePath is used to create text file in same parent directory
    referenceFilePath?: string,
  ) {
    if (!bodyCopy) {
      return undefined;
    }

    // TODO: font file should be loaded based on the language
    const fontFile = this.fontServ.getFontFilePath(ELanguage['English (US)']);
    const escapeText = this.escapeText(bodyCopy.text);

    const text = await this.prepareDrawtextFilterText(
      bodyCopy,
      referenceFilePath,
    );
    return {
      filter: 'drawtext',
      inputs: input,
      options: {
        textfile: text.textFile,
        fontfile: fontFile,
        fontsize: `${text.fontSize}`,
        text_align: 'C',
        fontcolor: 'GhostWhite',
        x: '(w-text_w)/2', // Center the text horizontally
        y: `(h-text_h)/2`, // Center the text vertically
        enable: `between(t,0,${duration})`,
        shadowcolor: 'black',
        shadowx: 2,
        shadowy: 2,
      },
      outputs: output,
    };
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

  filterZoomIn(inputs: string, outputs: string) {
    return [
      this.filterScaleZoompan(inputs, '_zoompaned'),
      {
        filter: 'zoompan',
        inputs: '_zoompaned',
        options: {
          z: 'min(max(zoom,pzoom)+0.0015,1.5)',
          d: 100,
          x: 'iw/2-(iw/zoom/2)',
          y: 'ih/2-(ih/zoom/2)',
          fps: DEFAULT_FPS,
          s: '1920x1080',
        },
        outputs: outputs,
      },
    ];
  }

  filterZoomOut(inputs: string, outputs: string) {
    // TODO: zoom out(out) is not working as expected need to fix this;
    return [
      this.filterScaleZoompan(inputs, '_zoompaned'),
      {
        filter: 'zoompan',
        inputs: '_zoompaned',
        options: {
          z: 'max(1.5-0.0015*on,1)',
          d: 10,
          x: 'iw/2-(iw/zoom/2)',
          y: 'ih/2-(ih/zoom/2)',
          fps: DEFAULT_FPS,
          s: '1920x1080',
        },
        outputs: outputs,
      },
    ];
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

  filterRotate(inputs: string, outputs: string) {
    // Ref - https://ffmpeg.org/ffmpeg-filters.html#rotate
    return [
      {
        filter: 'rotate',
        inputs: inputs,
        options: {
          a: 't*PI/1800', // Rotate the image 0.1 degree per second
        },
        outputs: outputs,
      },
      // Calculate crop options to keep the video in the frame
      //and want to crop 40 px from all sides
      // this.filterCrop('_rotated', outputs, {
      //   w: '1800',
      //   h: '960',
      //   x: '60',
      //   y: '60',
      // }),
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

  filterFormat(inputs: string, outputs: string) {
    // Ref - https://ffmpeg.org/ffmpeg-filters.html#format
    // This format filter needs .mov file with alpha channel
    return {
      filter: 'format=rgba,colorchannelmixer=aa=0.2',
      inputs: inputs,
      outputs: outputs,
    };
  }

  filterOverlay(inputs: string[], outputs: string) {
    // Ref - https://ffmpeg.org/ffmpeg-filters.html#overlay
    return {
      filter: 'overlay',
      inputs: inputs,
      options: {
        shortest: 1,
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
    // Supported resolutions - 1920x1080, 1280x720, 854x480, 640x360, 426x240, 256x144
    // 4k resolution - 3840x2160, 8000:-1, 8000:8000
    // TODO: This large scaling is required as the zoompan filter jitters is not working as expected
    return {
      filter: 'scale=3840:-1',
      inputs: input,
      outputs: output,
    };
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
        .outputOptions([
          '-pix_fmt yuv420p',
          '-profile:v baseline',
          '-level 3.0',
          `-r ${DEFAULT_FPS}`,
          '-movflags +faststart',
        ])
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

  async addBackgroundMusicToVideo(
    inputFilePath: string,
    outputFilePath: string,
    musicFilePath: string,
  ): Promise<void> {
    // delete previous output file
    await this.fs.deleteFile(outputFilePath);
    this.logger.log('Start adding background music to video');
    const _ffmpeg = ffmpeg();
    return new Promise((resolve, reject) => {
      _ffmpeg
        .input(inputFilePath)
        .input(musicFilePath)
        .inputOption('-stream_loop -1')
        .complexFilter([
          {
            filter: 'amix',
            options: {
              inputs: 2,
              duration: 'first',
              dropout_transition: 3,
              weights: '8 5',
            },
            outputs: 'audio',
          },
        ])
        // copy the video codec
        .videoCodec('copy')
        // Specify the audio codec
        .audioCodec('aac')
        .outputOptions([
          '-map 0:v',
          '-map [audio]',
          '-pix_fmt yuv420p',
          '-level 3.0',
          `-r ${DEFAULT_FPS}`,
          '-preset superfast',
          '-threads 10',
          '-hide_banner',
        ])
        .format('mp4')
        .save(outputFilePath)
        .on('start', (commandLine) => {
          this.logger.log(commandLine);
        })
        .on('end', () => {
          this.logger.log('End adding background music to video');
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(err);
          reject(new Error(`An error occurred: ${err.message}`));
        })
        .on('progress', (progress) => {
          this.logger.log(`Timemark : ${progress.timemark}`);
        });
    });
  }

  async addOverlayToVideo(
    inputFilePath: string,
    outputFilePath: string,
    overlayFilePath: string,
  ): Promise<void> {
    // delete previous output file
    await this.fs.deleteFile(outputFilePath);
    this.logger.log('Start adding background music to video');
    const _ffmpeg = ffmpeg();
    return new Promise((resolve, reject) => {
      _ffmpeg
        .input(inputFilePath)
        .input(overlayFilePath)
        .inputOption('-stream_loop -1')
        .complexFilter([this.filterOverlay(['0:v', '1:v'], 'output')])
        // copy the video codec
        .videoCodec('libx264')
        // Specify the audio codec
        .audioCodec('aac')
        .outputOptions([
          '-map [output]',
          '-map 0:a',
          '-pix_fmt yuv420p',
          '-level 3.0',
          `-r ${DEFAULT_FPS}`,
          '-preset superfast',
          '-threads 10',
          '-hide_banner',
        ])
        .format('mp4')
        .save(outputFilePath)
        .on('start', (commandLine) => {
          this.logger.log(commandLine);
        })
        .on('end', () => {
          this.logger.log('End adding background music to video');
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(err);
          reject(new Error(`An error occurred: ${err.message}`));
        })
        .on('progress', (progress) => {
          this.logger.log(`Timemark : ${progress.timemark}`);
        });
    });
  }

  async filterXfadeTransitionFade(
    inputFilePaths: string[],
    outputFilePath: string,
  ): Promise<void> {
    let filter = '';
    let cumulativeOffset = 0; // Keeps track of cumulative duration

    for (let i = 1; i < inputFilePaths.length; i++) {
      const duration = await this.mp3Duration(inputFilePaths[i - 1]);

      if (!duration) {
        this.logger.error(
          `Could not determine duration for video ${inputFilePaths[i]}`,
        );
        return;
      }

      cumulativeOffset += duration;
      const offset = cumulativeOffset - i * DURATION_XFADE;

      if (i === 1) {
        filter += `[0:v][${i}:v]xfade=transition=fade:duration=${DURATION_XFADE}:offset=${offset}[v${i}];`;
        filter += `[0:a][${i}:a]acrossfade=d=${DURATION_XFADE}[a${i}];`;
      } else {
        filter += `[v${
          i - 1
        }][${i}:v]xfade=transition=fade:duration=${DURATION_XFADE}:offset=${offset}[v${i}];`;
        filter += `[a${
          i - 1
        }][${i}:a]acrossfade=d=${DURATION_XFADE}:curve1=nofade:curve2=nofade[a${i}];`;
      }
    }

    filter = filter.slice(0, -1); // Remove the last semicolon

    const lastVideoIndex = inputFilePaths.length - 1;
    const command = ffmpeg();

    return new Promise((resolve, reject) => {
      inputFilePaths.forEach((input) => {
        command.input(input);
      });

      command
        .complexFilter(filter)
        .outputOptions([
          `-map [v${lastVideoIndex}]`,
          `-map [a${lastVideoIndex}]`,
          '-c:v libx264',
          '-c:a aac',
          '-b:a 192k',
        ])
        .on('start', (commandLine) => {
          this.logger.log('Generated FFmpeg Command:', commandLine);
        })
        .on('end', () => {
          this.logger.log('Merging completed successfully');
          resolve();
        })
        .on('error', (err) => {
          this.logger.error('Error during merging:', err);
          reject();
        })
        .save(outputFilePath);
    });
  }

  /**
   * Merge multiple video files into a single video file
   * @param inputFilePaths
   * @param outputFilePath
   * @param duration
   */
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
        // TODO: Enable this line for debugging
        .on('stderr', (err) => {
          this.logger.error(err);
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

  async concat(inputFiles: string[], outputFilePath: string) {
    // delete previous output file
    await this.fs.deleteFile(outputFilePath);
    this.logger.log('Begin video merge');
    const _ffmpeg = ffmpeg();
    return new Promise((resolve, reject) => {
      _ffmpeg
        .input('concat:' + inputFiles.join('|'))
        .output(outputFilePath)
        .outputOptions(['-c copy'])
        .on('start', (commandLine) => {
          this.logger.log(commandLine);
        })
        .on('end', () => {
          this.logger.log('End video merge');
          resolve(outputFilePath);
        })
        .on('error', (err) => {
          this.logger.log('End video merge with error');
          this.logger.error(err);
          reject(new Error(`An error occurred: ${err.message}`));
        })
        .run();
    });
  }

  // TODO: rename this method to generic name
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

  async mp3DurationFormatted(mp3File: string) {
    const duration = await this.mp3Duration(mp3File);
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async getTotalDuration(filePaths: string[]): Promise<number> {
    let totalDuration = 0;

    for (const filePath of filePaths) {
      const duration = await this.mp3Duration(filePath);
      totalDuration += duration;
    }

    return totalDuration;
  }

  // Create a text file with the body copy text
  async prepareDrawtextFilterText(
    bodyCopy: IBodyCopyDrawText,
    referenceFilePath: string,
  ): Promise<{
    textFile: string;
    lineCount: number;
    fontSize: number;
  }> {
    const TITLE_FONT_SIZE = 100;
    const SUBTITLE_FONT_SIZE = 50;
    const TITLE_LINE_WORD_COUNT = 5;
    const TITLE_LINE_MAX_CHAR_COUNT = 22;
    const SUBTITLE_LINE_WORD_COUNT = 10;
    const SUBTITLE_LINE_MAX_CHAR_COUNT = 40;

    //   Split bodyCopy text into lines
    const words = bodyCopy.text.split(' ');
    const lines = [];
    let singleLine = [];
    const maxSingleLineLength =
      bodyCopy.type === 'title'
        ? TITLE_LINE_MAX_CHAR_COUNT
        : SUBTITLE_LINE_MAX_CHAR_COUNT;
    const lineWordCount = 0;

    if (bodyCopy.text.length <= maxSingleLineLength) {
      lines.push(bodyCopy.text);
    } else {
      for (let i = 0; i < words.length; i++) {
        if (
          singleLine.join(' ').length + words[i].length <=
          maxSingleLineLength
        ) {
          singleLine.push(words[i]);
        } else {
          lines.push(singleLine.join(' ').toUpperCase());
          singleLine = [words[i]];
        }

        // Check for the last word
        if (i === words.length - 1) {
          lines.push(singleLine.join(' ').toUpperCase());
        }
      }
    }

    const filePath = this.fs.getFullPathFromFilename(
      referenceFilePath,
      'text-files',
      'txt',
    );

    await this.fs.createFile(filePath, lines.join('\n'));

    return {
      textFile: filePath,
      lineCount: lines.length,
      fontSize:
        bodyCopy.type === 'title' ? TITLE_FONT_SIZE : SUBTITLE_FONT_SIZE,
    };
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
