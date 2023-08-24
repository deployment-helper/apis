import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { YoutubeService } from './youtube.service';

@Controller('youtube')
export class YoutubeController {
  constructor(private serv: YoutubeService) {}

  @Get('channelDetails')
  getChannelDetails(@Query('channelid') channelid: string) {
    return this.serv.getChannelDetails(channelid);
  }

  @Get('videos')
  getVideos(@Query('channelid') channelid: string) {
    return this.serv.getVideos(channelid);
  }

  @Get('comments')
  getComments(@Query('videoid') videoid: string) {
    return this.serv.getComments(videoid);
  }

  @Get('gptComment')
  getGptComment(@Query('message') message: string) {
    return message;
  }

  @Post('replyComment')
  replyComment(
    @Body('reply') reply: string,
    @Body('commentid') commentid: string,
  ) {
    return this.serv.replyComment(reply, commentid);
  }
}
