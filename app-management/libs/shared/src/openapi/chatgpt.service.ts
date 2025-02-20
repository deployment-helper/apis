import { Injectable, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';
import { ELanguage } from '@app/shared/types';
import * as fs from 'fs';

@Injectable()
export class ChatgptService {
  openapi: OpenAI;
  logger = new Logger(ChatgptService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
    this.openapi = new OpenAI({
      apiKey,
    });
  }

  async translateText(
    text: string,
    language: ELanguage,
    targetLanguage: ELanguage,
  ): Promise<string> {
    const prompt = `Translate the following ${language} text to ${targetLanguage} language and use ${targetLanguage} fonts, use common ${targetLanguage} language words and casual tone, use English language for acronym, use english for common words in ${targetLanguage} language, return only translated text "${text}"`;

    return await this.sentPrompt(prompt);
  }

  async sceneDescToVisualDesc(sceneDesc: string): Promise<string> {
    const prompt = `Convert the following 
    
    "${sceneDesc}"
    
    scene description to visual description. 
    I will be using that visual description to search images on midjourney.com.
    midjourney.com works best with small visual descriptions like 30 to 60 words.
    
    use this pattern to create visual description:
    Subject + Action + Setting + Mood + Style
    
    provide visual description in single sentence
    
    `;
    return await this.sentPrompt(prompt);
  }

  async generateScenesScript(
    filePath: string,
    promptFilePath: string,
  ): Promise<string> {
    const prompt = fs.readFileSync(promptFilePath);
    return await this.sentPromptWithFile(prompt.toString(), filePath);
  }

  private async sentPrompt(text: string): Promise<string> {
    this.logger.log(`Sending prompt to OpenAI: ${text}`);
    const completion = await this.openapi.chat.completions.create({
      // model: 'gpt-3.5-turbo',
      // TODO: model selection should be configurable
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: text,
        },
      ],
    });

    return completion.choices[0].message.content;
  }

  async sentPromptWithFile(text: string, filePath: string): Promise<string> {
    this.logger.log(`Sending prompt with File ${filePath} to OpenAI: ${text}`);
    //const uploadResponse = await this.uploadFile(filePath);
    const subtitle = fs.readFileSync(filePath);
    const completion = await this.openapi.chat.completions.create({
      // model: 'gpt-3.5-turbo',
      // TODO: model selection should be configurable
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: text,
        },
        {
          role: 'user',
          content: `use this as input data ${subtitle}`,
        },
      ],
    });

    let response = '';
    for (let i = 0; i < completion.choices.length; i++) {
      const choice = completion.choices[i];
      response += choice.message.content;
    }

    return response;
  }

  async uploadFile(filePath: string): Promise<void> {
    const fileStream = fs.createReadStream(filePath);

    try {
      const response = await this.openapi.files.create({
        purpose: 'fine-tune', // Adjust the purpose based on your use case
        file: fileStream,
      });
      console.log('File uploaded:', response);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }
}
