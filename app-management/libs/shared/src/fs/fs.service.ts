import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join, dirname } from 'path';
import { rm, unlink, writeFile } from 'fs/promises';
import { accessSync, existsSync, mkdirSync } from 'fs';

@Injectable()
export class FsService {
  private storageDir: string;
  private readonly logger = new Logger(FsService.name);
  constructor(private readonly config: ConfigService) {
    this.storageDir = this.config.getOrThrow('STORAGE_DIR');
  }

  async createFile(
    filePath: string,
    data: any,
    isBase64?: boolean,
  ): Promise<string> {
    try {
      const fileFullPath = join(this.storageDir, filePath);
      this.logger.log(`Creating file ${fileFullPath}`);

      // Create directory if it does not exist
      const dir = dirname(fileFullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      if (isBase64) {
        await writeFile(fileFullPath, Buffer.from(data, 'base64'));
      } else {
        await writeFile(fileFullPath, data);
      }

      return fileFullPath;
    } catch (e) {
      this.logger.error(e);
    }
  }

  getFullPath(fileName: string) {
    return join(this.storageDir, fileName);
  }

  checkAndCreateDir(dir: string) {
    try {
      const fullPath = join(this.storageDir, dir);
      this.logger.log(`Creating directory ${fullPath}`);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  async deleteFile(filePath: string) {
    try {
      // Check if the file exists
      accessSync(filePath);

      // Delete the file
      await unlink(filePath);
      this.logger.log(`File ${filePath} has been deleted.`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.log(`File ${filePath} does not exist.`);
      } else {
        this.logger.error(`An error occurred: ${error}`);
      }
    }
  }

  async deleteDir(dir: string) {
    try {
      await rm(dir, { recursive: true });
      this.logger.log(`Directory ${dir} has been deleted recursively`);
    } catch (err) {
      this.logger.error(`Error while deleting directory: ${err}`);
    }
  }
}
