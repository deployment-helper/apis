import { Injectable } from '@nestjs/common';

@Injectable()
export class ImageGenerationService {
  getHello(): string {
    return 'Hello World!';
  }
}
