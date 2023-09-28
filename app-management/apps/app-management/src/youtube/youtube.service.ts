import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { youtube, youtube_v3 } from '@googleapis/youtube';
@Injectable()
export class YoutubeService {
  private ytV3: youtube_v3.Youtube;

  constructor(private readonly config: ConfigService) {
    // https://developers.google.com/youtube/v3/getting-started
    this.ytV3 = youtube({
      version: 'v3',
      auth: config.getOrThrow('GCP_API_KEY'),
    });
  }

  async getChannelDetails(channelid: string): Promise<any> {
    const resp = await this.ytV3.channels.list({
      part: ['contentDetails', 'snippet', 'statistics'],
      id: [channelid],
    });

    return resp.data;
  }

  getVideos(channelid: string) {
    return channelid;
  }

  getComments(videoid: string) {
    return videoid;
  }

  getGptComment(message: string) {
    return message;
  }

  replyComment(reply, commentid) {
    return `reply=${reply}, commentid=${commentid}`;
  }
}
