import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

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
}
