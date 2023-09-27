import { Injectable } from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly s3Bucket: string;
  constructor() {
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

  async get(key: string): Promise<any> {
    if (!key) {
      return undefined;
    }
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

    const data = await resp.Body.transformToString();
    return data;
  }
}
