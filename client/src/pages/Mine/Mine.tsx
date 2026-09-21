import { useCallback, useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Link } from 'react-router-dom';

import { fetchCats, fetchMyPosts, fetchQuota } from '@/api';
import PostCard from '@/components/PostCard';
import ShareSheet from '@/components/ShareSheet';
import { COLOR_DOT } from '@/constants';
import { makeShareCard } from '@/utils/image';
import type { CatDTO, PostDTO, QuotaDTO } from '@shared/api.interface';

const Mine = () => {
  const [cats, setCats] = useState<CatDTO[]>([]);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [quota, setQuota] = useState<QuotaDTO | null>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, p, q] = await Promise.all([fetchCats(), fetchMyPosts(), fetchQuota()]);
      setCats(c);
      setPosts(p);
      setQuota(q);
    } catch (error) {
      logger.error('加载我的页面失败', error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onShare = async (post: PostDTO) => {
    setCardUrl((await makeShareCard(post)) || null);
  };

  const echoTotal = posts.reduce((sum, p) => sum + p.reactions.length + p.comments.length, 0);

  return (
    <div className="px-4 pt-5 pb-6">
      <h1 className="text-[22px] font-bold">我的</h1>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl py-3 text-center">
          <p className="text-[20px] font-bold text-[#E8913F]">{posts.length}</p>
          <p className="text-[12px] text-[#B39C8C]">条日常</p>
        </div>
        <div className="bg-white rounded-2xl py-3 text-center">
          <p className="text-[20px] font-bold text-[#E8913F]">{echoTotal}</p>
          <p className="text-[12px] text-[#B39C8C]">收到回应</p>
        </div>
        <div className="bg-white rounded-2xl py-3 text-center">
          <p className="text-[20px] font-bold text-[#E8913F]">{quota?.echoDone ?? 0}</p>
          <p className="text-[12px] text-[#B39C8C]">我回应过</p>
        </div>
      </div>

      <section className="mt-5">
        <h2 className="text-[14px] font-semibold mb-2">我的猫</h2>
        {cats.length === 0 ? (
          <p className="text-[13px] text-[#B39C8C]">还没有猫档案，去「发布」里添加一只</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <span
                key={c.id}
                className="text-[13px] px-3.5 py-1.5 rounded-full bg-white border border-[#F0E4DA] flex items-center gap-1.5"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: COLOR_DOT[c.color ?? '其他'] ?? COLOR_DOT['其他'] }}
                />
                {c.name}
                {c.breed ? <span className="text-[#B39C8C] text-[11px]">{c.breed}</span> : null}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="mt-5">
        <h2 className="text-[14px] font-semibold mb-2">我的日常</h2>
        {posts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[14px] text-[#8A7565]">还没发过日常</p>
            <Link to="/publish" className="text-[13px] text-[#E8913F] underline">
              去发布 →
            </Link>
          </div>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} onChanged={load} onShare={onShare} compact />)
        )}
      </section>

      <p className="mt-4 text-center text-[11px] text-[#CDBBAB]">丸子的无限进步</p>
      {cardUrl ? <ShareSheet url={cardUrl} onClose={() => setCardUrl(null)} /> : null}
    </div>
  );
};

export default Mine;
