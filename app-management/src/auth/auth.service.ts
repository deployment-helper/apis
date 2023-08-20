import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';

@Injectable()
export class AuthService {
    private AWS_COGNITO_POOL_URL:string;
    private GRANT_TYPE:string;
    private REDIRECT_URI:string;
    private CLIENT_ID:string;

    constructor(private readonly httpserv:HttpService,private readonly configServ:ConfigService){
        this.AWS_COGNITO_POOL_URL = configServ.getOrThrow('AWS_COGNITO_POOL_URL')
        this.CLIENT_ID = configServ.getOrThrow('CLIENT_ID');
        this.REDIRECT_URI = configServ.getOrThrow('REDIRECT_URI');
        this.GRANT_TYPE = configServ.getOrThrow('GRANT_TYPE');
    }

    
    createToken(code:string):Observable<AxiosResponse>{
        return this.httpserv.post(this.AWS_COGNITO_POOL_URL,{
            grant_type: this.GRANT_TYPE,
            client_id: this.CLIENT_ID,
            redirect_uri: this.REDIRECT_URI,
            code
        })
    }

    refreshToken(token:string){
        return "refresh token"
    }
}
