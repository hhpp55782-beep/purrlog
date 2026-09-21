# 呼噜噜 Purrlog · 猫咪日常分享社区

> 丸子的无限进步 · 云端版（数据存在云端 Postgres，不是 localStorage）

养了两只猫（包子 7 岁白猫、小黑 1 岁黑猫），很想晒，但朋友圈、抖音、小红书都给不了「被看见」的感觉。
于是有了「呼噜噜」——一个只属于猫的日常分享社区：晒照片、说心情，别人贴贴纸、写评论，所有数据实时同步到云端。

## 核心机制：先回应，再发布

社区里没有无限发布权。想发一条日常，得先认真回应 **3 只** 别人的猫。
这个小小的门槛，是为了让每一张照片都能收到回声——而不是沉下去。

## 功能

| 模块 | 说明 |
| --- | --- |
| 广场 | 全部猫咪日常时间流，按毛色筛选（橘猫 / 狸花 / 奶牛 / 纯白 / 纯黑 / 幼猫 / 三花） |
| 贴纸回应 | 6 款贴纸：rua一下、同款睡姿、好想捏、太乖了、胖乎乎、眼神杀；同一人对同一帖同一贴纸只能贴一次 |
| 评论 | 每条日常下可以说话，实时写入云端 |
| 发布 | 选猫 / 上传照片（前端压到 760px JPEG）/ 选心情（面包瘫、飞机耳、踩奶…）/ 写配文 |
| 猫档案 | 名字、品种、毛色、体重、生日、来历 |
| 回声 | 别人对你家猫的所有回应，聚合成一条时间线 |
| 我的 | 我的猫、我的日常、数据统计 |
| 分享卡片 | Canvas 生成竖版卡片，带「丸子的无限进步」水印，手机长按保存 |

## 技术栈

- **前端**：React 19 + Vite + Tailwind CSS 4 + React Router 7
- **后端**：NestJS 10 + Drizzle ORM
- **数据库**：PostgreSQL（云端，dev / online 双环境，行级安全 RLS 已开启）
- **平台**：飞书妙搭（Miaoda）full_stack 应用

## 数据模型

| 表 | 字段 |
| --- | --- |
| `cat` | name, breed, color, weight, birthday, origin, avatar_url |
| `post` | cat_id, cat_name, author_name, image_url, mood, content |
| `post_reaction` | post_id, kind, sticker, actor_name（唯一索引：一人一帖一贴纸一次） |
| `post_comment` | post_id, content, author_name |

每张表均带平台审计列 `_created_at` / `_updated_at` / `_created_by` / `_updated_by`，并开启 RLS：
任何人可读（游客也能逛广场），仅登录用户可写。

## 接口

```
GET    /api/purrlog/posts?filter=&limit=&offset=   广场帖子流（公开）
GET    /api/purrlog/posts/:id                      详情（公开）
GET    /api/purrlog/posts/mine                     我发布的（公开）
GET    /api/purrlog/posts/:id/comments             评论列表（公开）
GET    /api/purrlog/quota                          发布额度（登录）
GET    /api/purrlog/echoes                         我收到的回声（登录）
GET    /api/purrlog/cats                           我的猫（登录）
POST   /api/purrlog/cats                           新建猫档案（登录）
POST   /api/purrlog/posts                          发布日常（登录）
POST   /api/purrlog/posts/:id/reactions            贴贴纸 / 取消（登录）
POST   /api/purrlog/posts/:id/comments             评论（登录）
```

## 本地开发

```bash
npm install
lark-cli apps +env-pull --app-id <app_id>   # 拉 .env.local
npm run dev
```

质量检查：

```bash
npm run type:check   # 前后端类型检查
npm run lint
```

## 部署

代码推送到妙搭 `sprint/default` 分支后执行：

```bash
lark-cli apps +release-create --as user --app-id <app_id> --branch sprint/default
lark-cli apps +access-scope-set --as user --app-id <app_id> --scope public --require-login=false
```

数据库结构先在 dev 环境建好，再用 `+db-env-migrate` 发布到 online（不可逆）。

---

丸子的无限进步
