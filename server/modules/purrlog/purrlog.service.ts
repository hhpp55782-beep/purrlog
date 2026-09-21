import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

import { cat, post, postComment, postReaction } from '@server/database/schema';
import type {
  CatDTO,
  CommentDTO,
  CreateCatBody,
  CreatePostBody,
  PostDTO,
  ReactionDTO,
} from '@shared/api.interface';

type RawPostRow = {
  id: string;
  catId: string | null;
  catName: string | null;
  authorName: string | null;
  imageUrl: string;
  mood: string | null;
  content: string | null;
  createdAt: Date;
  color: string | null;
  ownerId: string;
};

const ANONYMOUS = '匿名铲屎官';

@Injectable()
export class PurrlogService {
  private readonly logger = new Logger(PurrlogService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  /** 把 user_profile 复合类型里的 user_id 取成普通字符串，避免自定义类型反序列化失败 */
  private ownerExpr(column: PgColumn): SQL<string> {
    return sql<string>`COALESCE((${column}).user_id, '')`;
  }

  async listPosts(params: {
    filter?: string;
    limit: number;
    offset: number;
    viewerId: string;
  }): Promise<PostDTO[]> {
    const { filter, limit, offset, viewerId } = params;
    const where = filter && filter !== '全部' ? eq(cat.color, filter) : undefined;

    const rows = await this.db
      .select({
        id: post.id,
        catId: post.catId,
        catName: post.catName,
        authorName: post.authorName,
        imageUrl: post.imageUrl,
        mood: post.mood,
        content: post.content,
        createdAt: post.createdAt,
        color: cat.color,
        ownerId: this.ownerExpr(post.createdBy),
      })
      .from(post)
      .leftJoin(cat, eq(post.catId, cat.id))
      .where(where)
      .orderBy(desc(post.createdAt))
      .limit(limit)
      .offset(offset);

    return this.decorate(rows, viewerId);
  }

  async getPost(id: string, viewerId: string): Promise<PostDTO | null> {
    const rows = await this.db
      .select({
        id: post.id,
        catId: post.catId,
        catName: post.catName,
        authorName: post.authorName,
        imageUrl: post.imageUrl,
        mood: post.mood,
        content: post.content,
        createdAt: post.createdAt,
        color: cat.color,
        ownerId: this.ownerExpr(post.createdBy),
      })
      .from(post)
      .leftJoin(cat, eq(post.catId, cat.id))
      .where(eq(post.id, id))
      .limit(1);

    if (!rows.length) return null;
    const [dto] = await this.decorate(rows, viewerId);
    return dto;
  }

  private async decorate(rows: RawPostRow[], viewerId: string): Promise<PostDTO[]> {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);

    const [reactionRows, commentRows] = await Promise.all([
      this.db
        .select({
          id: postReaction.id,
          postId: postReaction.postId,
          kind: postReaction.kind,
          sticker: postReaction.sticker,
          actorName: postReaction.actorName,
          createdAt: postReaction.createdAt,
          ownerId: this.ownerExpr(postReaction.createdBy),
        })
        .from(postReaction)
        .where(inArray(postReaction.postId, ids)),
      this.db
        .select({
          id: postComment.id,
          postId: postComment.postId,
          content: postComment.content,
          authorName: postComment.authorName,
          createdAt: postComment.createdAt,
        })
        .from(postComment)
        .where(inArray(postComment.postId, ids))
        .orderBy(asc(postComment.createdAt)),
    ]);

    const reactionMap = new Map<string, ReactionDTO[]>();
    for (const r of reactionRows) {
      const list = reactionMap.get(r.postId) ?? [];
      list.push({
        id: r.id,
        postId: r.postId,
        kind: r.kind,
        sticker: r.sticker,
        actorName: r.actorName || ANONYMOUS,
        createdAt: r.createdAt.toISOString(),
      });
      reactionMap.set(r.postId, list);
      if (r.ownerId === viewerId && viewerId) {
        const mine = reactionMap.get(`mine:${r.postId}`) ?? [];
        mine.push({
          id: r.id,
          postId: r.postId,
          kind: r.kind,
          sticker: r.sticker,
          actorName: r.actorName || ANONYMOUS,
          createdAt: r.createdAt.toISOString(),
        });
        reactionMap.set(`mine:${r.postId}`, mine);
      }
    }

    const commentMap = new Map<string, CommentDTO[]>();
    for (const c of commentRows) {
      const list = commentMap.get(c.postId) ?? [];
      list.push({
        id: c.id,
        postId: c.postId,
        content: c.content,
        authorName: c.authorName || ANONYMOUS,
        createdAt: c.createdAt.toISOString(),
      });
      commentMap.set(c.postId, list);
    }

    return rows.map((r) => ({
      id: r.id,
      catId: r.catId,
      catName: r.catName,
      authorName: r.authorName || ANONYMOUS,
      imageUrl: r.imageUrl,
      mood: r.mood,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      color: r.color,
      reactions: reactionMap.get(r.id) ?? [],
      comments: commentMap.get(r.id) ?? [],
      myStickers: (reactionMap.get(`mine:${r.id}`) ?? [])
        .map((x) => x.sticker)
        .filter((s): s is string => Boolean(s)),
      isMine: Boolean(viewerId) && r.ownerId === viewerId,
    }));
  }

