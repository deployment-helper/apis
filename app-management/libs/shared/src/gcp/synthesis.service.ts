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
          data: this.mergeFiles(audios.map((a) => a.data as Uint8Array)),
        },
      ];
    }

    return audios.map((a) => ({
      type: a.type,
      data: Buffer.from(a.data as Uint8Array).toString('base64'),
    }));
  }

  private mergeFiles(audioBuffers: Uint8Array[]): string {
    const totalDataSize = audioBuffers.reduce(
      (acc, buffer) => acc + buffer.length,
      0,
    );

    const mergedBuffer = Buffer.alloc(totalDataSize);

    // Concatenate the data sections
    let offset = 0;
    audioBuffers.forEach((buffer) => {
      // @ts-ignore: Buffer.copy is compatible with Uint8Array
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
        // Do not chage audioEncoding as MP3 is good format to merge files directly.
        // If you want to change it, you need to change the mergeFiles function as well
        // to handle different audio formats.
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

  async synthesizeMultiVoiceConversation(
    conversationText: string,
  ): Promise<{ type: string; data: string }> {
    // Parse the conversation text to extract speakers and their lines
    const lines = conversationText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Extract unique speakers from the conversation
    const speakers = new Set<string>();
    const conversationLines: { speaker: string; text: string }[] = [];

    lines.forEach((line) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const speaker = line.substring(0, colonIndex).trim();
        const text = line.substring(colonIndex + 1).trim();
        speakers.add(speaker);
        conversationLines.push({ speaker, text });
      }
    });

    // Define voice assignments for each speaker
    const voiceAssignments = this.assignVoicesToSpeakers(Array.from(speakers));

    this.logger.log(
      `Found ${speakers.size} speakers: ${Array.from(speakers).join(', ')}`,
    );
    this.logger.log('Voice assignments:', voiceAssignments);

    // Generate audio for each line
    const audioSegments = await Promise.all(
      conversationLines.map(async ({ speaker, text }) => {
        const voiceConfig = voiceAssignments[speaker];
        return await this.synthesizeText(
          text,
          'en-US', // English US only as specified
          1.0, // Default speaking rate
          voiceConfig.voiceName,
        );
      }),
    );

    // Merge all audio segments into a single file
    const mergedAudio = this.mergeFiles(
      audioSegments.map((segment) => segment.data),
    );

    this.logger.log(
      `Successfully generated multi-voice conversation with ${conversationLines.length} segments`,
    );

    return {
      type: 'base64',
      data: mergedAudio,
    };
  }

  private assignVoicesToSpeakers(
    speakers: string[],
  ): Record<string, { voiceName: string; gender: string }> {
    // Predefined English US voices from Google Cloud Text-to-Speech
    const availableVoices = [
      { voiceName: 'en-US-Journey-D', gender: 'Male' },
      { voiceName: 'en-US-Journey-F', gender: 'Female' },
      { voiceName: 'en-US-Neural2-A', gender: 'Male' },
      { voiceName: 'en-US-Neural2-C', gender: 'Female' },
      { voiceName: 'en-US-Neural2-D', gender: 'Male' },
      { voiceName: 'en-US-Neural2-E', gender: 'Female' },
      { voiceName: 'en-US-Neural2-F', gender: 'Female' },
      { voiceName: 'en-US-Neural2-G', gender: 'Female' },
      { voiceName: 'en-US-Neural2-H', gender: 'Female' },
      { voiceName: 'en-US-Neural2-I', gender: 'Male' },
      { voiceName: 'en-US-Neural2-J', gender: 'Male' },
    ];

    const assignments: Record<string, { voiceName: string; gender: string }> =
      {};

    speakers.forEach((speaker, index) => {
      // Assign voices in a round-robin fashion
      const voiceIndex = index % availableVoices.length;
      assignments[speaker] = availableVoices[voiceIndex];
    });

    return assignments;
  }
}
