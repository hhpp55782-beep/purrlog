/** 社区里可以贴的贴纸 */
export const STICKERS = ['rua一下', '同款睡姿', '好想捏', '太乖了', '胖乎乎', '眼神杀'] as const;

/** 发布时可以选的心情 */
export const MOODS = [
  '面包瘫',
  '飞机耳',
  '踩奶',
  '暗中观察',
  '发疯跑酷',
  '晒太阳',
  '要饭中',
  '假装听懂',
] as const;

/** 广场筛选（对应猫档案的毛色字段） */
export const FILTERS = ['全部', '橘猫', '狸花', '奶牛', '纯白', '纯黑', '幼猫', '三花', '其他'] as const;

/** 毛色对应的小圆点颜色，用于卡片点缀 */
export const COLOR_DOT: Record<string, string> = {
  橘猫: '#F0A04B',
  狸花: '#9C7B5A',
  奶牛: '#4A4A4A',
  纯白: '#E8E2DA',
  纯黑: '#2B2B2B',
  幼猫: '#F3B7A0',
  三花: '#D98C6A',
  其他: '#C9B8A8',
};
