import { Injectable, Logger } from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { readFile } from 'fs/promises';
import { FsService } from '@app/shared/fs/fs.service';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly s3Bucket: string;
  logger = new Logger(S3Service.name);

  constructor(private readonly fs: FsService) {
    this.client = new S3Client({ region: 'ap-south-1' });
    this.s3Bucket = 'vm-presentations';
  }

  create(json: any, name: string): Promise<any> {
    const putCommand = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: name,
      Body: JSON.stringify(json),
    });
    return this.client.send(putCommand);
  }

  generateFolder(fileName: string): { folder: string; s3Loc: string } {
    return {
      folder: `${fileName}/presentation.json`,
      s3Loc: `s3://${this.s3Bucket}/${fileName}/presentation.json`,
    };
  }

  getKeyFromS3Url(s3Loc: string) {
    return s3Loc.includes('s3://')
      ? s3Loc.replace(`s3://${this.s3Bucket}/`, '')
      : s3Loc;
  }

  getKeyFromPublicUrl(publicUrl: string) {
    return publicUrl.includes('https://')
      ? publicUrl.replace(
          `https://${this.s3Bucket}.s3.ap-south-1.amazonaws.com/`,
          '',
        )
      : publicUrl;
  }

  async get(key: string): Promise<any> {
    const bucketKey = this.getKeyFromS3Url(key);
    const command = new GetObjectCommand({
      Bucket: this.s3Bucket,
      Key: bucketKey,
    });

    const resp: any = await this.client.send(command).catch(() => {
      console.log('S3 Error, file=' + key);
    });

    if (!resp) {
      return undefined;
    }

    return resp.Body;
  }

  /**
   * Get text file from S3
   * @param key
   */
  async getAsString(key: string): Promise<any> {
    const body = await this.get(key);

    const data = await body.transformToString();
    return data;
  }

  async getObject(key: string): Promise<any> {
    if (!key) {
      return undefined;
    }

    const command = new GetObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
    });

    const resp: any = await this.client.send(command).catch(() => {
      this.logger.error('S3 Error, file=' + key);
    });

    if (!resp) {
      return undefined;
    }

    const data = await resp.Body;
    return data;
  }

  set(key: string, data: any) {
    const putCommand = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
      Body: data,
    });

    return this.client.send(putCommand);
  }

  async readAndUpload(filePath, key) {
    const fileContent = await readFile(filePath).catch((error) => {
      console.error(error);
    });
    return this.set(key, fileContent);
  }

  mp3FileNameFromS3Key(s3Key: string, withExtension = true) {
    if (s3Key.split('audio/').length >= 2) {
      return `${s3Key.split('audio/')[1]}${withExtension ? '.mp3' : ''}`;
    } else {
      return s3Key;
    }
  }

  presentationIdFromS3Key(s3Key: string) {
    return s3Key.split('audio/')[0];
  }

  // create S3 signed URL to upload the file
  async getSignedUrl(key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    return url;
  }

  // create a S3 signed URL to download the file
  async getSignedUrlForDownload(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    return url;
  }

  // make public URL for S3 object
  async makePublic(key: string) {
    const command = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
      ACL: 'public-read',
    });

    await this.client.send(command);
  }

  getPublicUrl(key: string): string {
    return `https://${this.s3Bucket}.s3.ap-south-1.amazonaws.com/${key}`;
  }

  async getFileAndSave(key: string, filePath?: string) {
    const _key = this.getKeyFromPublicUrl(key);
    const body = await this.get(_key);

    const chunks = [];
    for await (const chunk of body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const downloadedFile = await this.fs.createFile(filePath || _key, buffer);

    return downloadedFile;
  }
}
