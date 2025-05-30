import { Injectable, Logger } from '@nestjs/common';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { S3Service } from '@app/shared/aws/s3.service';

@Injectable()
export class SynthesisService {
  private readonly client: TextToSpeechClient;
  private readonly TTS_SERVER_URL: string;
  logger = new Logger(SynthesisService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly http: HttpService,
    private readonly s3: S3Service,
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
    speakerRefFile?: string,
  ): Promise<{ type: string; data: string }[]> {
    const audios = await Promise.all(
      text.map((t) =>
        audioLanguage.startsWith('tts')
          ? this.synthesizeTextTTS(t, audioLanguage, speakerRefFile)
          : this.synthesizeText(t, audioLanguage, speakingRate, voiceCode),
      ),
    );
    if (merge) {
      return [
        {
          type: 'base64',
          data: this.mergeFiles(audios.map((a) => a.data)),
        },
      ];
    }

    return audios.map((a) => ({
      type: a.type,
      data: Buffer.from(a.data).toString('base64'),
    }));
  }

  private mergeFiles(audioBuffers: Uint8Array[]): string {
    const headerSize = 0; // MP3 files do not have a fixed header size like WAV files
    const totalDataSize = audioBuffers.reduce(
      (acc, buffer) => acc + buffer.length,
      0,
    );

    const mergedBuffer = Buffer.alloc(totalDataSize);

    // Concatenate the data sections
    let offset = 0;
    audioBuffers.forEach((buffer) => {
      // @ts-ignore
      buffer.copy(mergedBuffer, offset);
      offset += buffer.length;
    });

    return mergedBuffer.toString('base64');
  }

  private async synthesizeText(
    text: string,
    audioLanguage: string,
    speakingRate: number,
    voiceCode: string,
  ): Promise<{ type: string; data: Uint8Array }> {
    this.logger.log('GCP synthesis');
    const request = {
      input: { text },
      voice: { languageCode: audioLanguage, name: voiceCode },
      audioConfig: {
        audioEncoding: 'MP3',
        // TODO: This speaking rate and pitch parameters needs to be configurable
        // and should be passed from the client if project language supports it. For now, we are using as default.
        speakingRate: speakingRate,
        pitch: 0,
      },
    };
    this.logger.log('req', request);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const [response] = await this.client.synthesizeSpeech(request);
    return { type: 'base64', data: response.audioContent };
  }

  private async synthesizeTextTTS(
    text: string,
    language: string,
    speakerRefFile?: string,
    speaker = 'Tanja Adelina',
  ) {
    this.logger.log('TTS synthesis');
    //send a post request to TTS server to synthesize the text
    const ttsLangCode = language.split('-')[1] || 'en';
    const body = {
      text,
      language: ttsLangCode,
      speaker,
      speaker_ref: this.s3.getKeyFromPublicUrl(speakerRefFile),
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
