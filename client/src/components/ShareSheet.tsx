import { X } from 'lucide-react';
import { Image } from '@client/src/components/ui/image';

interface Props {
  url: string;
  onClose: () => void;
}

const ShareSheet = ({ url, onClose }: Props) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-3xl p-4 w-full max-w-[360px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[15px]">分享卡片</h3>
          <button type="button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        {url ? (
          <Image src={url} alt="分享卡片" className="w-full rounded-2xl" />
        ) : (
          <p className="text-[13px] text-[#B39C8C]">卡片生成失败，请重试</p>
        )}
        <p className="mt-3 text-center text-[12px] text-[#8A7565]">手机上长按图片即可保存 · 丸子的无限进步</p>
      </div>
    </div>
  );
};

export default ShareSheet;
