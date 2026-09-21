import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { MessageCircle, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';

import { addComment, toggleReaction } from '@/api';
import { COLOR_DOT, STICKERS } from '@/constants';
import type { PostDTO } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface Props {
  post: PostDTO;
  onChanged?: () => void;
  onShare?: (post: PostDTO) => void;
  compact?: boolean;
}

const PostCard = ({ post, onChanged, onShare, compact }: Props) => {
  const [busy, setBusy] = useState(false);
  const [openComment, setOpenComment] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of post.reactions) {
      if (!r.sticker) continue;
      map.set(r.sticker, (map.get(r.sticker) ?? 0) + 1);
    }
    return map;
  }, [post.reactions]);

  const mine = useMemo(() => new Set(post.myStickers ?? []), [post.myStickers]);

  const onSticker = async (sticker: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await toggleReaction(post.id, sticker);
      onChanged?.();
    } catch (error) {
      logger.error('贴贴纸失败', error);
    } finally {
      setBusy(false);
    }
  };

  const onSend = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      await addComment(post.id, value);
      setText('');
      onChanged?.();
    } catch (error) {
      logger.error('评论失败', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <article className="bg-white rounded-3xl p-4 mb-4 shadow-[0_4px_20px_rgba(180_150_120_0.10)]">
      <header className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: COLOR_DOT[post.color ?? '其他'] ?? COLOR_DOT['其他'] }}
        />
        <Link to={`/post/${post.id}`} className="font-semibold text-[15px]">
          {post.catName || '无名小猫'}
        </Link>
        {post.mood ? (
          <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#FFF0E0] text-[#C9762B]">
            {post.mood}
          </span>
        ) : null}
        <span className="ml-auto text-[12px] text-[#B39C8C]">
          {dayjs(post.createdAt).fromNow()}
        </span>
      </header>

      <Link to={`/post/${post.id}`} className="block mt-3">
        <Image
          src={post.imageUrl}
          alt={post.catName ?? '猫咪日常'}
          className="w-full rounded-2xl object-cover max-h-[420px] bg-[#F7EFE7]"
        />
      </Link>

      <p className="mt-3 text-[14px] leading-relaxed text-[#5B4A3E]">
        {post.content || '（这条日常只有照片，没有配文）'}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {STICKERS.map((s) => {
          const n = counts.get(s) ?? 0;
          const active = mine.has(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSticker(s)}
              className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? 'bg-[#E8913F] text-white border-[#E8913F]'
                  : 'bg-[#FFFBF7] text-[#8A7565] border-[#F0E4DA]'
              }`}
            >
              {s}
              {n > 0 ? <span className="ml-1 opacity-80">{n}</span> : null}
            </button>
          );
        })}
      </div>

      {!compact ? (
        <>
          <div className="mt-3 flex items-center gap-5 text-[#B39C8C] text-[13px]">
            <button type="button" onClick={() => setOpenComment((v) => !v)} className="flex items-center gap-1">
              <MessageCircle size={16} />
              {post.comments.length} 条评论
            </button>
            <button
              type="button"
              onClick={() => onShare?.(post)}
              className="flex items-center gap-1 ml-auto"
            >
              <Share2 size={16} />
              生成卡片
            </button>
          </div>

          {openComment ? (
            <div className="mt-3 border-t border-[#F5ECE3] pt-3">
              {post.comments.length === 0 ? (
                <p className="text-[13px] text-[#B39C8C]">还没有人说话，来当第一个～</p>
              ) : (
                <ul className="space-y-2">
                  {post.comments.map((c) => (
                    <li key={c.id} className="text-[13px]">
                      <span className="text-[#C9762B]">{c.authorName}</span>
                      <span className="text-[#5B4A3E]">：{c.content}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="说点什么…"
                  className="flex-1 h-9 px-3 rounded-full bg-[#FFFBF7] border border-[#F0E4DA] text-[13px] outline-none"
                />
                <button
                  type="button"
                  onClick={onSend}
                  disabled={sending}
                  className="h-9 px-4 rounded-full bg-[#E8913F] text-white text-[13px] disabled:opacity-50"
                >
                  发送
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <p className="mt-3 text-[11px] text-[#CDBBAB]">— 由 {post.authorName} 发布 · 丸子的无限进步</p>
    </article>
  );
};

export default PostCard;
