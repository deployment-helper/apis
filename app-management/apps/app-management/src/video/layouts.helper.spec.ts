import { 
  getImagesFromAssets,
  getVideosFromAssets,
  LAYOUTS,
  getLayoutAssetType,
  getDefaultAsset,
  getLayoutContent,
  prepareScenesContent
} from './layouts.helper';

describe('layouts.helper', () => {
  const mcqMockData = [{
      question: 'What is your question?',
      questionDescription: 'What is your question description?',
      options: [
        { text: 'Option 1', isCorrect: true },
        { text: 'Option 2', isCorrect: false },
        { text: 'Option 3', isCorrect: false },
        { text: 'Option 4', isCorrect: false },
      ],
      optionsDescription: 'What are the options?',
      correctAnswer: 'Option 1',
      correctAnswerDescription: 'What is the correct option?',
      explanation: 'Explanation for the correct answer',
      explanationDescription: 'Explanation for the correct answer description',
    }];
  describe('getImagesFromAssets', () => {
    it('should return only image files', () => {
      const assets = ['a.jpg', 'b.mp4', 'c.png', 'd.gif', 'e.mov'];
      expect(getImagesFromAssets(assets)).toEqual(['a.jpg', 'c.png', 'd.gif']);
    });
    it('should return empty array for no images', () => {
      expect(getImagesFromAssets(['a.mp4', 'b.mov'])).toEqual([]);
    });
  });

  describe('getVideosFromAssets', () => {
    it('should return only video files', () => {
      const assets = ['a.jpg', 'b.mp4', 'c.png', 'd.webm', 'e.mov'];
      expect(getVideosFromAssets(assets)).toEqual(['b.mp4', 'd.webm', 'e.mov']);
    });
    it('should return empty array for no videos', () => {
      expect(getVideosFromAssets(['a.jpg', 'b.png'])).toEqual([]);
    });
  });

  describe('getLayoutAssetType', () => {
    it('should return video for layout4', () => {
      expect(getLayoutAssetType('layout4')).toBe('video');
    });
    it('should return image for layout2', () => {
      expect(getLayoutAssetType('layout2')).toBe('image');
    });
    it('should return null for unknown layout', () => {
      expect(getLayoutAssetType('unknown')).toBeNull();
    });
  });

  describe('getDefaultAsset', () => {
    const assets = ['a.jpg', 'b.mp4', 'c.png', 'd.webm', 'e.mov'];
    it('should return first video for video layout', () => {
      expect(getDefaultAsset('layout4', false, assets)).toBe('b.mp4');
    });
    it('should return first image for image layout', () => {
      expect(getDefaultAsset('layout2', false, assets)).toBe('a.jpg');
    });
    it('should return empty string if no assets', () => {
      expect(getDefaultAsset('layout2', false, [])).toBe('');
    });
    it('should return empty string if no matching asset type', () => {
      expect(getDefaultAsset('layout4', false, ['a.jpg'])).toBe('');
    });
    it('should return random asset if useRandomAsset is true', () => {
      const result = getDefaultAsset('layout2', true, assets);
      expect(['a.jpg', 'c.png']).toContain(result);
    });
  });

  describe('getLayoutContent', () => {
    it('should return layout1 content with description as title', () => {
      const content = getLayoutContent('layout1', 'desc');
      expect(content.title.value).toBe('desc');
    });
    it('should return null for unknown layout', () => {
      expect(getLayoutContent('unknown')).toBeNull();
    });
    it('should return layout2 content with asset as image', () => {
      const content = getLayoutContent('layout2', 'img.png');
      // layout2's prepareContent expects raw as string for image
      expect(content.image.value).toBe('img.png');
    });
    it('should return layout3 content with asset as title', () => {
      const content = getLayoutContent('layout3', 'title');
      expect(content.title.value).toBe('title');
    });
    it('should return layout4 content with asset as video', () => {
      const content = getLayoutContent('layout4', 'video.mp4');
      // layout4's prepareContent expects raw as string for video
      expect(content.video.value).toBe('video.mp4');
    }
    );
    it('should return layout5 content with asset as image and title', () => {
      const content = getLayoutContent('layout5', { image: 'img.png', title: 'title' });
      expect(content.image.value).toBe('img.png');
      expect(content.title.value).toBe('title');
    }
    );
    it('should return layout6 content with asset as video and title', () => {
      const content = getLayoutContent('layout6', { video: 'video.mp4', title: 'title' });
      expect(content.video.value).toBe('video.mp4');
      expect(content.title.value).toBe('title');
    }
    );
    it('should return layout7 content with asset as image', () => {
      const content = getLayoutContent('layout7', 'img.png');
      // layout7's prepareContent expects raw as string for image
      expect(content.image.value).toBe('img.png');
    }
    );
    it('should return layout8 content', () => {
      const content = getLayoutContent('layout8', mcqMockData[0]);
      expect(content.question.value).toBe('What is your question?');
      expect(content.options.value).toBe(JSON.stringify(mcqMockData[0].options));
      expect(content.isShowAnswer.value).toBe('false');
    }
    );
    it('should return layout8 content with show true', () => {
      const content = getLayoutContent('layout8', {...mcqMockData[0], isShowAnswer: true});  
      expect(content.question.value).toBe('What is your question?');
      expect(content.options.value).toBe(JSON.stringify(mcqMockData[0].options));      
      expect(content.isShowAnswer.value).toBe('true');
    }
    );
    it('should return layout9 content with asset as question', () => {
      const content = getLayoutContent('layout9', mcqMockData[0]);
      expect(content.question.value).toBe('What is your question?');
      expect(content.correctAnswer.value).toBe('Option 1');
      expect(content.explanation.value).toBe('Explanation for the correct answer'); 
    }
    );
  });

  describe('prepareScenesContent', () => {
    
    
    it('should have required properties in each message scene', () => {
      const scenes = prepareScenesContent('message', 'layout1', ['desc1', 'desc2']);      
      expect(scenes[0]).toHaveProperty('layoutId');
      expect(scenes[0]).toHaveProperty('content');
      expect(scenes[0]).toHaveProperty('description');
      expect(scenes[0]).toHaveProperty('id');
    });
    it('should have required properties in each mcq scene', () => {
      const scenes = prepareScenesContent('mcq', 'layout1', ['desc1', 'desc2']);      
      expect(scenes[0]).toHaveProperty('layoutId');
      expect(scenes[0]).toHaveProperty('content');
      expect(scenes[0]).toHaveProperty('description');
      expect(scenes[0]).toHaveProperty('id');
    });
    it('should prepare message scenes with description as title', () => {
      const arr = ['desc1', 'desc2'];
      const scenes = prepareScenesContent('message', 'layout1', arr);
      expect(scenes[0].content.title.value).toBe('desc1');
      expect(scenes[1].content.title.value).toBe('desc2');
    });
    it('should prepare mcq scenes with question and options', () => {
      const scenes = prepareScenesContent('mcq', 'layout8', mcqMockData);
      expect(scenes.length).toBe(4);
      expect(scenes[0].layoutId).toBe('layout3');
      expect(scenes[0].description).toBe(mcqMockData[0].questionDescription);
      expect(scenes[1].layoutId).toBe('layout8');
      expect(scenes[1].description).toBe(mcqMockData[0].optionsDescription);
      expect(scenes[2].layoutId).toBe('layout8');
      expect(scenes[2].description).toBe(mcqMockData[0].correctAnswerDescription);
      expect(scenes[3].layoutId).toBe('layout9');
      expect(scenes[3].description).toBe(mcqMockData[0].explanationDescription);
    });
    it('should warn and return empty object for unknown video type', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const scenes = prepareScenesContent('unknown' as any, 'layout1', ['desc']);
      expect(warnSpy).toHaveBeenCalledWith('Unknown video type:', 'unknown');
      expect(scenes[0].content).toEqual({});
      warnSpy.mockRestore();
    });
  });
describe('LAYOUTS.prepareContent', () => {
  describe('layout1', () => {
    it('should set title and subtitle from object', () => {
      const raw = { title: 'My Title', subtitle: 'My Subtitle' };
      const result = LAYOUTS.layout1.prepareContent(raw);
      expect(result.title.value).toBe('My Title');
      expect(result.subtitle.value).toBe('My Subtitle');
    });
    it('should set only title from string', () => {
      const result = LAYOUTS.layout1.prepareContent('Only Title');
      expect(result.title.value).toBe('Only Title');
      expect(result.subtitle.value).toBe('Subtitle');
    });
    it('should ignore null/undefined', () => {
      const result = LAYOUTS.layout1.prepareContent(null);
      expect(result.title.value).toBe(null);
      expect(result.subtitle.value).toBe('Subtitle');
    });
  });

  describe('layout2', () => {
    it('should set image from string', () => {
      const result = LAYOUTS.layout2.prepareContent('img.png');
      expect(result.image.value).toBe('img.png');
    });
    it('should set image from object', () => {
      const result = LAYOUTS.layout2.prepareContent({ image: 'img2.png' });
      expect(result.image.value).toBe('img2.png');
    });
    it('should use default if no image', () => {
      const result = LAYOUTS.layout2.prepareContent({});
      expect(result.image.value).toBe('/no-image.png');
    });
  });

  describe('layout3', () => {
    it('should set title from string', () => {
      const result = LAYOUTS.layout3.prepareContent('Title3');
      expect(result.title.value).toBe('Title3');
    });
    it('should set title from object', () => {
      const result = LAYOUTS.layout3.prepareContent({ title: 'ObjTitle3' });
      expect(result.title.value).toBe('ObjTitle3');
    });
    it('should set title to empty string if missing', () => {
      const result = LAYOUTS.layout3.prepareContent({});
      expect(result.title.value).toBe('');
    });
  });

  describe('layout4', () => {
    it('should set video from string', () => {
      const result = LAYOUTS.layout4.prepareContent('vid.mp4');
      expect(result.video.value).toBe('vid.mp4');
    });
    it('should set video from object', () => {
      const result = LAYOUTS.layout4.prepareContent({ video: 'vid2.mp4' });
      expect(result.video.value).toBe('vid2.mp4');
    });
    it('should use default if no video', () => {
      const result = LAYOUTS.layout4.prepareContent({});
      expect(result.video.value).toBe('');
    });
  });

  describe('layout5', () => {
    it('should set image and title from object', () => {
      const result = LAYOUTS.layout5.prepareContent({ image: 'img5.png', title: 'Title5' });
      expect(result.image.value).toBe('img5.png');
      expect(result.title.value).toBe('Title5');
    });
    it('should set only title from string', () => {
      const result = LAYOUTS.layout5.prepareContent('OnlyTitle5');
      expect(result.title.value).toBe('OnlyTitle5');
      expect(result.image.value).toBe('');
    });
    it('should use defaults if missing', () => {
      const result = LAYOUTS.layout5.prepareContent({});
      expect(result.title.value).toBe('Title');
      expect(result.image.value).toBe('');
    });
  });

  describe('layout6', () => {
    it('should set video and title from object', () => {
      const result = LAYOUTS.layout6.prepareContent({ video: 'vid6.mp4', title: 'Title6' });
      expect(result.video.value).toBe('vid6.mp4');
      expect(result.title.value).toBe('Title6');
    });
    it('should set only title from string', () => {
      const result = LAYOUTS.layout6.prepareContent('OnlyTitle6');
      expect(result.title.value).toBe('OnlyTitle6');
      expect(result.video.value).toBe('');
    });
    it('should use defaults if missing', () => {
      const result = LAYOUTS.layout6.prepareContent({});
      expect(result.title.value).toBe('Title');
      expect(result.video.value).toBe('');
    });
  });

  describe('layout7', () => {
    it('should set image from string', () => {
      const result = LAYOUTS.layout7.prepareContent('img7.png');
      expect(result.image.value).toBe('img7.png');
    });
    it('should set image from object', () => {
      const result = LAYOUTS.layout7.prepareContent({ image: 'img7b.png' });
      expect(result.image.value).toBe('img7b.png');
    });
    it('should use default if no image', () => {
      const result = LAYOUTS.layout7.prepareContent({});
      expect(result.image.value).toBe('');
    });
  });

  describe('layout8', () => {
    it('should set question, options, isShowAnswer from object', () => {
      const raw = {
        question: 'Q8',
        options: [{ text: 'A', isCorrect: true }],
        isShowAnswer: true,
      };
      const result = LAYOUTS.layout8.prepareContent(raw);
      expect(result.question.value).toBe('Q8');
      expect(result.options.value).toBe(JSON.stringify(raw.options));
      expect(result.isShowAnswer.value).toBe('true');
    });
    it('should set only question from string', () => {
      const result = LAYOUTS.layout8.prepareContent('Q8str');
      expect(result.question.value).toBe('Q8str');
      expect(result.options.value).toContain('Option 1');
      expect(result.isShowAnswer.value).toBe('false');
    });
    it('should use defaults if missing', () => {
      const result = LAYOUTS.layout8.prepareContent({});
      expect(result.question.value).toBe('What is your question?');
      expect(result.options.value).toContain('Option 1');
      expect(result.isShowAnswer.value).toBe('false');
    });
  });

  describe('layout9', () => {
    it('should set question, correctAnswer, explanation from object', () => {
      const raw = {
        question: 'Q9',
        correctAnswer: 'A9',
        explanation: 'Because',
      };
      const result = LAYOUTS.layout9.prepareContent(raw);
      expect(result.question.value).toBe('Q9');
      expect(result.correctAnswer.value).toBe('A9');
      expect(result.explanation.value).toBe('Because');
    });
    it('should set only question from string', () => {
      const result = LAYOUTS.layout9.prepareContent('Q9str');
      expect(result.question.value).toBe('Q9str');
      expect(result.correctAnswer.value).toBe('The correct answer');
      expect(result.explanation.value).toBe('Explanation for the correct answer');
    });
    it('should use defaults if missing', () => {
      const result = LAYOUTS.layout9.prepareContent({});
      expect(result.question.value).toBe('What is your question?');
      expect(result.correctAnswer.value).toBe('The correct answer');
      expect(result.explanation.value).toBe('Explanation for the correct answer');
    });
  });
describe('LAYOUTS.prepareContent', () => {
  describe('layout1', () => {
    it('should set title and subtitle from object', () => {
      const raw = { title: 'My Title', subtitle: 'My Subtitle' };
      const result = LAYOUTS.layout1.prepareContent(raw);
      expect(result.title.value).toBe('My Title');
      expect(result.subtitle.value).toBe('My Subtitle');
    });
    it('should set only title from string', () => {
      const result = LAYOUTS.layout1.prepareContent('Only Title');
      expect(result.title.value).toBe('Only Title');
      expect(result.subtitle.value).toBe('Subtitle');
    });
    it('should ignore null/undefined', () => {
      const result = LAYOUTS.layout1.prepareContent(null);
      expect(result.title.value).toBe(null);
      expect(result.subtitle.value).toBe('Subtitle');
    });
  });

  describe('layout2', () => {
    it('should set image from string', () => {
      const result = LAYOUTS.layout2.prepareContent('img.png');
      expect(result.image.value).toBe('img.png');
    });
    it('should set image from object', () => {
      const result = LAYOUTS.layout2.prepareContent({ image: 'img2.png' });
      expect(result.image.value).toBe('img2.png');
    });
    it('should use default if no image', () => {
      const result = LAYOUTS.layout2.prepareContent({});
      expect(result.image.value).toBe('/no-image.png');
    });
  });

  describe('layout3', () => {
    it('should set title from string', () => {
      const result = LAYOUTS.layout3.prepareContent('Title3');
      expect(result.title.value).toBe('Title3');
    });
    it('should set title from object', () => {
      const result = LAYOUTS.layout3.prepareContent({ title: 'ObjTitle3' });
      expect(result.title.value).toBe('ObjTitle3');
    });
    it('should set title to empty string if missing', () => {
      const result = LAYOUTS.layout3.prepareContent({});
      expect(result.title.value).toBe('');
    });
  });

  describe('layout4', () => {
    it('should set video from string', () => {
      const result = LAYOUTS.layout4.prepareContent('vid.mp4');
      expect(result.video.value).toBe('vid.mp4');
    });
    it('should set video from object', () => {
      const result = LAYOUTS.layout4.prepareContent({ video: 'vid2.mp4' });
      expect(result.video.value).toBe('vid2.mp4');
    });
    it('should use default if no video', () => {
      const result = LAYOUTS.layout4.prepareContent({});
      expect(result.video.value).toBe('');
    });
  });

  describe('layout5', () => {
    it('should set image and title from object', () => {
      const result = LAYOUTS.layout5.prepareContent({ image: 'img5.png', title: 'Title5' });
      expect(result.image.value).toBe('img5.png');
      expect(result.title.value).toBe('Title5');
    });
    it('should set only title from string', () => {
      const result = LAYOUTS.layout5.prepareContent('OnlyTitle5');
      expect(result.title.value).toBe('OnlyTitle5');
      expect(result.image.value).toBe('');
    });
    it('should use defaults if missing', () => {
      const result = LAYOUTS.layout5.prepareContent({});
      expect(result.title.value).toBe('Title');
      expect(result.image.value).toBe('');
    });
  });

  describe('layout6', () => {
    it('should set video and title from object', () => {
      const result = LAYOUTS.layout6.prepareContent({ video: 'vid6.mp4', title: 'Title6' });
      expect(result.video.value).toBe('vid6.mp4');
      expect(result.title.value).toBe('Title6');
    });
    it('should set only title from string', () => {
      const result = LAYOUTS.layout6.prepareContent('OnlyTitle6');
      expect(result.title.value).toBe('OnlyTitle6');
      expect(result.video.value).toBe('');
    });
    it('should use defaults if missing', () => {
      const result = LAYOUTS.layout6.prepareContent({});
      expect(result.title.value).toBe('Title');
      expect(result.video.value).toBe('');
    });
  });

  describe('layout7', () => {
    it('should set image from string', () => {
      const result = LAYOUTS.layout7.prepareContent('img7.png');
      expect(result.image.value).toBe('img7.png');
    });
    it('should set image from object', () => {
      const result = LAYOUTS.layout7.prepareContent({ image: 'img7b.png' });
      expect(result.image.value).toBe('img7b.png');
    });
    it('should use default if no image', () => {
      const result = LAYOUTS.layout7.prepareContent({});
      expect(result.image.value).toBe('');
    });
  });

  describe('layout8', () => {
    it('should set question, options, isShowAnswer from object', () => {
      const raw = {
        question: 'Q8',
        options: [{ text: 'A', isCorrect: true }],
        isShowAnswer: true,
      };
      const result = LAYOUTS.layout8.prepareContent(raw);
      expect(result.question.value).toBe('Q8');
      expect(result.options.value).toBe(JSON.stringify(raw.options));
      expect(result.isShowAnswer.value).toBe('true');
    });
    it('should set only question from string', () => {
      const result = LAYOUTS.layout8.prepareContent('Q8str');
      expect(result.question.value).toBe('Q8str');
      expect(result.options.value).toContain('Option 1');
      expect(result.isShowAnswer.value).toBe('false');
    });
    it('should use defaults if missing', () => {
      const result = LAYOUTS.layout8.prepareContent({});
      expect(result.question.value).toBe('What is your question?');
      expect(result.options.value).toContain('Option 1');
      expect(result.isShowAnswer.value).toBe('false');
    });
  });

  describe('layout9', () => {
    it('should set question, correctAnswer, explanation from object', () => {
      const raw = {
        question: 'Q9',
        correctAnswer: 'A9',
        explanation: 'Because',
      };
      const result = LAYOUTS.layout9.prepareContent(raw);
      expect(result.question.value).toBe('Q9');
      expect(result.correctAnswer.value).toBe('A9');
      expect(result.explanation.value).toBe('Because');
    });
    it('should set only question from string', () => {
      const result = LAYOUTS.layout9.prepareContent('Q9str');
      expect(result.question.value).toBe('Q9str');
      expect(result.correctAnswer.value).toBe('The correct answer');
      expect(result.explanation.value).toBe('Explanation for the correct answer');
    });
    it('should use defaults if missing', () => {
      const result = LAYOUTS.layout9.prepareContent({});
      expect(result.question.value).toBe('What is your question?');
      expect(result.correctAnswer.value).toBe('The correct answer');
      expect(result.explanation.value).toBe('Explanation for the correct answer');
    });
  });
});
});
});
