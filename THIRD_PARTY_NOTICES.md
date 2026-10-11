# 来源与第三方许可

LapisCV-SKILL 为非官方衍生项目，无上游官方关联或背书。新增渲染器、预览交互和分页实现采用 GPL-3.0-only，见 [LICENSE](LICENSE)；原版资源继续遵守独立许可。

| 资源 | 来源与许可 | 随包声明 |
| --- | --- | --- |
| `styles/main.css`、两套主题 CSS、`templates/`、图标字体 | [BingyanStudio/LapisCV](https://github.com/BingyanStudio/LapisCV)，Copyright (c) 2024 YiNN，MIT；CSS 保留 YiNN / GoForceX 署名 | [LapisCV-MIT.txt](licenses/LapisCV-MIT.txt) |
| JetBrains Mono | JetBrains，未修改原字体，SIL OFL 1.1 | [JetBrainsMono-OFL.txt](licenses/JetBrainsMono-OFL.txt) |
| marked 17.0.5 | [markedjs/marked](https://github.com/markedjs/marked)，MIT；UMD 原样打包为 `assets/vendor/marked.cjs` | [marked-LICENSE.txt](licenses/marked-LICENSE.txt) |
| DOMPurify 3.4.16 | [cure53/DOMPurify](https://github.com/cure53/DOMPurify)，本项目使用 Apache-2.0 授权选项；浏览器发行文件原样打包为 `assets/vendor/purify.cjs` | [dompurify-LICENSE.txt](licenses/dompurify-LICENSE.txt) |

上游资源来自此前工作区保留的快照 `c8ff9e0652c02f3aea7f7ac75c011168456d717d`。主题 CSS 原为 VSCode 变体，文件现分别命名为 `styles/lapis-cv.css`、`styles/lapis-cv-serif.css`，保留作者署名和原版布局；中文字体声明已改为系统字体回退链，不再分发思源字体，英文和图标字体仍随包提供。中英文模板已缩减为格式参照，不包含上游演示经历或远程头像。浏览器容器、头像区域及页边距适配在独立的 `assets/preview.css` 中。

`assets/vendor/versions.json` 记录随包浏览器库的版本和 SHA-256。Skill 直接使用这些文件，无需 npm 安装或 CDN。

生成的 HTML 随附完整许可文本与实现代码，浏览器底部可展开查看；许可区域不打印。个人简历文字和照片不会因此被重新授权。