  async createPost(userId: string, userName: string | undefined, body: CreatePostBody): Promise<PostDTO> {
    const [row] = await this.db
      .insert(post)
      .values({
        catId: body.catId || null,
        catName: body.catName,
        authorName: userName || ANONYMOUS,
        imageUrl: body.imageUrl,
        mood: body.mood ?? null,
        content: body.content ?? null,
      })
      .returning({ id: post.id });

    this.logger.log(`发布新帖 ${row.id}（猫：${body.catName}）`);
    const dto = await this.getPost(row.id, userId);
    if (!dto) throw new Error('发布后读取失败');
    return dto;
  }

  async toggleReaction(
    userId: string,
    userName: string | undefined,
    postId: string,
    sticker: string,
  ): Promise<{ added: boolean }> {
    const exist = await this.db
      .select({ id: postReaction.id })
      .from(postReaction)
      .where(
        and(
          eq(postReaction.postId, postId),
          eq(postReaction.kind, 'sticker'),
          eq(postReaction.sticker, sticker),
          sql`(${postReaction.createdBy}).user_id = ${userId}`,
        ),
      )
      .limit(1);

    if (exist.length) {
      await this.db.delete(postReaction).where(eq(postReaction.id, exist[0].id));
      return { added: false };
    }

    await this.db.insert(postReaction).values({
      postId,
      kind: 'sticker',
      sticker,
      actorName: userName || ANONYMOUS,
    });
    return { added: true };
  }

  async addComment(
    userName: string | undefined,
    postId: string,
    content: string,
  ): Promise<CommentDTO> {
    const [row] = await this.db
      .insert(postComment)
      .values({ postId, content, authorName: userName || ANONYMOUS })
      .returning({
        id: postComment.id,
        postId: postComment.postId,
        content: postComment.content,
        authorName: postComment.authorName,
        createdAt: postComment.createdAt,
      });

    return {
      id: row.id,
      postId: row.postId,
      content: row.content,
      authorName: row.authorName || ANONYMOUS,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listMyCats(userId: string): Promise<CatDTO[]> {
    const rows = await this.db
      .select({
        id: cat.id,
        name: cat.name,
        breed: cat.breed,
        color: cat.color,
        weight: cat.weight,
        birthday: cat.birthday,
        origin: cat.origin,
        avatarUrl: cat.avatarUrl,
        createdAt: cat.createdAt,
      })
      .from(cat)
      .where(sql`(${cat.createdBy}).user_id = ${userId}`)
      .orderBy(asc(cat.createdAt));

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      breed: r.breed,
      color: r.color,
      weight: r.weight,
      birthday: r.birthday,
      origin: r.origin,
      avatarUrl: r.avatarUrl,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createCat(body: CreateCatBody): Promise<CatDTO> {
    const [row] = await this.db
      .insert(cat)
      .values({
        name: body.name,
        breed: body.breed ?? null,
        color: body.color ?? null,
        weight: body.weight ?? null,
        birthday: body.birthday ?? null,
        origin: body.origin ?? null,
        avatarUrl: body.avatarUrl ?? null,
      })
      .returning({ id: cat.id });

    const [created] = await this.db
      .select({
        id: cat.id,
        name: cat.name,
        breed: cat.breed,
        color: cat.color,
        weight: cat.weight,
        birthday: cat.birthday,
        origin: cat.origin,
        avatarUrl: cat.avatarUrl,
        createdAt: cat.createdAt,
      })
      .from(cat)
      .where(eq(cat.id, row.id))
      .limit(1);

    return {
      id: created.id,
      name: created.name,
      breed: created.breed,
      color: created.color,
      weight: created.weight,
      birthday: created.birthday,
      origin: created.origin,
      avatarUrl: created.avatarUrl,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async listMyPosts(userId: string, viewerId: string): Promise<PostDTO[]> {
    const rows = await this.db
      .select({
        id: post.id,
        catId: post.catId,
        catName: post.catName,
        authorName: post.authorName,
        imageUrl: post.imageUrl,
        mood: post.mood,
        content: post.content,
        createdAt: post.createdAt,
        color: cat.color,
        ownerId: this.ownerExpr(post.createdBy),
      })
      .from(post)
      .leftJoin(cat, eq(post.catId, cat.id))
      .where(sql`(${post.createdBy}).user_id = ${userId}`)
      .orderBy(desc(post.createdAt))
      .limit(60);

    return this.decorate(rows, viewerId);
  }
}
