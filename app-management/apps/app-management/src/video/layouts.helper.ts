import { v4 as uuid } from 'uuid';
/**
 * Helper functions to identify image files based on extension
 * Similar to getVideosFromAssets in the frontend
 */
export function getImagesFromAssets(assets: string[] = []): string[] {
  const imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.bmp',
  ];
  return assets.filter((asset) =>
    imageExtensions.some((ext) => asset.toLowerCase().endsWith(ext)),
  );
}

/**
 * Helper functions to identify video files based on extension
 * Similar to getVideosFromAssets in the frontend
 */
export function getVideosFromAssets(assets: string[] = []): string[] {
  const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
  return assets.filter((asset) =>
    videoExtensions.some((ext) => asset.toLowerCase().endsWith(ext)),
  );
}

/**
 * Based on the frontend's layouts.ts file
 * Maps layout IDs to their content structure for proper scene generation
 */
export const LAYOUTS = {
  layout1: {
    content: {
      title: {
        type: 'input',
        name: 'title',
        bodyCopyType: 'title',
        value: 'Title',
        placeholder: 'Title',
      },
      subtitle: {
        type: 'input',
        name: 'subtitle',
        bodyCopyType: 'subtitle',
        value: 'Subtitle',
        placeholder: 'Subtitle',
      },
    },
    prepareContent: (raw: any) => {
      // Accepts string or object with title/subtitle
      const content = JSON.parse(JSON.stringify(LAYOUTS.layout1.content));
      if (typeof raw === 'object' && raw !== null) {
        if (raw.title) content.title.value = raw.title;
        if (raw.subtitle) content.subtitle.value = raw.subtitle;
      } else {
        content.title.value = raw;
      }
      return content;
    },
  },
  layout2: {
    content: {
      image: {
        type: 'image',
        name: 'image',
        value: '/no-image.png',
        placeholder: 'Image',
      },
    },
    prepareContent: (raw: any) => {
      const content = JSON.parse(JSON.stringify(LAYOUTS.layout2.content));
      if (typeof raw === 'string') {
        content.image.value = raw;
      } else if (raw && raw.image) {
        content.image.value = raw.image;
      }
      return content;
    },
  },
  layout3: {
    content: {
      title: {
        type: 'input',
        name: 'title',
        bodyCopyType: 'title',
        value: 'Title',
        placeholder: 'Title',
      },
    },
    prepareContent: (raw: any) => {
      const content = JSON.parse(JSON.stringify(LAYOUTS.layout3.content));
      content.title.value = typeof raw === 'string' ? raw : raw?.title || '';
      return content;
    },
  },
  layout4: {
    content: {
      video: {
        type: 'video',
        name: 'video',
        value: '',
        placeholder: 'video',
      },
    },
    prepareContent: (raw: any) => {
      const content = JSON.parse(JSON.stringify(LAYOUTS.layout4.content));
      if (typeof raw === 'string') {
        content.video.value = raw;
      } else if (raw && raw.video) {
        content.video.value = raw.video;
      }
      return content;
    },
  },
  layout5: {
    content: {
      image: {
        type: 'image',
        name: 'image',
        value: '',
        placeholder: 'video',
      },
      title: {
        type: 'input',
        name: 'title',
        bodyCopyType: 'title',
        value: 'Title',
        placeholder: 'Title',
      },
    },
    prepareContent: (raw: any) => {
      const content = JSON.parse(JSON.stringify(LAYOUTS.layout5.content));
      if (typeof raw === 'object' && raw !== null) {
        if (raw.image) content.image.value = raw.image;
        if (raw.title) content.title.value = raw.title;
      } else {
        content.title.value = raw;
      }
      return content;
    },
  },
  layout6: {
    content: {
      video: {
        type: 'video',
        name: 'video',
        value: '',
        placeholder: 'video',
      },
      title: {
        type: 'input',
        name: 'title',
        bodyCopyType: 'title',
        value: 'Title',
        placeholder: 'Title',
      },
    },
    prepareContent: (raw: any) => {
      const content = JSON.parse(JSON.stringify(LAYOUTS.layout6.content));
      if (typeof raw === 'object' && raw !== null) {
        if (raw.video) content.video.value = raw.video;
        if (raw.title) content.title.value = raw.title;
      } else {
        content.title.value = raw;
      }
      return content;
    },
  },
  layout7: {
    content: {
      image: {
        type: 'image',
        name: 'image',
        value: '',
        placeholder: 'image',
      },
    },
    prepareContent: (raw: any) => {
      const content = JSON.parse(JSON.stringify(LAYOUTS.layout7.content));
      if (typeof raw === 'string') {
        content.image.value = raw;
      } else if (raw && raw.image) {
        content.image.value = raw.image;
      }
      return content;
    },
  },
  layout8: {
    content: {
      question: {
        type: 'input',
        name: 'question',
        bodyCopyType: 'title',
        value: 'What is your question?',
        placeholder: 'Enter your question',
      },
      options: {
        type: 'input',
        name: 'options',
        bodyCopyType: 'subtitle',
        value:
          '[{"text": "Option 1", "isCorrect": true}, ' +
          '{"text": "Option 2", "isCorrect": false}]',
        placeholder: 'Add JSON array of options with isCorrect flag',
      },
      isShowAnswer: {
        type: 'input',
        name: 'isShowAnswer',
        value: 'false',
        placeholder: 'true/false',
      },
    },
    prepareContent: (raw: any) => {
      const content = JSON.parse(JSON.stringify(LAYOUTS.layout8.content));
      if (typeof raw === 'object' && raw !== null) {
        if (raw.question) content.question.value = raw.question;
        if (raw.options) content.options.value = JSON.stringify(raw.options);
        if (raw.isShowAnswer !== undefined) {
          content.isShowAnswer.value = String(raw.isShowAnswer);
        }
      } else {
        content.question.value = raw;
      }
      return content;
    },
  },
  layout9: {
    content: {
      question: {
        type: 'input',
        name: 'question',
        bodyCopyType: 'title',
        value: 'What is your question?',
        placeholder: 'Enter your question',
      },
      correctAnswer: {
        type: 'input',
        name: 'correctAnswer',
        bodyCopyType: 'subtitle',
        value: 'The correct answer',
        placeholder: 'Enter the correct answer',
      },
      explanation: {
        type: 'input',
        name: 'explanation',
        bodyCopyType: 'body',
        value: 'Explanation for the correct answer',
        placeholder: 'Enter explanation for why this is correct',
      },
    },
    prepareContent: (raw: any) => {
      const content = JSON.parse(JSON.stringify(LAYOUTS.layout9.content));
      if (typeof raw === 'object' && raw !== null) {
        if (raw.question) content.question.value = raw.question;
        if (raw.correctAnswer) content.correctAnswer.value = raw.correctAnswer;
        if (raw.explanation) content.explanation.value = raw.explanation;
      } else {
        content.question.value = raw;
      }
      return content;
    },
  },
};

