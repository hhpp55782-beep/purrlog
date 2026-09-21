import { useCallback, useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';

import { fetchPosts } from '@/api';
import PostCard from '@/components/PostCard';
import ShareSheet from '@/components/ShareSheet';
import { FILTERS } from '@/constants';
import { makeShareCard } from '@/utils/image';
import type { PostDTO } from '@shared/api.interface';

const Square = () => {
  const [filter, setFilter] = useState<string>('全部');
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardUrl, setCardUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPosts({ filter, limit: 30 });
      setPosts(data);
    } catch (error) {
      logger.error('加载广场失败', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const onShare = async (post: PostDTO) => {
    const url = await makeShareCard(post);
    setCardUrl(url || null);
  };

  return (
    <div className="px-4 pt-5">
      <h1 className="text-[22px] font-bold">呼噜噜</h1>
      <p className="text-[13px] text-[#B39C8C] mt-1">今天也有人在认真晒猫</p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 text-[13px] px-3.5 py-1.5 rounded-full border transition-colors ${
              filter === f
                ? 'bg-[#E8913F] text-white border-[#E8913F]'
                : 'bg-white text-[#8A7565] border-[#F0E4DA]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-center text-[13px] text-[#B39C8C] py-10">猫咪们正在赶来…</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[14px] text-[#8A7565]">这个分类还没有猫</p>
            <p className="text-[12px] text-[#B39C8C] mt-1">去「发布」晒出你家主子吧</p>
          </div>
        ) : (
          posts.map((p) => (
            <PostCard key={p.id} post={p} onChanged={load} onShare={onShare} />
          ))
        )}
      </div>

      {cardUrl ? <ShareSheet url={cardUrl} onClose={() => setCardUrl(null)} /> : null}
    </div>
  );
};

export default Square;
