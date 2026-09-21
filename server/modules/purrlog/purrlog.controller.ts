import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';

import { PurrlogService } from './purrlog.service';
import type {
  CatDTO,
  CommentDTO,
  CreateCatBody,
  CreateCommentBody,
  CreatePostBody,
  CreateReactionBody,
  PostDTO,
} from '@shared/api.interface';

@Controller('api/purrlog')
export class PurrlogController {
  constructor(private readonly purrlogService: PurrlogService) {}

  private viewer(req: Request): string {
    return req.userContext?.userId || '';
  }

  private name(req: Request): string | undefined {
    return req.userContext?.userName || undefined;
  }

  // ===== 读取类（公开，游客也能逛广场） =====

  @Get('posts')
  async listPosts(
    @Req() req: Request,
    @Query('filter') filter?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<PostDTO[]> {
    return this.purrlogService.listPosts({
      filter,
      limit: Math.min(Number(limit) || 20, 60),
      offset: Number(offset) || 0,
      viewerId: this.viewer(req),
    });
  }

  @Get('posts/mine')
  async listMyPosts(@Req() req: Request): Promise<PostDTO[]> {
    return this.purrlogService.listMyPosts(this.viewer(req), this.viewer(req));
  }

  @Get('posts/:id')
  async getPost(@Req() req: Request, @Param('id') id: string): Promise<PostDTO | null> {
    return this.purrlogService.getPost(id, this.viewer(req));
  }

  @Get('posts/:id/comments')
  async listComments(@Param('id') id: string): Promise<CommentDTO[]> {
    const dto = await this.purrlogService.getPost(id, '');
    return dto?.comments ?? [];
  }

  // ===== 需要登录 =====

  @Get('cats')
  async listMyCats(@Req() req: Request): Promise<CatDTO[]> {
    return this.purrlogService.listMyCats(this.viewer(req));
  }

  @NeedLogin()
  @Post('cats')
  async createCat(@Body() body: CreateCatBody): Promise<CatDTO> {
    return this.purrlogService.createCat(body);
  }

  @NeedLogin()
  @Post('posts')
  async createPost(@Req() req: Request, @Body() body: CreatePostBody): Promise<PostDTO> {
    return this.purrlogService.createPost(this.viewer(req), this.name(req), body);
  }

  @NeedLogin()
  @Post('posts/:id/reactions')
  async toggleReaction(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: CreateReactionBody,
  ): Promise<{ added: boolean }> {
    return this.purrlogService.toggleReaction(this.viewer(req), this.name(req), id, body.sticker);
  }

  @NeedLogin()
  @Delete('posts/:id/reactions')
  async clearReaction(@Req() req: Request, @Param('id') id: string): Promise<{ removed: number }> {
    const stickers = await this.purrlogService.getPost(id, this.viewer(req));
    const mine = stickers?.myStickers ?? [];
    for (const s of mine) {
      await this.purrlogService.toggleReaction(this.viewer(req), this.name(req), id, s);
    }
    return { removed: mine.length };
  }

  @NeedLogin()
  @Post('posts/:id/comments')
  async addComment(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: CreateCommentBody,
  ): Promise<CommentDTO> {
    return this.purrlogService.addComment(this.name(req), id, body.content);
  }
}
