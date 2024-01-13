import {Controller, Get, Query} from "@nestjs/common";
import {S3Service} from "@apps/app-management/aws/s3.service";

@Controller('aws')
export class AwsController {
    constructor(private  s3: S3Service){}

    @Get('signedUrl')
    async singedUrl(@Query('key') key: string):Promise<{signedUrl:string,publicUrl:string}>{
        const url = await this.s3.getSignedUrl(key);

        return {
            signedUrl:url,
            publicUrl: this.s3.getPublicUrl(key)
        }
    }

}