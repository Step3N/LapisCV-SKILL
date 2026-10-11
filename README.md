> 样式来自 **[BingyanStudio/LapisCV](https://github.com/BingyanStudio/LapisCV)**。本项目是非官方衍生项目，保留原作者版权和 MIT 许可。新增实现采用 GPL-3.0-only，完整说明见 [来源与许可](THIRD_PARTY_NOTICES.md)。

# LapisCV-SKILL

**把经历告诉 AI，做一份 LapisCV 样式的简历。**

LapisCV 的排版很好看。这个 Skill 把资料整理和内容修改交给 AI：你可以贴一份旧简历，也可以从零散的经历开始，最后在浏览器里查看结果、加上照片，再保存成 PDF。

不用自己写 Markdown，也不用安装 Typora、Obsidian 或配置编辑器样式。没有工作经历、想加竞赛奖项，或者需要一份英文简历，都可以直接说。栏目跟着你的资料走。

![License](https://img.shields.io/badge/license-GPL--3.0--only-blue)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.12-43853d)
![Agent Skill](https://img.shields.io/badge/Agent-Skill-5865f2)

## 安装：把这句话发给 Agent

在支持 Agent Skills、能下载文件和执行本地命令的 Agent 中，复制下面这句话：

```text
帮我从 https://github.com/Step3N/LapisCV-SKILL 安装 lapiscv-skill。SKILL.md 在仓库根目录，请把完整的 Skill 包安装到当前客户端的 skills 目录，并检查生成预览所需的 Node.js。
```

如果你用的是 Codex，也可以明确调用它自带的安装工具：

```text
使用 $skill-installer 安装 https://github.com/Step3N/LapisCV-SKILL 中的 Skill，入口在仓库根目录，安装名称为 lapiscv-skill。
```

Agent 会根据客户端的安装方式处理。安装后可以让它确认是否找到了 `lapiscv-skill`；如果没有显示，重新打开客户端再试。Codex 的安装和发现规则可参考 [官方说明](https://learn.chatgpt.com/docs/build-skills)。

### 想自己安装？

1. 在本仓库点击 **Code → Download ZIP**，或者用 Git 克隆仓库。
2. 将解压后的整个文件夹命名为 `lapiscv-skill`，放到你的 Agent 支持的 skills 目录。不要只复制 `SKILL.md`，脚本和资源也要保留。
3. 确认路径是 `<skills目录>/lapiscv-skill/SKILL.md`，而不是多套了一层文件夹。

具体目录以客户端配置为准。按 Codex 当前文档，个人 Skill 可放在 `~/.agents/skills/`；其他客户端请使用它自己的目录。

**没有 Node 也可以先开始。** 生成预览需要 Node.js 22.12+，Agent 会先找系统或自带的运行时，没有可用版本时尝试安装。遇到权限或网络限制，它会说明原因并给出安装步骤。无需执行 `npm install`，也不用为这个项目另配 API Key。

## 装好后，就从这句话开始

```text
使用 $lapiscv-skill 帮我做一份简历，目标岗位是前端开发。下面是我的资料和经历……
```

把名字、联系方式、教育背景、项目或工作经历贴在后面就行。还没想好目标岗位，也可以说「先做一份通用简历」。已有简历的话，直接提供文件，让 AI 在现有内容上修改。

资料够用时，Agent 会先做出一版并在浏览器打开。缺少关键事实时它会问你；没有的经历就省略，成果数字也不会凭空编造。

看过第一版，你可以接着说：

> 第二个项目写得太长，帮我精简一点。
>
> 把这两个奖项加进去。
>
> 我准备投产品经理，调整一下经历的侧重点。
>
> 尽量控制在一页，保留最重要的项目。

Agent 会更新同一份简历预览。浏览器能由 Agent 控制时，它会帮你刷新；否则刷新原来的页面就能看到修改。

## 照片、样式和 PDF

照片可加可不加，直接在预览页上传，无需发给 AI。上传后可以更换、关闭或恢复头像；「移除照片」才会清除保存的照片。照片和主题选择保存在本机浏览器中，更新正文后刷新同一路径仍能恢复。

预览页可以切换 **Classic / Serif**。中文使用系统字体，Classic 优先苹方／微软雅黑，Serif 标题优先宋体。整个 Skill 约 **0.5 MB**；不同设备上的字形、换行和页数可能略有不同，以你看到的预览为准。

满意后，点击 **导出 PDF**。在打印窗口里选择：

- **另存为 PDF**
- **A4** 纸张、**100%** 缩放
- 页边距选 **无**，关闭 **页眉和页脚**

页面已经留好了简历的边距。推荐桌面 Chrome / Edge；手机能否保存 PDF 取决于浏览器和系统的打印支持。Skill 不会自动替你生成或下载 PDF。

## 资料会保存在哪里？

Agent 在你的资料目录保存简历源文件和 HTML 预览。生成的 HTML 可以直接本地打开，预览不会上传简历或照片，也没有远程资源请求。通过云端 AI 发送的文字，仍按你所用 AI 服务的数据规则处理。

照片只在浏览器中处理，不写进简历源文件或 Agent 生成的 HTML。换浏览器、换文件路径或清除浏览器数据后，可能需要重新上传。

简历文件请留在自己的资料目录，别提交到公开仓库。

<details>
<summary>给开发者：渲染命令和文件入口</summary>

```sh
node <skill-dir>/scripts/render.mjs --input <work-dir>/resume.md --output <work-dir>/resume.html --open
```

首次生成可加 `--theme serif`。后续保持相同的输出路径，浏览器已有的主题选择优先。渲染器支持自动分页，`---` 表示明确换页。

- [SKILL.md](SKILL.md)：对话生成和修改流程。
- [内容规范](references/markdown-format.md)：Agent 使用的内部 Markdown 格式。
- `scripts/`、`assets/`：渲染、分页、照片交互及随包解析库。
- `styles/`、`fonts/`：LapisCV 样式、英文和图标字体。
- `templates/`：中英文格式参照，不是用户的真实经历。

</details>

## 致谢与许可

感谢 [BingyanStudio/LapisCV](https://github.com/BingyanStudio/LapisCV) 及其作者提供的排版设计和开源资源。上游 Copyright (c) 2024 YiNN、CSS 作者 GoForceX / YiNN 的署名和 MIT 许可均保留。

新增实现采用 [GPL-3.0-only](LICENSE)，原版资源、JetBrains Mono 和第三方库保留各自的许可，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
