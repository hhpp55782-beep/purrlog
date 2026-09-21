import type { PostDTO } from '@shared/api.interface';

export const WATERMARK = '丸子的无限进步';

/** 把用户选中的照片压成适合存库与秒开的 JPEG data URL */
export function compressImage(file: File, maxEdge = 760, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('解析图片失败'));
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('画布不可用'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/** 生成一张可以长按保存的分享卡片（带水印） */
export function makeShareCard(post: PostDTO): Promise<string> {
  return new Promise((resolve) => {
    const W = 640;
    const H = 880;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    ctx.fillStyle = '#FFF6EC';
    ctx.fillRect(0, 0, W, H);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const boxW = W - 72;
      const boxH = 480;
      const scale = Math.min(boxW / img.width, boxH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (W - dw) / 2;
      const dy = 56;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(dx, dy, dw, dh, 28);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();

      drawText(ctx, post);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => {
      drawText(ctx, post);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = post.imageUrl;
  });
}

function drawText(ctx: CanvasRenderingContext2D, post: PostDTO): void {
  const W = 640;
  let y = 586;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#E2853F';
  ctx.font = 'bold 34px system-ui, -apple-system, "PingFang SC", sans-serif';
  ctx.fillText(post.catName || '无名小猫', 40, y);

  if (post.mood) {
    y += 46;
    ctx.fillStyle = '#8A6A54';
    ctx.font = '26px system-ui, -apple-system, "PingFang SC", sans-serif';
    ctx.fillText(`#${post.mood}`, 40, y);
  }

  if (post.content) {
    y += 52;
    ctx.fillStyle = '#4A3B31';
    ctx.font = '28px system-ui, -apple-system, "PingFang SC", sans-serif';
    wrapText(ctx, post.content, 40, y, W - 80, 40);
  }

  ctx.fillStyle = '#B79A86';
  ctx.font = '24px system-ui, -apple-system, "PingFang SC", sans-serif';
  ctx.fillText('呼噜噜 Purrlog · 猫咪日常分享', 40, 838);
  ctx.textAlign = 'right';
  ctx.fillText(WATERMARK, W - 40, 838);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  let line = '';
  let cursor = y;
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursor);
      line = ch;
      cursor += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursor);
}
