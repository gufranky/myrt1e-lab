# Myrt1e lab

Myrt1e lab 是 gufranky 的个人数字自留地：一个以渲染、游戏开发与 AI 为主题的个人主页，以及一个可自由拖拽和组合控件的访客工作台。

## 内容

- 开屏、伪终端与进入主页的过渡
- 灰底、黑字、亮黄的个人角色档案：总览、档案、技能与日志
- 独立的 UE 蓝图式访客工作台：控件库、拖拽、缩放、吸附与本地保存
- 地理位置、天气、时间、文章、开发统计、终端、音乐和 Live2D 等交互控件
- GitHub 贡献、公开仓库、语言分布与 WakaTime 累计编程时长

## 本地开发

需要 Node.js 20 或更新版本。

```bash
npm install
npm run dev
```

默认开发地址由 Astro 输出。构建生产版本：

```bash
npm run build
```

## 可选环境变量

复制或创建本地 `.env`，不要将它提交到 Git：

```dotenv
GITHUB_TOKEN=github_pat_...
WAKATIME_API_KEY=waka_...
```

- `GITHUB_TOKEN`：可提高 GitHub API 的可用性与请求额度。
- `WAKATIME_API_KEY`：用于显示累计编程时长。

未配置时，相关区域会显示不可用状态，不会将凭据暴露给浏览器。

## 数据与资源

- 博客文章由 `blog.myrt1e.com` 的现有接口读取。
- GitHub、WakaTime、位置和天气数据由本项目的 Astro API 路由转发或汇总。
- 音乐封面与播放入口来自 Mili 的 YouTube 官方内容。
- Live2D 模型、第三方 npm 依赖、Simple Icons / Skill Icons、GitHub / 哔哩哔哩 / Steam 图标及远程图片不属于本项目原创代码；使用时须分别遵守其作者与平台条款。

## 许可证

本仓库的原创代码以 [MIT License](LICENSE) 发布。第三方资源、模型与依赖不因本仓库的 MIT 许可证而改变其原有授权。
