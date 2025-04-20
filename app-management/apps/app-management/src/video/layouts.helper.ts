import { ELanguage } from '@app/shared/types';

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
  asset?: string,
  description?: string,
) {
  const layout = LAYOUTS[layoutId];
  if (!layout) {
    return null;
  }

  // Create a deep copy to avoid modifying the original
  const contentCopy = JSON.parse(JSON.stringify(layout.content));

  // Apply asset to appropriate field based on layout type
  if (asset) {
    if (contentCopy.image) {
      contentCopy.image.value = asset;
    }
    if (contentCopy.video) {
      contentCopy.video.value = asset;
    }
  }

  // Apply description to title if available
  if (description && contentCopy.title) {
    contentCopy.title.value = description;
  }

  return contentCopy;
}
