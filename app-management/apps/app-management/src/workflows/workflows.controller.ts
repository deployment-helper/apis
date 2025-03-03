import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ChatgptService } from '@app/shared/openapi/chatgpt.service';
import { FirestoreService } from '@app/shared/gcp/firestore.service';
import { v4 as uuidv4 } from 'uuid';
import { AuthGuard } from '@apps/app-management/auth/auth.guard';
import { IProject } from '@apps/app-management/types';
import getAspectRatioImages from '@app/shared/fetchImageLinks';

function cleanSubtitles(lines: string[]): string[] {
  const cleanedLines: string[] = [];
  const seenLines: Set<string> = new Set();

  for (const line of lines) {
    // Remove lines with numbers, timestamps, and [Music]
    if (
      line.trim().match(/^\d+$/) ||
      line.includes('-->') ||
      line.includes('[Music]')
    ) {
      continue;
    }
    // Add non-empty, unique lines to cleanedLines
    const trimmedLine = line.trim();
    if (trimmedLine && !seenLines.has(trimmedLine)) {
      cleanedLines.push(trimmedLine + '\n'); // Ensure each line ends with a newline
      seenLines.add(trimmedLine);
    }
  }

  return cleanedLines;
}

function extractAndParseJSON(input: string): any | null {
  try {
      // Regular expression to find JSON content inside a string
      const jsonMatch = input.match(/\{.*\}/s); // `s` flag allows multi-line matching
      
      if (jsonMatch) {
          const jsonString = jsonMatch[0]; // Extracted JSON part
          return JSON.parse(jsonString); // Parse and return JSON object
      }

      return null; // No JSON found
  } catch (error) {
      console.error("Error parsing JSON:", error);
      return null;
  }
}

@Controller('workflows')
@UseGuards(AuthGuard)
export class WorkflowsController {
  private readonly logger = new Logger(WorkflowsController.name);

  constructor(
    private readonly chatgptService: ChatgptService,
    private readonly fireStore: FirestoreService,
  ) {}

