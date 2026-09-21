import { useCallback, useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { fetchPost } from '@/api';
import PostCard from '@/components/PostCard';
import ShareSheet from '@/components/ShareSheet';
import { makeShareCard } from '@/utils/image';
import type { PostDTO } from '@shared/api.interface';

const Detail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardUrl, setCardUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setPost(await fetchPost(id));
    } catch (error) {
      logger.error('加载详情失败', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[#FFF8F2] text-[#4A3B31] flex justify-center">
      <div className="w-full max-w-[480px] px-4 pt-6 pb-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-[14px] text-[#8A7565]"
        >
          <ArrowLeft size={18} />
          返回
        </button>

        {loading ? (
          <p className="text-center text-[13px] text-[#B39C8C] py-16">加载中…</p>
        ) : post ? (
          <div className="mt-4">
            <PostCard
              post={post}
              onChanged={load}
              onShare={async (p) => setCardUrl((await makeShareCard(p)) || null)}
            />
          </div>
        ) : (
          <p className="text-center text-[13px] text-[#B39C8C] py-16">这条日常不见了</p>
        )}

        {cardUrl ? <ShareSheet url={cardUrl} onClose={() => setCardUrl(null)} /> : null}
      </div>
    </div>
  );
};

export default Detail;
