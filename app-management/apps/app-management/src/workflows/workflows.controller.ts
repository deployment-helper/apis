import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ChatgptService } from '@app/shared/openapi/chatgpt.service';
import { FirestoreService } from '@app/shared/gcp/firestore.service';
import { IScenes, IVideo } from '@app/shared/types';
import { v4 as uuidv4 } from 'uuid';
import { AuthGuard } from '@apps/app-management/auth/auth.guard';
import _ from 'lodash';

console.log("outside workflows controller");
function cleanSubtitles(lines: string[]): string[] {
    const cleanedLines: string[] = [];
    const seenLines: Set<string> = new Set();

    for (const line of lines) {
        // Remove lines with numbers, timestamps, and [Music]
        if (line.trim().match(/^\d+$/) || line.includes('-->') || line.includes('[Music]')) {
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

@Controller('workflows')
@UseGuards(AuthGuard)
export class WorkflowsController {
  constructor(
    private readonly chatgptService: ChatgptService,
    private readonly fireStore: FirestoreService,
  ) {}

  @Post("youtube")
  // project_name: string
  async createVideoFromYouTube(
    @Body() data: { videoURL: string, projectID: string, promptType: string="story" },
    @Req() req: any,
  ) {

    //yt-dlp --write-auto-sub --skip-download --sub-lang en --convert-subs srt -o "subtitle.srt" https://www.youtube.com/watch\?v\=HnQcJ03oEUo
    const stdout = execSync('yt-dlp --write-auto-sub --skip-download --sub-lang en --convert-subs srt -o "subtitle.srt" ' + data.videoURL);

    // Example subtitle lines (replace this with your actual subtitle lines)
    const srtFilePath = path.join('subtitle.srt.en.srt');
    const lines: string[] = fs.readFileSync(srtFilePath);

    // Clean the lines
    const cleanedLines = cleanSubtitles(lines.toString().split("\n"));

    // Save the cleaned subtitles to a new file
    const cleanedFilePath = path.join('cleaned_subtitle.srt');
    fs.writeFileSync(cleanedFilePath, cleanedLines.join(''));
    const promptPath = "prompt.txt";
    const rawData = JSON.parse(await this.chatgptService.generateScenesScript(cleanedFilePath, promptPath));
    let scriptData = {};
    scriptData["Title"] = rawData["Title"];
    scriptData["Hook"] = rawData["Hook"];
    scriptData["Introduction"] = rawData["Introduction"];
    scriptData["Action"] = rawData["Action"];
    scriptData["Observation"] = rawData["Observation"];
    scriptData["Moral Lesson"] = rawData["Moral Lesson"];
    scriptData["Application"] = rawData["Application"];
    scriptData["Extended Reflection"] = rawData["Extended Reflection"];
    scriptData["Incorporating Personal Growth"] = rawData["Incorporating Personal Growth"];
    scriptData["Motivational Dialogues"] = rawData["Motivational Dialogues"];
    scriptData["Conclusion"] = rawData["Conclusion"];
    scriptData["Call to Action"] = rawData["Call to Action"];
    //const scriptData = {
    //  "Title": "The Power of Adversity",
    //  "Hook": "Have you ever felt like life’s challenges are just too overwhelming? Imagine turning those challenges into your greatest strengths. Stay with us to find out how!",
    //  "Introduction": "Once upon a time, a young man named John was feeling overwhelmed by the constant struggles in his career. Day after day, he faced one problem after another, leaving him exhausted and disheartened. One evening, he sat down with his father, an experienced chef known for his wisdom, and poured out his frustrations. \"Dad, I feel so overwhelmed. Every single day feels like a battle I can't win. Just when I think I've solved one problem, another one hits me. I'm exhausted, and I don't know how much more I can handle,\" he said, his voice filled with despair. His father looked at him with compassionate eyes, understanding the weight his son carried on his shoulders.",
    //  "Action": "Without saying a word, John's father stood up and led him to the kitchen. He filled three pots with water and placed them on the stove over high heat. John followed him, puzzled but curious. As the water began to boil, his father added potatoes to one pot, eggs to the second, and coffee beans to the third. John stood there, a mix of curiosity and confusion on his face, as he watched his father’s every move. 'What is he up to?' he wondered. The kitchen filled with the rising steam and the soft bubbling sounds of the boiling water.",
    //  "Observation": "After twenty minutes, his father turned off the burners. He took the potatoes out of the pot and placed them in a bowl. Then, he did the same with the eggs, and finally, he poured the coffee into a cup. Turning to John, he gently smiled, his eyes filled with understanding and warmth. \"John, come closer and touch the potatoes,\" he said softly. John tentatively reached out, feeling the soft, mushy texture of the potato. His father then handed him an egg. With a slight frown of concentration, John cracked it open and marveled at the hard, solid interior. Finally, his father asked him to sip the coffee. John took a sip, and a smile spread across his face as he savored the rich aroma and taste.",
    //  "Moral Lesson": "\"John,\" his father began, his voice gentle yet firm, \"each of these items faced the same boiling water, but they responded differently. It's not the adversity that defines you, but how you respond to it. The potato went in strong and hard but came out soft and weak. The egg was fragile with its liquid interior, but after being boiled, it became hard. The coffee beans, however, were unique. After they were exposed to the boiling water, they transformed it into something new and wonderful.\"",
    //  "Application": "His father continued, \"Which one are you? When adversity knocks on your door, how do you respond? Are you like the potato that becomes weak? Or the egg that becomes hardened and bitter? Or are you like the coffee bean that changes the environment around it, creating something positive from the hardship?\" He paused, letting the words sink in. \"Life will always throw challenges our way,\" he added, \"but it's our response to these trials that truly shapes who we are.\"",
    //  "Extended Reflection": "John looked down at the items in front of him, deep in thought. His mind wandered to the countless times he had felt like giving up, the moments when he felt broken and defeated. \"I think I understand now,\" he said quietly. \"I've been acting like the potato, strong on the outside but crumbling under pressure.\" His father nodded. \"It's a common response, son. Many people face their challenges and feel overwhelmed, losing their strength. But remember, you have the power to change your response.\" John's thoughts shifted to his friend, Sarah, who had recently lost her job. Despite her initial despair, she had taken the time to learn new skills and eventually started a successful business. She had become like the coffee bean, transforming her adversity into an opportunity for growth. Inspired by her resilience, John felt a newfound determination brewing within him.",
    //  "Incorporating Personal Growth": "\"From now on, I want to be like the coffee bean,\" John declared. \"I want to face my challenges head-on and use them to become stronger and better.\" His father smiled proudly. \"That's the spirit, John. Remember, every challenge you face is an opportunity to grow and improve. You have the strength within you to transform any situation.\"",
    //  "Motivational Dialogues": "Buddha said: \"The mind is everything. What you think you become.\" Better if we see in our lives, we will find that we often face challenges and adversities, but it is our reaction to these challenges that truly defines us. How we respond to problems is what really matters. There are three kinds of people in the world: the first kind is like a potato; they seem strong at first but become weak when facing adversity. The second kind is like eggs; they start off soft but difficulties make them hard and often bitter or frustrated. The third type is like coffee beans; they face adversity bravely and use it as an opportunity to grow and improve. Buddha said: \"In the confrontation between the stream and the rock, the stream always wins – not through strength but by perseverance.\" If we can learn from our experiences, adapt to new situations, and make the best out of every challenge, then we can not only improve ourselves but also inspire and positively influence those around us. Life is full of challenges, but it is up to us to decide how we will react and what we will make of it. Buddha said: \"Pain is inevitable. Suffering is optional.\" We have the power to choose our response and shape our future. So, will you let adversity weaken you, harden you, or transform you into something better? The choice is yours.",
    //  "Conclusion": "John left the kitchen with a new perspective. He realized that he had the power to change his circumstances, not by avoiding difficulties, but by facing them head-on and using them as opportunities to grow and improve. From that day forward, he decided to be like the coffee bean, transforming his challenges into strengths and positively influencing those around him. \"Thank you, Dad,\" he said with gratitude. \"I won't forget this lesson.\"",
    //  "Call to Action": "If you found this story inspiring, make sure to give it a thumbs up and share it with your friends. And don’t forget to subscribe to our channel for more motivational content like this. Hit the bell icon so you never miss an update! What kind of person are you – a potato, an egg, or a coffee bean? Let us know in the comments below!"
    //};
    console.log("scriptData before stringify " + scriptData);
    console.log("scriptData " + JSON.stringify(scriptData));
    const videoTitle = scriptData.Title;
    let sceneDescriptions = [];
    const keys = Object.keys(scriptData);
    for(let i=0;i<keys.length;i++){
      let key = keys[i];
      if(key != "Title"){
        if(scriptData[key] != null)
          sceneDescriptions[i] = scriptData[key];
      }
    }

    // get the Project
    const project = await this.fireStore.get('project', data.projectID);

    // Create the video
    const videoData = {
      "projectId": project.id,
      "projectName": project.projectName,
      "name": videoTitle,
      "description": videoTitle,
      "backgroundMusic": project.defaultBackgroundMusic, //"https://vm-presentations.s3.ap-south-1.amazonaws.com/public/background-music/deep-meditation-192828.mp3",
      "overlay": project.defaultOverlay, //"https://vm-presentations.s3.ap-south-1.amazonaws.com/public/7aebc7e3-86a8-4e2b-9994-634e7aeda3f2.mov",
      "audioLanguage": project.defaultLanguage, //"en-US",
      "voiceCode": project.defaultVoice, //"en-US-Journey-F",
    }

    const video = await this.fireStore.add('video', {
      ...videoData,
      isDeleted: false,
      userId: req.user.sub,
    });

    const scenes = await this.fireStore.add(`video/${video.id}/scenes`, {
      videoId: video.id,
      scenes: [],
    });

    const updatedVideo = this.fireStore.update('video', video.id, { scenesId: scenes.id });

    sceneDescriptions = sceneDescriptions.filter(function(item){ return item != null})
    for(let i=0;i<sceneDescriptions.length;i++){
      let image = project?.assets[Math.ceil(Math.random()*1000)%project?.assets?.length];
      if(sceneDescriptions[i]){
        await this.fireStore.updateScene(
          `video/${video.id}/scenes`,
          scenes.id,
          {
            "id": uuidv4(),
            "content": {
              "image": {
                "type": "image",
                "name": "image",
                "value": image,
                "placeholder": "Image"
              }
            },
            "description": sceneDescriptions[i],
            "image": image,
            "layoutId": "layout2"
          }
        );
      }
    }
    return video;
  }

  @Get("list")
  async list(@Req() req: any) {
    return {list: 1};
  }
}
