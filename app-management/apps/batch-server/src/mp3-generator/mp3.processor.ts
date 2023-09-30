import { Process, Processor } from '@nestjs/bull';
import { join } from 'path';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { REDIS_QUEUE_MP3_GENERATOR } from '../constants';
import { IMp3GeneratorDto } from '../types';
import { S3Service } from '@apps/app-management/aws/s3.service';
import { FsService } from '@app/shared/fs/fs.service';

import { Logger } from '@nestjs/common';
import { exec } from 'child_process';

@Processor(REDIS_QUEUE_MP3_GENERATOR)
export class Mp3Processor {
  private readonly logger = new Logger(Mp3Processor.name);
  constructor(
    private readonly s3: S3Service,
    private readonly config: ConfigService,
    private readonly fs: FsService,
  ) {}

  @Process()
  async record(job: Job<IMp3GeneratorDto>) {
    const mp3Files: Array<string> = [];
    const dirPath = `${job.data.pid}/mp3files`;
    this.logger.log('MP3 file processing started');
    this.fs.createDir(dirPath);

    const metaFileTxt = await this.s3.get(job.data.s3File);
    const metaFileJson = JSON.parse(metaFileTxt);

    // Desc
    let fileName = metaFileJson.desc?.file;
    let mp3Base64 = await this.getMp3File(fileName);
    let fullPath = await this.saveMp3File(dirPath, fileName, mp3Base64);
    mp3Files.push(fullPath);
    this.logger.log(`File ${fullPath} done`);

    // Slides
    const slides = metaFileJson.slides;

    for (const s of slides) {
      // Slide questions english
      fileName = s.questionEn.file;
      mp3Base64 = await this.getMp3File(fileName);
      fullPath = await this.saveMp3File(dirPath, fileName, mp3Base64);
      mp3Files.push(fullPath);
      this.logger.log(`File ${fullPath} done`);

      // Slide questions hindi
      if (s.questionHi) {
        fileName = s.questionEn.file;
        mp3Base64 = await this.getMp3File(fileName);
        fullPath = await this.saveMp3File(dirPath, fileName, mp3Base64);
        mp3Files.push(fullPath);
        this.logger.log(`File ${fullPath} done`);
      }

      // options
      const options = s.options;

      for (const o of options) {
        fileName = o.file;
        mp3Base64 = await this.getMp3File(fileName);
        fullPath = await this.saveMp3File(dirPath, fileName, mp3Base64);
        mp3Files.push(fullPath);
        this.logger.log(`File ${fullPath} done`);
      }

      // Right answer
      fileName = s.rightAnswer.file;
      mp3Base64 = await this.getMp3File(fileName);
      fullPath = await this.saveMp3File(dirPath, fileName, mp3Base64);
      mp3Files.push(fullPath);
      this.logger.log(`File ${fullPath} done`);

      // Explantion
      fileName = s.explanationEn.file;
      mp3Base64 = await this.getMp3File(fileName);
      fullPath = await this.saveMp3File(dirPath, fileName, mp3Base64);
      mp3Files.push(fullPath);
      this.logger.log(`File ${fullPath} done`);
    }

    this.logger.log('Merge started');
    const outputFile = this.fs.getFullPath(join(dirPath, 'merge.mp3'));
    await this.fs.deleteFile(outputFile);
    await this.mergeAllMp3Files(mp3Files, outputFile);
    this.logger.log('Merge end');
    this.logger.log('S3 uploading started');
    await this.s3.readAndUpload(outputFile, join(job.data.pid, 'merge.mp3'));
    this.logger.log('S3 uploading ended');

    this.logger.log('MP3 file processing ended');
  }

  async getMp3File(key: string) {
    const fileTxt = await this.s3.get(key);
    const fileJson = JSON.parse(fileTxt);
    return fileJson.audioContent;
  }

  mp3FileNameFromS3Key(s3Key: string) {
    return `${s3Key.split('audio/')[1]}.mp3`;
  }

  async saveMp3File(dir: string, fileName: string, mp3Data: string) {
    const fullPath = join(dir, this.mp3FileNameFromS3Key(fileName));

    await this.fs.createFile(fullPath, mp3Data, true);

    return this.fs.getFullPath(fullPath);
  }

  mergeAllMp3Files(inputFiles: Array<string>, outputFile) {
    return new Promise((resolve, reject) => {
      this.logger.log('Merging started');
      // Create a string of input files separated by a pipe '|'
      const inputFilesStr = inputFiles.join('|');

      // Construct the FFmpeg command
      const ffmpegCommand = `ffmpeg -i "concat:${inputFilesStr}" -acodec copy ${outputFile}`;

      // Execute the FFmpeg command
      exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing FFmpeg: ${error}`);
          reject(error);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        resolve('done');
      });
    });
  }
}
