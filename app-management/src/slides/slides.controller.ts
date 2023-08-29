import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserEntity } from 'src/dynamodb/user.entity';

@Controller('slides')
@UseGuards(AuthGuard)
export class SlidesController {
  constructor(private user: UserEntity) {}

  @Post('createUser')
  async createUser() {
    return this.user.add('test@example.com', 'test1');
  }
}
