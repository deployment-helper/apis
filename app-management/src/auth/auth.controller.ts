import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';

@Controller('auth')
export class AuthController {
    constructor(private serv:AuthService){}
    
    @Get('create-token')
    token(@Query('code') code):Observable<AxiosResponse>{
        return this.serv.createToken(code);
    }
}
