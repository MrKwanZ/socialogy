import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { PostsService } from './posts.service';
import { PostsResolver, UserPostsResolver } from './posts.resolver';
import { UsersModule } from '../users/users.module';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), UsersModule, AppConfigModule],
  providers: [PostsService, PostsResolver, UserPostsResolver],
  exports: [TypeOrmModule, PostsService],
})
export class PostsModule {}
