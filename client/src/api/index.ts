import type { AxiosRequestConfig } from 'axios';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

import type {
  CatDTO,
  CommentDTO,
  CreateCatBody,
  CreatePostBody,
  PostDTO,
} from '@shared/api.interface';

async function call<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await axiosForBackend(config);
    return response.data as T;
  } catch (error) {
    logger.error(`请求失败 ${String(config.method)} ${String(config.url)}`, error);
    throw error;
  }
}

/** 广场帖子流 */
export async function fetchPosts(params: {
  filter?: string;
  limit?: number;
  offset?: number;
}): Promise<PostDTO[]> {
  return call<PostDTO[]>({
    url: '/api/purrlog/posts',
    method: 'GET',
    params: {
      filter: params.filter ?? '全部',
      limit: params.limit ?? 30,
      offset: params.offset ?? 0,
    },
  });
}

/** 单条帖子详情 */
export async function fetchPost(id: string): Promise<PostDTO | null> {
  return call<PostDTO | null>({ url: `/api/purrlog/posts/${id}`, method: 'GET' });
}

/** 我发布的帖子 */
export async function fetchMyPosts(): Promise<PostDTO[]> {
  return call<PostDTO[]>({ url: '/api/purrlog/posts/mine', method: 'GET' });
}

/** 我的猫档案列表 */
export async function fetchCats(): Promise<CatDTO[]> {
  return call<CatDTO[]>({ url: '/api/purrlog/cats', method: 'GET' });
}

/** 新建猫档案 */
export async function createCat(body: CreateCatBody): Promise<CatDTO> {
  return call<CatDTO>({ url: '/api/purrlog/cats', method: 'POST', data: body });
}

/** 发布一条日常 */
export async function createPost(body: CreatePostBody): Promise<PostDTO> {
  return call<PostDTO>({ url: '/api/purrlog/posts', method: 'POST', data: body });
}

/** 贴贴纸 / 取消贴纸 */
export async function toggleReaction(postId: string, sticker: string): Promise<{ added: boolean }> {
  return call<{ added: boolean }>({
    url: `/api/purrlog/posts/${postId}/reactions`,
    method: 'POST',
    data: { sticker },
  });
}

/** 评论 */
export async function addComment(postId: string, content: string): Promise<CommentDTO> {
  return call<CommentDTO>({
    url: `/api/purrlog/posts/${postId}/comments`,
    method: 'POST',
    data: { content },
  });
}
