import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { dirname, join } from 'path';
import { rm, unlink, writeFile } from 'fs/promises';
import { accessSync, existsSync, mkdirSync } from 'fs';
import { T_FOLDER_GROUPS } from '@app/shared/types';
import { FOLDER_GROUPS } from '@app/shared/constants';

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
      const fileFullPath = filePath?.includes(this.storageDir)
        ? filePath
        : join(this.storageDir, filePath);
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

  getFullPathFromFilename(
    fileName: string,
    group: T_FOLDER_GROUPS,
    ext?: string,
  ) {
    this.logger.log(`Getting full path for ${fileName}`);
    return fileName
      .split('/')
      .map((item) => {
        if (item.includes('.')) {
          return `${item.split('.')[0]}.${ext}`;
        } else if (FOLDER_GROUPS.includes(item as T_FOLDER_GROUPS)) {
          return group;
        } else {
          return item;
        }
      })
      .join('/');
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
