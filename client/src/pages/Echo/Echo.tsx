import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Link } from 'react-router-dom';

import { fetchEchoes } from '@/api';
import type { EchoItemDTO } from '@shared/api.interface';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const Echo = () => {
  const [items, setItems] = useState<EchoItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchEchoes());
    } catch (error) {
      logger.error('加载回声失败', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="px-4 pt-5 pb-6">
      <h1 className="text-[22px] font-bold">回声</h1>
      <p className="text-[13px] text-[#B39C8C] mt-1">别人对你家猫的回应都在这里</p>

      <div className="mt-4">
        {loading ? (
          <p className="text-center text-[13px] text-[#B39C8C] py-10">正在收集回声…</p>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[14px] text-[#8A7565]">还没有回声</p>
            <p className="text-[12px] text-[#B39C8C] mt-1">先发一条日常，世界就会回应你</p>
          </div>
        ) : (
          items.map((it) => (
            <Link
              key={it.id}
              to={`/post/${it.postId}`}
              className="flex items-center gap-3 bg-white rounded-2xl p-3 mb-3"
            >
              {it.imageUrl ? (
                <img src={it.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-[#F7EFE7]" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] truncate">
                  <span className="text-[#C9762B]">{it.actorName}</span>
                  {it.type === 'reaction' ? ' 贴了 ' : ' 评论 '}
                  {it.type === 'reaction' ? (
                    <span className="font-semibold">{it.sticker}</span>
                  ) : (
                    <span>“{it.content}”</span>
                  )}
                </p>
                <p className="text-[12px] text-[#B39C8C] mt-0.5">
                  {it.catName ? `${it.catName} · ` : ''}
                  {dayjs(it.createdAt).fromNow()}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
      <p className="mt-3 text-center text-[11px] text-[#CDBBAB]">丸子的无限进步</p>
    </div>
  );
};

export default Echo;
