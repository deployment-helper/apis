import { Injectable } from '@nestjs/common';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

@Injectable()
export class SynthesisService {
  private readonly client: TextToSpeechClient;

  constructor() {
    this.client = new TextToSpeechClient();
  }

  async synthesize(text: string) {
    const request = {
      input: { text },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const [response] = await this.client.synthesizeSpeech(request);
    // convert Unit8Array to buffer
    const buffer = Buffer.from(response.audioContent);
    // return base64 encoded audio
    return { type: 'base64', data: buffer.toString('base64') };
  }
}
