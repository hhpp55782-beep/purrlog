/* 前后端共享的类型写在这里 —— 呼噜噜 Purrlog 猫咪日常分享社区 */

/** 猫咪毛色（同时用于广场筛选） */
export type CatColor = '橘猫' | '狸花' | '奶牛' | '纯白' | '纯黑' | '幼猫' | '三花' | '其他';

/** 单次发布需要回应的帖子数（社区核心机制） */
export const ECHO_QUOTA = 3;

export interface CatDTO {
  id: string;
  name: string;
  breed: string | null;
  color: string | null;
  weight: string | null;
  birthday: string | null;
  origin: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface ReactionDTO {
  id: string;
  postId: string;
  kind: string;
  sticker: string | null;
  actorName: string | null;
  createdAt: string;
}

export interface CommentDTO {
  id: string;
  postId: string;
  content: string;
  authorName: string | null;
  createdAt: string;
}

export interface PostDTO {
  id: string;
  catId: string | null;
  catName: string | null;
  authorName: string | null;
  imageUrl: string;
  mood: string | null;
  content: string | null;
  createdAt: string;
  /** 猫咪毛色，来源于关联的猫档案 */
  color: string | null;
  reactions: ReactionDTO[];
  comments: CommentDTO[];
  /** 当前登录者已经贴过的贴纸文字列表 */
  myStickers: string[];
  /** 是否是当前登录者自己发布的 */
  isMine: boolean;
}

export interface QuotaDTO {
  /** 已经完成的回应数 */
  echoDone: number;
  /** 已经发布的帖子数 */
  published: number;
  /** 发布下一帖还需要的回应数（0 表示可以直接发） */
  needEcho: number;
  canPublish: boolean;
}

export interface EchoItemDTO {
  id: string;
  postId: string;
  type: 'reaction' | 'comment';
  sticker: string | null;
  content: string | null;
  actorName: string | null;
  createdAt: string;
  /** 被回应的那只猫的名字 */
  catName: string | null;
  /** 被回应的那张照片（缩略用） */
  imageUrl: string | null;
}

export interface CreatePostBody {
  catId: string | null;
  catName: string;
  imageUrl: string;
  mood: string | null;
  content: string | null;
}

export interface CreateCatBody {
  name: string;
  breed?: string | null;
  color?: string | null;
  weight?: string | null;
  birthday?: string | null;
  origin?: string | null;
  avatarUrl?: string | null;
}

export interface CreateReactionBody {
  sticker: string;
}

export interface CreateCommentBody {
  content: string;
}