/**
 * Identifies if a layout uses images or videos as its primary media asset
 * @param layoutId The layout identifier
 * @returns The type of asset ('image' or 'video') or null if not applicable
 */
export function getLayoutAssetType(layoutId: string): 'image' | 'video' | null {
  const layout = LAYOUTS[layoutId];
  if (!layout) return null;

  if (layout.content.video) return 'video';
  if (layout.content.image) return 'image';
  return null;
}

/**
 * Gets a suitable default asset from available assets based on layout type
 * Implements logic similar to the frontend's getLayout function
 * @param layoutId The layout identifier
 * @param useRandomAsset Whether to select a random asset
 * @param assets Array of asset URLs
 * @returns Selected asset URL or empty string if none available
 */
export function getDefaultAsset(
  layoutId: string,
  useRandomAsset = false,
  assets: string[] = [],
): string {
  if (!assets.length) return '';

  const assetType = getLayoutAssetType(layoutId);
  if (!assetType) return '';

  // Filter assets by type like the frontend does
  let filteredAssets: string[] = [];

  if (assetType === 'video') {
    filteredAssets = getVideosFromAssets(assets);
  } else if (assetType === 'image') {
    filteredAssets = getImagesFromAssets(assets);
  }

  if (!filteredAssets.length) return ''; // No matching assets

  // Select random or first asset
  if (useRandomAsset) {
    const randomIndex = Math.floor(Math.random() * filteredAssets.length);
    return filteredAssets[randomIndex];
  }

  return filteredAssets[0];
}

/**
 * Gets a layout content structure by ID with optional asset/description customization
 * Mimics the frontend getLayout behavior
 */
export function getLayoutContent(
  layoutId: string,
  raw?: any,
) {
  const layout = LAYOUTS[layoutId];
  if (!layout) {
    return null;
  }

  const contentCopy = layout.prepareContent
    ? layout.prepareContent(raw)
    : JSON.parse(JSON.stringify(layout.content));
  
  return contentCopy
}

/**
 * Prepares an array of scene content objects based on video type, layout, and raw content array.
 * @param videoType The type of video ('message' | 'mcq')
 * @param layoutId The layout identifier
 * @param rawContentArr Array of raw content (e.g., descriptions, questions)
 * @returns Array of scene content objects
 */
export function prepareScenesContent(
  videoType: 'message' | 'mcq',
  layoutId: string,
  rawContentArr: any[],
) {
  const scenes: Array<Record<string, any>> = [];
  rawContentArr.forEach((raw) => {
    let content: Record<string, any> = {};
    if (videoType === 'message') {
      // message type works with layouts those have single content filed
      // that content filed will have same filed value and description
      // For message, treat raw as description/title
      content = getLayoutContent(layoutId, raw);
      scenes.push({
        content,
        description: raw.desc ? raw.desc : raw,
        layoutId,
        id: uuid(),
      });
    } else if (videoType === 'mcq') {
      const questionContent = getLayoutContent('layout3', raw.question);
      const optionsContent = getLayoutContent('layout8', raw);
      const rightOptionsContent = getLayoutContent('layout8', {...raw, isShowAnswer: true});
      const explanationContent = getLayoutContent('layout9', raw);
      scenes.push({
        content: questionContent,
        layoutId: 'layout3',
        description: raw.questionDescription,
        id: uuid(),
      });
      scenes.push({
        content: optionsContent,
        layoutId: 'layout8',
        description: raw.optionsDescription,
        id: uuid(),
      });
      scenes.push({
        content: rightOptionsContent,
        layoutId: 'layout8',
        description: raw.correctAnswerDescription,
        id: uuid(),
      });
      scenes.push({
        content: explanationContent,
        layoutId: 'layout9',
        description: raw.explanationDescription,
        id: uuid(),
      });
    } else {
      console.warn('Unknown video type:', videoType);
      scenes.push({
        content,
        layoutId,
      });
    }    
  });

  return scenes;
}
