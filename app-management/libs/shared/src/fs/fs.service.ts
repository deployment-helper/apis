import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { unlink, writeFile } from 'fs/promises';
import { accessSync, existsSync, mkdirSync } from 'fs';

@Injectable()
export class FsService {
  private storageDir: string;
  constructor(private readonly config: ConfigService) {
    this.storageDir = this.config.getOrThrow('STORAGE_DIR');
  }

  async createFile(
    filePath: string,
    data: any,
    isBase64?: boolean,
  ): Promise<string> {
    const fileFullPath = join(this.storageDir, filePath);
    if (isBase64) {
      await writeFile(fileFullPath, Buffer.from(data, 'base64'));
    }

    await writeFile(fileFullPath, data);

    return fileFullPath;
  }

  getFullPath(fileName: string) {
    return join(this.storageDir, fileName);
  }

  checkAndCreateDir(dir: string) {
    const fullPath = join(this.storageDir, dir);

    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
    }
  }

  async deleteFile(filePath: string) {
    try {
      // Check if the file exists
      accessSync(filePath);

      // Delete the file
      await unlink(filePath);
      console.log(`File ${filePath} has been deleted.`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`File ${filePath} does not exist.`);
      } else {
        console.error(`An error occurred: ${error}`);
      }
    }
  }
}
