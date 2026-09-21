import { useCallback, useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { createCat, createPost, fetchCats } from '@/api';
import { FILTERS, MOODS } from '@/constants';
import { compressImage } from '@/utils/image';
import type { CatDTO } from '@shared/api.interface';

const EMPTY_CAT = { name: '', color: '', breed: '' };

const Publish = () => {
  const navigate = useNavigate();
  const [cats, setCats] = useState<CatDTO[]>([]);
  const [catId, setCatId] = useState<string>('');
  const [newCat, setNewCat] = useState<typeof EMPTY_CAT | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [mood, setMood] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const c = await fetchCats();
      setCats(c);
      if (c.length && !catId) setCatId(c[0].id);
    } catch (error) {
      logger.error('加载发布页数据失败', error);
    }
  }, [catId]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const url = await compressImage(file);
      setImageUrl(url);
    } catch (error) {
      logger.error('压缩图片失败', error);
    }
  };

  const submit = async () => {
    if (submitting) return;
    if (!imageUrl) {
      toast.error('先选一张主子的照片吧');
      return;
    }
    setSubmitting(true);
    try {
      // 填了新猫名字就以新建为准，否则用选中的那只已有猫
      let target: CatDTO | undefined;
      if (newCat && newCat.name.trim()) {
        target = await createCat({
          name: newCat.name.trim(),
          color: newCat.color || null,
          breed: newCat.breed || null,
        });
      } else {
        target = cats.find((c) => c.id === catId);
      }
      if (!target) {
        toast.error(newCat ? '给新猫起个名字吧' : '先选一只猫，或者点「+ 新猫」');
        setSubmitting(false);
        return;
      }
      await createPost({
        catId: target.id,
        catName: target.name,
        imageUrl,
        mood: mood || null,
        content: content || null,
      });
      setImageUrl('');
      setMood('');
      setContent('');
      await load();
      navigate('/');
    } catch (error) {
      logger.error('发布失败', error);
      toast.error('发布失败了，再试一次');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 pt-5 pb-6">
      <h1 className="text-[22px] font-bold">发布日常</h1>

      <section className="mt-5">
        <h2 className="text-[14px] font-semibold mb-2">选一只猫</h2>
        {cats.length ? (
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCatId(c.id);
                  setNewCat(null);
                }}
                className={`text-[13px] px-3.5 py-1.5 rounded-full border ${
                  catId === c.id && !newCat
                    ? 'bg-[#E8913F] text-white border-[#E8913F]'
                    : 'bg-white text-[#8A7565] border-[#F0E4DA]'
                }`}
              >
                {c.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setNewCat(EMPTY_CAT);
                setCatId('');
              }}
              className={`text-[13px] px-3.5 py-1.5 rounded-full border ${
                newCat
                  ? 'bg-[#E8913F] text-white border-[#E8913F]'
                  : 'border-dashed border-[#E0CDBB] text-[#B39C8C]'
              }`}
            >
              + 新猫
            </button>
          </div>
        ) : null}

        {newCat || cats.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-white p-4 space-y-3">
            <input
              value={newCat?.name ?? ''}
              onChange={(e) =>
                setNewCat({ ...(newCat ?? EMPTY_CAT), name: e.target.value })
              }
              placeholder="猫的名字（必填）"
              className="w-full h-10 px-3 rounded-xl bg-[#FFFBF7] border border-[#F0E4DA] text-[14px] outline-none"
            />
            <input
              value={newCat?.breed ?? ''}
              onChange={(e) =>
                setNewCat({ ...(newCat ?? EMPTY_CAT), breed: e.target.value })
              }
              placeholder="品种（选填，如 中华田园猫）"
              className="w-full h-10 px-3 rounded-xl bg-[#FFFBF7] border border-[#F0E4DA] text-[14px] outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {FILTERS.filter((f) => f !== '全部').map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setNewCat({ ...(newCat ?? EMPTY_CAT), color: f })}
                  className={`text-[12px] px-3 py-1.5 rounded-full border ${
                    newCat?.color === f
                      ? 'bg-[#E8913F] text-white border-[#E8913F]'
                      : 'bg-[#FFFBF7] text-[#8A7565] border-[#F0E4DA]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-5">
        <h2 className="text-[14px] font-semibold mb-2">今天的照片</h2>
        <label className="block rounded-2xl bg-white p-4 text-center cursor-pointer">
          {imageUrl ? (
            <img src={imageUrl} alt="待发布" className="w-full rounded-xl max-h-[280px] object-cover" />
          ) : (
            <span className="text-[13px] text-[#B39C8C]">点这里选一张照片</span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onPick(e.target.files?.[0])}
          />
        </label>
      </section>

      <section className="mt-5">
        <h2 className="text-[14px] font-semibold mb-2">
          此刻心情
          <span className="ml-1.5 text-[11px] font-normal text-[#C3B0A0]">选填，不选也能发</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(mood === m ? '' : m)}
              className={`text-[13px] px-3.5 py-1.5 rounded-full border ${
                mood === m
                  ? 'bg-[#E8913F] text-white border-[#E8913F]'
                  : 'bg-white text-[#8A7565] border-[#F0E4DA]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="text-[14px] font-semibold mb-2">
          说点什么
          <span className="ml-1.5 text-[11px] font-normal text-[#C3B0A0]">选填，可以不写</span>
        </h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="它今天又干了什么好事？（留空也行，只发照片也没关系）"
          className="w-full px-3 py-2 rounded-2xl bg-white border border-[#F0E4DA] text-[14px] outline-none resize-none"
        />
      </section>

      <button
        type="button"
        onClick={() => void submit()}
        disabled={submitting}
        className="mt-6 w-full h-12 rounded-full bg-[#E8913F] text-white font-semibold disabled:opacity-40"
      >
        {submitting ? '发布中…' : '发布日常'}
      </button>
      <p className="mt-3 text-center text-[11px] text-[#CDBBAB]">丸子的无限进步</p>
    </div>
  );
};

export default Publish;
