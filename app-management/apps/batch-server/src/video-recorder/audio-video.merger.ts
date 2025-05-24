import { Injectable, Logger } from '@nestjs/common';
import { TSlideInfo } from './types';
import { FsService } from '@app/shared/fs/fs.service';
import { FfmpegService } from '@app/shared/ffmpeg.service';
import { IBodyCopyDrawText } from '@app/shared/types';

// Define layout types and their configurations
interface LayoutConfig {
  mediaType: 'image' | 'video';
  includeTitle: boolean;
}

// Layout configuration mapping
// TODO: This layout configuration should be moved to a separate file
const LAYOUT_CONFIG: Record<string, LayoutConfig> = {
  layout1: {
    mediaType: 'image',
    includeTitle: false,
  },
  layout2: {
    mediaType: 'image',
    includeTitle: false,
  },
  layout3: {
    mediaType: 'image',
    includeTitle: false,
  },
  layout4: {
    mediaType: 'video',
    includeTitle: false,
  },
  layout5: {
    mediaType: 'image',
    includeTitle: true,
  },
  layout6: {
    mediaType: 'video',
    includeTitle: true,
  },
  layout7: {
    mediaType: 'image',
    includeTitle: false,
  },
  layout8: {
    mediaType: 'image',
    includeTitle: false,
  },
  layout9: {
    mediaType: 'image',
    includeTitle: false,
  },
  // Add new layouts here following the same pattern
};

@Injectable()
export class AudioVideoMerger {
  private readonly logger = new Logger(AudioVideoMerger.name);

  constructor(private fs: FsService, private ffmpeg: FfmpegService) {}

  async merge(
    scenesInfo: TSlideInfo[],
    slideAudios: TSlideInfo[],
    isSkipFirtAndLastSlide = true,
  ) {
    const videos: string[] = [];
    this.logger.log('Begin Merge');
    for (let i = 0; i < scenesInfo.length; i++) {
      // We are start and end slide in our application to have reveal.js layout work properly
      // So we need to trim the video to remove start and end slide
      // continue if first and last slide
      if (isSkipFirtAndLastSlide && (i === 0 || i === scenesInfo.length - 1)) {
        continue;
      }
      const sceneInfo = scenesInfo[i];
      const sceneAudio = slideAudios[i];

      this.logger.log(`Slide no ${i}`);
      if (!sceneAudio.file.length) {
        this.logger.log(`Continue ${sceneInfo}`);
        this.logger.warn('No audio file found for slide');
        continue;
      }
      if (!sceneInfo.layoutId) {
        this.logger.log(`Continue ${sceneInfo}`);
        this.logger.warn('No layout found for slide');
        continue;
      }

      const filename = sceneAudio.meta.filename;
      const videoId = sceneAudio.meta.pid;

      this.logger.log('Create video file');
      this.fs.checkAndCreateDir(`${videoId}/video-files`);
      const videoPath = this.fs.getFullPath(
        `${videoId}/video-files/${filename}.mp4`,
      );
      // TODO: caption is not synced and not working for some languages like Hindi.
      //  disabling it for now
      // const captionVideoPath = this.fs.getFullPath(
      //   `${videoId}/video-files/${filename}-caption.mp4`,
      // );
      this.logger.log('Start ffmpeg');
      try {
        this.logger.debug(sceneInfo);
        await this.processLayout(
          sceneAudio.file,
          sceneInfo.file,
          videoPath,
          sceneInfo.layoutId,
          sceneInfo.meta,
        );

        // this.logger.log('Add caption to video');
        // TODO: caption is not synced and not working for some languages like Hindi.
        //  disabling it for now
        // await this.ffmpeg.addCaptionToVideo(
        //   videoPath,
        //   captionVideoPath,
        //   sceneInfo.description || '',
        //   sceneInfo.meta.language,
        //   // TODO read wordsPerSubtitle form video
        //   10,
        // );
      } catch (e) {
        this.logger.error(e);
      }

      this.logger.log('Stop ffmpeg');
      videos.push(videoPath);
    }
    this.logger.log('End Merge');
    return videos;
  }

  /**
   * Process layout based on configuration
   * @param mp3FilePath Audio file path
   * @param mediaFilePath Image or video file path
   * @param outputFilePath Output file path
   * @param layout Layout type
   * @param meta Metadata containing title information
   */
  async processLayout(
    mp3FilePath: string,
    mediaFilePath: string,
    outputFilePath: string,
    layout: string,
    meta: any,
  ) {
    const config = LAYOUT_CONFIG[layout];

    if (!config) {
      this.logger.error(`Layout not found ${layout}`);
      return;
    }

    // Prepare title configuration if needed
    const bodyCopy = config.includeTitle
      ? { text: meta.title, type: 'title' as const }
      : undefined;

    // Process based on media type
    if (config.mediaType === 'image') {
      // Get applyDefaultAnimation from scene meta or config with a default of true
      const applyAnimation = !!meta?.applyDefaultAnimation;

      await this.processMp3AndImage(
        mp3FilePath,
        mediaFilePath,
        outputFilePath,
        bodyCopy,
        applyAnimation,
      );
    } else if (config.mediaType === 'video') {
      await this.processMp3AndVideo(
        mp3FilePath,
        mediaFilePath,
        outputFilePath,
        bodyCopy,
      );
    }
  }

  /**
   * Process MP3 and image files
   */
  private async processMp3AndImage(
    mp3FilePath: string,
    imageFilePath: string,
    outputFilePath: string,
    bodyCopy?: IBodyCopyDrawText,
    applyDefaultAnimation = false,
  ) {
    await this.ffmpeg.mergeMp3AndImage(
      mp3FilePath,
      imageFilePath,
      outputFilePath,
      bodyCopy,
      applyDefaultAnimation,
    );
  }

  /**
   * Process MP3 and video files
   */
  private async processMp3AndVideo(
    mp3FilePath: string,
    videoFilePath: string,
    outputFilePath: string,
    bodyCopy?: IBodyCopyDrawText,
  ) {
    await this.ffmpeg.mergeMp3AndVideo(
      mp3FilePath,
      videoFilePath,
      outputFilePath,
      bodyCopy,
    );
  }
}
