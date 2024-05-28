import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  async cropImage(
    imageBuffer: Buffer,
    cropOptions: {
      top: number;
      left: number;
      bottom: number;
      right: number;
    },
  ): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      const width = metadata.width - cropOptions.left - cropOptions.right;
      const height = metadata.height - cropOptions.top - cropOptions.bottom;

      const outputBuffer = await image
        .extract({
          left: cropOptions.left,
          top: cropOptions.top,
          width: width,
          height: height,
        })
        .toBuffer();
      return outputBuffer;
    } catch (error) {
      this.logger.error(
        `An error occurred while cropping the image: ${error.message}`,
      );
      throw error;
    }
  }
}
