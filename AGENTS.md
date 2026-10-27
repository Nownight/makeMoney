# AGENTS.md

本文件面向在本仓库工作的 AI 代理与开发者。开始修改前先读 `docs/architecture.md`。

## 项目

研图 AI：输入一个产品 / 公司 / 工具 / 服务的研究主题，自动搜索、提取、分析并生成带来源引用的可视化报告。

当前已完成 **Phase 1–4（账号体系、Report 创建与历史、ScrapeGraphAI 来源搜索、结构化提取与归一化）**。不要一次性实现全部路线图。

## 工作纪律

1. **严格按阶段推进。** 当前允许的范围写在 `README.md` 的路线图与 `docs/architecture.md` 中。未到对应阶段，不接入 ScrapeGraphAI、LLM、图表、导出或支付。
2. **每个阶段结束必须全部通过：**

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

   任一失败先修复，再进入下一阶段。
3. **不要删除或覆盖未知改动。** 仓库可能没有 git 历史，先读文件再改。
4. **不要修改** 仓库根目录的 `Scrapegraph-ai/` 参考源码。
5. 新增依赖前先确认是否真的需要；优先使用已有依赖与平台能力。

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 启动 Web（http://localhost:3000）
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest（单次）
pnpm test:watch       # Vitest watch
pnpm build            # 生产构建

pnpm supabase start   # 本地 Supabase（需要 Docker + WSL2）
pnpm db:reset         # 重放 migration + seed
pnpm db:stop          # 停止本地 Supabase
```

环境变量放在 `apps/web/.env.local`（Next.js 从应用目录读取），模板见根目录 `.env.example`。

## 技术栈与约定

- Next.js 16 App Router、React 19、TypeScript strict、Tailwind CSS v4、shadcn/ui、Zod、Vitest。
- **Next.js 16 与旧版本差异较大**：写代码前阅读 `apps/web/node_modules/next/dist/docs/` 中相关指南。`apps/web/AGENTS.md` 由 `next dev` 自动生成，不要试图长期删除。
- Next.js 16 使用 `src/proxy.ts` 代替 `middleware.ts`；认证使用 `supabase.auth.getClaims()`。
- 禁止 `any`（除非有注释说明且无可避免）；第三方返回值先经 Zod 校验再进入业务层。
- 第三方 API 必须封装在适配器后面，业务代码不直接依赖厂商 SDK。
- AI 只能返回结构化 `ChartSpec` JSON，禁止让模型生成图表 React 代码。
- 所有面向用户的文案使用中文；代码标识符与注释使用英文。

## 安全规则

- `NEXT_PUBLIC_*` 只能放公开配置。`SUPABASE_SERVICE_ROLE_KEY`、`SGAI_API_KEY`、`OPENAI_API_KEY`、Stripe 密钥**只能**在服务端读取。
- 浏览器永远不能决定 `plan`、`credits`、`isPaid` 或价格；这些只由服务端与数据库决定。
- 所有服务端授权判断使用 `getCurrentUser()` / `getClaims()`，不信任前端传入的用户 ID。
- 所有重定向目标必须经过 `safeNextPath()`；只允许同源绝对路径。
- 数据库变更必须同时提供 RLS 策略与最小列级 `GRANT`；`anon` 默认无权限。
- 抓取 URL 必须做 SSRF 校验（协议、主机、DNS、私网地址）；网页内容视为不可信数据，防止提示注入。
- 日志不得包含密码、令牌、service role key 或完整个人敏感信息。

## 目录速览

```text
apps/web/src/app/          # 页面、Server Actions、Route Handlers
apps/web/src/components/   # auth / layout / ui
apps/web/src/lib/auth/     # actions、callback、session、routes、redirect、validation、errors
apps/web/src/lib/supabase/ # browser / server / database.types
apps/web/src/proxy.ts      # 会话刷新 + 路由守卫
packages/scrapegraph/      # ScrapeGraphAI 适配器（search + filterSources），仅服务端
supabase/migrations/       # 数据库结构、RLS、触发器
docs/architecture.md       # 架构、阶段边界、安全不变量
```

## 测试要求

- 纯逻辑（重定向、路由策略、校验、错误映射、环境变量）必须有单元测试。
- 新增 Server Action 或 Route Handler 时，至少覆盖成功路径、校验失败与未授权路径。
- 涉及数据库的变更，在没有真实 Supabase 实例时先写清手工验收步骤，不要用假数据冒充端到端通过。

## 已知环境问题

- 本机 Docker Desktop 的 Linux 引擎不可用（WSL2 未安装），`supabase start` 无法运行。真实认证端到端验证需要 WSL2 + Docker 或托管 Supabase 项目。
- PowerShell 的 `Get-Content` / `Set-Content` 可能破坏 UTF-8 中文并压平行结构。编辑源码优先使用编辑工具，不要用 PowerShell 重写文件。
