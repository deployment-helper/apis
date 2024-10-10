import { Injectable } from '@nestjs/common';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

/**
 * This service is not in use needs to be removed.
 */
@Injectable()
export class SnsService {
  private readonly client: SNSClient;
  private readonly topicArn: string;

  constructor() {
    this.client = new SNSClient({ region: 'ap-south-1' });
    this.topicArn = 'arn:aws:sns:ap-south-1:168490963129:generateAudio';
  }

  publishMessage(message: string): Promise<any> {
    const command = new PublishCommand({
      TopicArn: this.topicArn,
      Message: message,
    });

    return this.client.send(command);
  }
}
