import { Injectable } from '@nestjs/common';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

@Injectable()
export class SynthesisService {
  private readonly client: TextToSpeechClient;

  constructor() {
    this.client = new TextToSpeechClient();
  }

  async synthesize(
    text: string[],
    merge?: true,
  ): Promise<{ type: string; data: string }[]> {
    const audios = await Promise.all(text.map((t) => this.synthesizeText(t)));
    if (!merge) {
      return [
        {
          type: 'base64',
          data: Buffer.concat(audios.map((a) => a.data)).toString('base64'),
        },
      ];
    }

    return audios.map((a) => ({
      type: a.type,
      data: Buffer.from(a.data).toString('base64'),
    }));
  }
  private async synthesizeText(
    text: string,
  ): Promise<{ type: string; data: Uint8Array }> {
    const request = {
      input: { text },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const [response] = await this.client.synthesizeSpeech(request);
    return { type: 'base64', data: response.audioContent };
  }
}
