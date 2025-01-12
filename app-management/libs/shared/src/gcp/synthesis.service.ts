import { Injectable, Logger } from '@nestjs/common';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SynthesisService {
  private readonly client: TextToSpeechClient;
  private readonly TTS_SERVER_URL: string;
  logger = new Logger(SynthesisService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly http: HttpService,
  ) {
    this.client = new TextToSpeechClient();
    this.TTS_SERVER_URL =
      this.configService.getOrThrow<string>('TTS_SERVER_URL');
  }

  async synthesize(
    text: string[],
    speakingRate: number,
    voiceCode: string,
    audioLanguage: string,
    merge = true,
  ): Promise<{ type: string; data: string }[]> {
    const audios = await Promise.all(
      text.map((t) => this.synthesizeTextTTS(t, audioLanguage)),
    );
    if (merge) {
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
    audioLanguage: string,
    speakingRate: number,
    voiceCode: string,
  ): Promise<{ type: string; data: Uint8Array }> {
    const request = {
      input: { text },
      voice: { languageCode: audioLanguage, name: voiceCode },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: speakingRate,
        pitch: 0,
      },
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const [response] = await this.client.synthesizeSpeech(request);
    return { type: 'base64', data: response.audioContent };
  }

  private async synthesizeTextTTS(
    text: string,
    language: string,
    speaker = 'Tanja Adelina',
    referenceAudio?: string,
  ) {
    //send a post request to TTS server to synthesize the text
    const ttsLangCode = language === language.split('-')[0] || 'en';
    const body = {
      text,
      language: ttsLangCode,
      speaker,
    };

    this.logger.log(`Synthesizing text: ${text} with language: ${language}`);
    const url = `${this.TTS_SERVER_URL}/api/synthesize`;

    try {
      this.logger.log(
        `Sending request to ${url} with body: ${JSON.stringify(body)}`,
      );
      const resp = await firstValueFrom(this.http.post(url, body));
      const data = resp.data;
      return {
        type: 'base64',
        data: Buffer.from(data.audioContent, 'base64'),
      };
    } catch (error) {
      this.logger.error(`Error in synthesizeTextTTS: ${error}`);
      return { type: 'base64', data: new Uint8Array(Buffer.from('')) };
    }
  }
}
