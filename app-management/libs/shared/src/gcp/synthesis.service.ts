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
      text.map((t) =>
        audioLanguage.startsWith('tts')
          ? this.synthesizeTextTTS(t, audioLanguage)
          : this.synthesizeText(t, audioLanguage, speakingRate, voiceCode),
      ),
    );
    if (merge) {
      return [
        {
          type: 'base64',
          data: this.mergeWavFiles(audios.map((a) => a.data)),
        },
      ];
    }

    return audios.map((a) => ({
      type: a.type,
      data: Buffer.from(a.data).toString('base64'),
    }));
  }

  private mergeWavFiles(audioBuffers: Uint8Array[]): string {
    const headerSize = 44;
    const dataBuffers = audioBuffers.map((buffer) =>
      Buffer.from(buffer.slice(headerSize)),
    );
    const totalDataSize = dataBuffers.reduce(
      (acc, buffer) => acc + buffer.length,
      0,
    );
    const totalSize = totalDataSize + headerSize;

    const mergedBuffer = Buffer.alloc(totalSize);

    // Copy the header from the first file
    Buffer.from(audioBuffers[0]).copy(mergedBuffer, 0, 0, headerSize);

    // Update the file size in the header
    mergedBuffer.writeUInt32LE(totalSize - 8, 4);
    mergedBuffer.writeUInt32LE(totalDataSize, 40);

    // Concatenate the data sections
    let offset = headerSize;
    dataBuffers.forEach((buffer) => {
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
    const request = {
      input: { text },
      voice: { languageCode: audioLanguage, name: voiceCode },
      audioConfig: {
        audioEncoding: 'LINEAR16',
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
