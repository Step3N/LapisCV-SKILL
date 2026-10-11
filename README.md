# LapisCV-SKILL

通过 AI 对话优化简历，以 **LapisCV Classic / Serif** 样式在本地浏览器预览，满意后自行导出 PDF。

**原版：[BingyanStudio/LapisCV](https://github.com/BingyanStudio/LapisCV)**。本项目为非官方衍生项目，保留上游 Copyright (c) 2024 YiNN、CSS 作者署名和 MIT 许可。新增实现采用 GPL-3.0-only，字体及第三方库保留独立许可，见 [来源与许可](THIRD_PARTY_NOTICES.md)。

![License](https://img.shields.io/badge/license-GPL--3.0--only-blue)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.12-43853d)
![Agent Skill](https://img.shields.io/badge/Agent-Skill-5865f2)

## 使用方式

需要支持 Agent Skills、能读写本地文件并打开浏览器的 AI Agent，以及 **Node.js 22.12+**。本目录就是完整 Skill 包，入口为 [SKILL.md](SKILL.md)，无需安装 npm 依赖、配置 API Key 或运行预览服务器。

**没有预先安装 Node 也可以开始对话。** Agent 会先检测系统或其自带的 Node；没有可用版本时，在客户端允许的权限内尝试安装。需要额外授权时会说明原因并请求授权；网络、权限或工具限制导致无法安装时，会提供安装步骤。安装成功并验证版本后继续生成预览。Skill 本身不包含 Node，不能保证每种 Agent 环境都能自动安装。

加载 Skill 后，通过对话提供个人资料或旧简历，以及可选的求职方向：

> 使用 $lapiscv-skill 帮我制作简历，目标岗位是……，下面是我的个人信息和经历……

1. AI 根据真实资料归类、润色并选择栏目，不编造经历或量化结果。
2. 在浏览器查看简历，按需上传照片、切换 Classic / Serif。
3. 继续对话修改，例如「精简第二段」「添加奖项」「突出项目经验」，刷新同一预览查看结果。
4. 满意后点击「导出 PDF」，在浏览器打印对话框中另存为 PDF。

照片由浏览器本地管理，无需发给 AI。关闭头像可以恢复，「移除照片」才清除已保存的照片。正文通过对话修改，不需要用户编辑 Markdown 或填写固定表单。没有工作经历就省略，有奖项、论文等资料可添加自定义栏目。

## 渲染与打印

AI 在用户资料目录维护 `resume.md`，通过随包脚本生成独立 HTML：

```sh
node <skill-dir>/scripts/render.mjs --input <work-dir>/resume.md --output <work-dir>/resume.html --open
```

默认 Classic，可用 `--theme serif` 指定首次主题。后续保持同一输出路径；浏览器保存的照片及主题选择在刷新后恢复。

导出设置：**另存为 PDF、A4、100% 缩放、无页边距、关闭页眉页脚**。页面自身提供上下 13mm、左右 15mm 内边距。支持自动分页，`---` 可指定换页。Skill 只生成 HTML，PDF 由用户自行打印保存。推荐桌面 Chrome / Edge，其他浏览器和移动端取决于其打印支持。

中文使用系统字体：Classic 优先苹方／微软雅黑，Serif 标题优先宋体。保留小体积的英文和图标字体，整个包约 **0.5 MB**。不同设备的字形、换行及页数可能不同，以实际预览为准。

## 隐私与文件结构

HTML 内嵌运行所需的库、样式、英文和图标字体，本地渲染无远程请求。照片和主题保存在本机浏览器中，按输出路径区分；浏览器禁止存储或清除数据后需重新选择。通过云端 AI 提供的文字仍遵循所用 AI 服务的数据处理规则。

简历 Markdown、HTML 和 PDF 含个人信息，请保存在用户资料目录，不提交到公开仓库。`.gitignore` 排除默认简历文件、输出目录、PDF、日志和系统杂项。

```text
SKILL.md                 对话生成和修改流程
agents/openai.yaml       Skill 展示与调用信息
scripts/                 HTML 渲染、内容过滤、分页和预览交互
assets/                  浏览器适配与随包解析库
styles/ · fonts/         LapisCV 样式、英文和图标字体
templates/ · references/ 中英文格式参照及内容规范
licenses/ · LICENSE      原版、字体、依赖及新增实现的许可
```

感谢 [BingyanStudio/LapisCV](https://github.com/BingyanStudio/LapisCV) 及其作者提供的设计与开源资源。完整来源、修改说明及依赖版本见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