  @Post('youtube')
  // project_name: string
  async createVideoFromYouTube(
    @Body()
    data: { videoURL: string; projectID: string },
    @Req() req: any,
  ) {
    //yt-dlp --write-auto-sub --skip-download --sub-lang en --convert-subs srt -o "subtitle.srt" HnQcJ03oEUo
    this.logger.log('Start creating video from YouTube video.');
    // TODO: clean this file after the process.
    const cmd =
      'yt-dlp --write-auto-sub --skip-download --sub-lang en --convert-subs srt -o "subtitle.srt" ' +
      data.videoURL;
    this.logger.log('running ' + cmd);
    const stdout = execSync(cmd);

    this.logger.log('Finished creating video from YouTube video.');

    // Example subtitle lines (replace this with your actual subtitle lines)
    const srtFilePath = path.join('subtitle.srt.en.srt');
    // TODO: read file with fs service
    const lines: Buffer = fs.readFileSync(srtFilePath);

    // Clean the lines
    const cleanedLines = cleanSubtitles(lines.toString().split('\n'));

    // Save the cleaned subtitles to a new file
    // TODO: should create this file in project temp directory and clenup after the process
    const cleanedFilePath = path.join('cleaned_subtitle.srt');
    fs.writeFileSync(cleanedFilePath, cleanedLines.join(''));
    const promptPath = 'prompt.txt';
    this.logger.log('Start generating scenes script.');
    const gptResp = await this.chatgptService.generateScenesScript(
      cleanedFilePath,
      promptPath,
    );

    this.logger.log('GPT Response: ' + gptResp);
    const rawData = extractAndParseJSON(gptResp);
    // const rawData = {
    //   "Title": "Understanding the Complexities of Sex Trafficking: Insights and Realities",
    //   "Hook": "Have you ever wondered how deep the rabbit hole of sex trafficking goes and what it really entails? Join us as we unravel this dark and complex issue with the experts.",  
    //   "Introduction": "Welcome back to 'Diddy on Trial' from the BBC World Service YouTube channel with me, Anoushka Mutanda-Dougherty. Today, we're diving into the heart of sex trafficking, an issue under the spotlight due to high-profile cases involving the likes of R. Kelly and Ghislaine Maxwell among others. Recently, rapper Sean Diddy Combs found himself at the center of such allegations, awaiting trial on charges that he fervently denies. Our focus will explore what these charges truly mean, speaking with those in the know and those who’ve felt its impact first-hand. Let's start by unpacking what sex trafficking actually involves.",
    //   "Action": "Ghislaine Maxwell's conviction on five counts of grooming and trafficking girls for Jeffrey Epstein, as well as R. Kelly's dramatic fall from grace, paints a clear picture of the severity and prevalence of sex trafficking. These headline cases bring to light an illicit industry that thrives in the shadows, often concealed behind a facade of glamour and power. But what actually constitutes sex trafficking? Dr. Marcel van der Watt from the National Centre on Sexual Exploitation explains that sex trafficking hinges on the misuse of force, fraud, or coercion to exploit individuals, primarily for commercial sex. It extends beyond public perception, manifesting in various settings like brothels, strip clubs, and even social events masked as innocuous gatherings.",
    //   "Observation": "Dr. van der Watt emphasizes that not all victims recognize their victimhood, especially when exploitation exploits vulnerabilities like economic hardship or lack of social support. The subtle manipulation of victims often blurs the line between consent and coercion, masking the crime's sinister nature. This complexity is underscored in smaller-scale sex trafficking operations, where predators meticulously groom victims, capitalizing on personal insecurities and longing for love or acceptance.",
    //   "Moral Lesson": "The narrative shared by Lala Appleberry, executive director of the Survivor Network NC, reveals the insidious method known as 'boyfriending' where traffickers pose as romantic partners. It shows how manipulation, trust, and attachment can be weaponized, slowly drawing vulnerable individuals into a web of exploitation. Her story serves as a powerful reminder of the importance of recognizing grooming signs and supporting victims in their journey to reclaim their autonomy and voice.",
    //   "Application": "In real-life contexts, recognizing sex trafficking requires understanding that it’s not always about strangers abducting victims. Relationships, seemingly genuine at first, can evolve into emotionally manipulative paths leading to victimization. Awareness and education can empower communities to identify these situations and provide the necessary support. Our response to such challenges—be it offering help, raising awareness, or advocating for stronger legal measures—can transform lives and fortify social resilience against these crimes.",
    //   "Conclusion": "As we delve deeper into cases like those involving Diddy and others, it's crucial to understand the broader scope of sex trafficking. It's an issue shrouded in complexity, where deceptions and abuses are not always overt. By shedding light on the different perspectives of law enforcement, survivors, and legal frameworks, we hope to foster a deeper understanding and commitment to combating this epidemic. Together, through knowledge and action, we can strive for a world where such exploitation is recognized and eradicated.",
    //   "Call to Action": "If you found today's discussion insightful, please like, share, and subscribe to our channel. Share your thoughts and comments below. Let's spark a conversation and work together to make a difference. Join us next time as we continue to explore critical socio-legal issues.",
    // }
    // const rawData = {
    //   "Title": "The Invisible Marvel of Mumbai",
    //   "Hook": "Have you ever imagined a hidden world of glowing wonders lying right under our noses amidst the city chaos?",
    //   "Introduction": "As the sun sets on the bustling city of Mumbai, a side of the city emerges that few have seen. Amid its towering skyscrapers and relentless crowds lies a hidden world of dazzling spectacles, brought to life through the presence of tiny marine organisms known as zoanthids. Nestled along the western coast of India, this metropolis of over 20 million people houses these bright marvels, waiting to be discovered by the keen eyes of a BBC film crew.",
    //   "Action": "The crew embarks on an ambitious mission to capture the mystical glow of the zoanthids, using the cover of nightfall when these organisms come alive under UV light. These minuscule creatures, typically found on coral reefs, have made an unlikely home on Mumbai's shoreline. The task proves challenging; the zoanthids are only exposed for a limited time during extremely low tides, barely four days a month and for just a few hours. The team patiently waits for nightfall, knowing that every second counts as the tide slowly returns.",
    //   "Observation": "These filmmakers confront a daunting task as they plunge into the complicated and sluggish process of capturing this spectacle. With the tide rising unexpectedly close, the crew navigates the fine line between capturing the essence of this underwater world and securing their gear. Surrounded by darkness, their urgency escalates as they race against time and nature. The sense of wonder eclipses their frustration as they observe the shoreline transform into a stunning realm of ethereal glowing puddles.",
    //   "Moral Lesson": "The day’s work emphasizes the importance of curiosity and preservation. These zoanthids, unnoticed by many, reflect nature's hidden wonders right within the heart of bustling human life. Their existence highlights nature's resilience and adaptability, reminding us of the diverse and phenomenal ecosystems concealed behind the normalcy of urban jungles.",
    //   "Application": "The film crew's determination isn't only about securing breathtaking footage but serves to ignite public interest and awareness. This spectacle, made invisible by the city’s overwhelming expansion, can teach us the significance of mindfulness and conservation of our natural heritage. By bridging the divide between city and nature, the crew seeks a deeper understanding and appreciation from people towards their natural surroundings. This story highlights that true appreciation begins when one becomes inquisitive about nature’s enigmatic charm and recognizes its importance in our lives.",
    //   "Conclusion": "As the weary yet triumphant team retires from the shore, their mission symbolized the fusion of two worlds – the natural and the urban. Their footage unveiled a pristine, magical habitat that thrives against the odds, much like the city of Mumbai itself. This story affirms that amid the concrete and chaos of city life lies rich, hidden ecosystems, waiting for those willing to look and cherish their existence.",
    //   "Call to Action": "If this tale of nature’s hidden marvels has sparked your interest, express your thoughts through a thumbs up and share it with others to spread the wonder. Subscribe to our channel for more awe-inspiring narratives from around the world. What hidden gems have you discovered in your surroundings? Share your experiences in the comments and be part of a community that cherishes and celebrates nature!"
    // }
    // const rawData = {
    //   "Title": "Rising Dragon: China's Technological Ascendancy",
    //   "Hook": "Have you ever wondered how a nation could evolve from being the world's factory to a global tech titan? Let's explore China's impressive journey towards becoming a leader in technology.",
    //   "Introduction": "The recent rise of China's AI chatbot, DeepSeek, has taken the tech world by surprise. It's more than just an isolated success—it's part of a broader trend of Chinese apps and technologies gaining prominence globally. From TikTok, CapCut, Shein, to Temu—these apps have captured the world's attention. Moreover, China's influence extends beyond smartphones, marking its dominance in various tech domains.",
    //   "Action": "China's transformation is evident in the electric car industry, where it has outpaced traditional automotive nations. The success of EV makers like BYD underscores this shift, bolstered by China's status as the world's leading battery manufacturer. In renewable energy, China produces a vast majority of the world's solar panels and, by 2028, is projected to generate 60% of global renewable energy. The sky, too, acknowledges China's prowess, with companies like DJI leading the drone market, accounting for 70% of the units buzzing overhead. Quantum computing is another field where China excels, producing more research than any other nation, sometimes outpacing even the US. The narrative remains consistent with AI where Chinese firms now outnumber others in issuing patents. DeepSeek's emergence suggests China's capability to rival US tech giants.",
    //   "Observation": "China's ascent isn't coincidental; it's part of a strategic vision titled 'Made in China 2025', launched in 2015. The plan intended to pivot China from merely being the manufacturing hub of inexpensive goods to a tech powerhouse cultivating its supply chain for advanced technologies.",
    //   "Moral Lesson": "China's journey reflects the power of long-term planning, strategic investments, and leveraging systemic strengths. By focusing on a self-sustained tech ecosystem, China showcases how nations can redefine their global standings through innovation and perseverance.",
    //   "Application": "In real life, this lesson transcends national strategy, teaching us the importance of adaptability and leveraging existing strengths to counter external pressures. Just as individuals face challenges, so do nations, and their response determines their trajectory.",
    //   "Conclusion": "China's technological ascent highlights the significance of vision, investment, and resilience. As the competition among global tech leaders intensifies, understanding how to harness challenges as stepping stones becomes crucial. With China as a compelling example, it's evident that enduring success lies in strategic foresight and embracing innovation."
    // }

    this.logger.log('Finished generating scenes script.');

    const scriptData: any = {};
    scriptData['Title'] = rawData['Title'] || rawData['title'];
    scriptData['Hook'] = rawData['Hook'] || rawData['hook'];
    scriptData['Introduction'] = rawData['Introduction'] || rawData['introduction'];
    scriptData['Action'] = rawData['Action'] || rawData['action'];
    scriptData['Observation'] = rawData['Observation'] || rawData['observation'] ;
    scriptData['Moral Lesson'] = rawData['Moral Lesson'] || rawData['moral_lesson'] || rawData['moral lesson'] || rawData['moral-lesson'];
    scriptData['Application'] = rawData['Application'] || rawData['application'];
    scriptData['Extended Reflection'] = rawData['Extended Reflection'] || rawData['extended_reflection'] || rawData['extended reflection'] || rawData['extended-reflection'];
    scriptData['Incorporating Personal Growth'] =
      rawData['Incorporating Personal Growth'] || rawData['incorporating_personal_growth'] || rawData['incorporating personal growth'] || rawData['incorporating-personal-growth'];
    scriptData['Motivational Dialogues'] = rawData['Motivational Dialogues'] || rawData['motivational_dialogues'] || rawData['motivational dialogues'] || rawData['motivational-dialogues'];
    scriptData['Conclusion'] = rawData['Conclusion'] || rawData['conclusion'];
    scriptData['Call to Action'] = rawData['Call to Action'] || rawData['call_to_action'] || rawData['call to action'] || rawData['call-to-action'];

    const videoTitle = scriptData.Title;
    let sceneDescriptions = [];
    const keys = Object.keys(scriptData);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key != 'Title') {
        if (scriptData[key] != null) sceneDescriptions[i] = scriptData[key];
      }
    }

    // get the Project
    const project = await this.fireStore.get<IProject>(
      'project',
      data.projectID,
    );
    console.log(project);
    this.logger.log('Start creating video.');
    // Create the video
    const videoData = {
      projectId: project.id,
      projectName: project.projectName,
      name: videoTitle,
      description: videoTitle,
      backgroundMusic: project.defaultBackgroundMusic,
      //overlay: project.defaultOverlay,
      audioLanguage: 'en-US', //project.defaultLanguage,
      userId: 'bda80c16-c900-45e8-a079-49048d56cd54',
      voiceCode: 'en-US-Studio-Q', // project.defaultVoice,
      isDeleted: false,
      isPublished: false,
    };
    console.log(videoData);
    const video = await this.fireStore.add('video', {
      ...videoData,
      isDeleted: false,
      userId: req.user.sub,
    });
    console.log(video);

    sceneDescriptions = sceneDescriptions.filter(function (item) {
      return item != null;
    });

    const scenesData = [];
    console.log('sceneDescriptions Length' + sceneDescriptions.length);
    for (let i = 0; i < sceneDescriptions.length; i++) {
      let visualDescription = await this.chatgptService.sceneDescToVisualDesc(sceneDescriptions[i]);
      if (sceneDescriptions[i]) {
        let images = await getAspectRatioImages(
          visualDescription
        );
        if (images.length == 0) {
          images = await getAspectRatioImages(
            sceneDescriptions[i].slice(0, 70),
          );
        }
        if (images.length == 0) {
          images = await getAspectRatioImages(
            sceneDescriptions[i].slice(35, 105),
          );
        }
        if (images.length == 0) {
          images = await getAspectRatioImages(
            sceneDescriptions[i].slice(0, 35),
          );
        }
        console.log(images);
        const image =
          images[0] ||
          project?.assets[
            Math.ceil(Math.random() * 1000) % project?.assets?.length
          ];

        scenesData.push({
          id: uuidv4(),
          content: {
            image: {
              type: 'image',
              name: 'image',
              value: image,
              placeholder: 'Image',
            },
          },
          description: sceneDescriptions[i],
          image: image,
          layoutId: 'layout2',
          visualDescription: visualDescription,
        });
      }
    }

    const scenes = await this.fireStore.add(`video/${video.id}/scenes`, {
      videoId: video.id,
      scenes: scenesData,
    });
    console.log(scenes);

    const updatedVideo = this.fireStore.update('video', video.id, {
      scenesId: scenes.id,
    });
    console.log(updatedVideo);
    this.logger.log('Finished creating video.');
    return video;
  }

  @Get('image-links')
  async getImageLinks(@Query('prompt') prompt: string): Promise<string[]> {
    try {
      const images = await getAspectRatioImages(prompt);
      console.log('Image Links:', images);
      return images;
    } catch (error) {
      console.error('Error fetching image links:', error);
      return [];
    }
  }

  @Get('list')
  async list(@Req() req: any) {
    return { list: 1 };
  }
}
