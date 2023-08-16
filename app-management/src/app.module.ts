import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './services/app.service';
import { PermissionEntity } from './entities/permission.entity';
import { PermissionService } from './services/permission.service';
import { ProjectEntity } from './entities/project.entity';


@Module({
  imports: [ConfigModule.forRoot(),TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
  }),
  TypeOrmModule.forFeature([PermissionEntity,ProjectEntity])
],
  controllers: [AppController],
  providers: [AppService, PermissionService],
})
export class AppModule {}
