#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';

export const skillRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const {marked}=require('../assets/vendor/marked.cjs');
const read=file=>fs.readFileSync(path.join(skillRoot,file),'utf8');
export function validateMarkdown(source) {
  if(typeof source!=='string' || !source.trim()) throw new Error('简历内容不能为空。');
  let names=0;
  marked.walkTokens(marked.lexer(source),token=>{
    if(token.type==='heading') {
      if(token.depth===1) names++;
      if(token.depth>3) throw new Error('简历只使用 # 姓名、## 栏目和 ### 条目标题。');
    }
    if(token.type==='table' || (token.type==='html' && /<\/?table\b/i.test(token.text))) throw new Error('LapisCV 简历不使用表格，请改为标题、段落和要点。');
    if(token.type==='code') throw new Error('简历不使用代码块，请改为普通文字或行内代码。');
  });
  if(names!==1) throw new Error('简历需要且只允许一个 # 姓名标题。');
}
const safeJson=value=>JSON.stringify(value).replace(/[<>&\u2028\u2029]/g,char=>`\\u${char.charCodeAt(0).toString(16).padStart(4,'0')}`);
const safeScript=source=>source.replace(/<\/script/gi,'<\\/script');
const plainScript=file=>read(file).replace(/^export /gm,'');
export function createPreview(markdown,{output,theme='classic'}={}) {
  validateMarkdown(markdown);
  if(!['classic','serif'].includes(theme)) throw new Error('主题必须是 classic 或 serif。');
  const styles={classic:read('styles/lapis-cv.css'),serif:read('styles/lapis-cv-serif.css')};
  const fontFiles=new Set(Object.values(styles).flatMap(css=>Array.from(css.matchAll(/\.\.\/fonts\/([^'"?)]+)/g),match=>match[1])));
  const fonts=Object.fromEntries(Array.from(fontFiles,file=>[file,fs.readFileSync(path.join(skillRoot,'fonts',file)).toString('base64')]));
  const session=createHash('sha256').update(path.resolve(output||'resume.html')).digest('hex').slice(0,24);
  const payload={markdown,initialTheme:theme,session,styles,fonts};
  const libraries=read('assets/vendor/marked.cjs')+'\n'+read('assets/vendor/purify.cjs');
  const logic=[plainScript('scripts/sanitize.js'),plainScript('scripts/paginate.js'),read('scripts/preview.js')].join('\n');
  const notices=['LICENSE','licenses/LapisCV-MIT.txt','licenses/JetBrainsMono-OFL.txt','licenses/marked-LICENSE.txt','licenses/dompurify-LICENSE.txt'].map(file=>`${file}\n\n${read(file)}`).join('\n\n--------------------\n\n');
  const escapedNotices=notices.replace(/[&<>]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[char]));
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'">
<title>LapisCV-SKILL · 简历预览</title>
<style id="resume-base">${read('styles/main.css')}</style><style id="resume-theme"></style><style>${read('assets/preview.css')}</style>
</head><body>
<header class="preview-toolbar">
  <span class="preview-brand">LapisCV-SKILL</span>
  <div class="preview-actions">
    <label class="theme-control">样式 <select id="theme" aria-label="简历样式"><option value="classic">Classic</option><option value="serif">Serif</option></select></label>
    <input id="photo-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden aria-label="选择本地个人照片">
    <button id="photo-upload" type="button">添加照片</button>
    <button id="photo-toggle" type="button" hidden>关闭头像</button>
    <button id="photo-clear" type="button" hidden>移除照片</button>
    <button id="print" class="primary-action" type="button" disabled>导出 PDF</button>
  </div>
</header>
<p class="preview-help">内容需要调整时，继续告诉 AI；照片只在本机浏览器中处理。</p>
<p id="feedback" role="status" aria-live="polite">正在加载字体并排版…</p>
<div class="preview-viewport"><div id="preview-size"><main id="resume-pages" aria-label="A4 简历预览"></main></div></div>
<footer class="preview-footer"><p>导出时选择“另存为 PDF”、A4、100% 缩放、无页边距，关闭页眉页脚。</p><details class="license-notices"><summary>开源许可与来源</summary><pre>${escapedNotices}</pre></details></footer>
<noscript>请启用浏览器 JavaScript，以加载简历预览。</noscript>
<script id="resume-payload" type="application/json">${safeJson(payload)}</script>
<script>${safeScript(libraries)}</script>
<script>${safeScript(logic)}</script>
</body></html>`;
}
export function renderFile(input,output,theme='classic') {
  const inputPath=path.resolve(input), outputPath=path.resolve(output);
  if(inputPath===outputPath) throw new Error('输出文件不能覆盖 Markdown 源文件。');
  if(path.extname(outputPath).toLowerCase()!=='.html') throw new Error('输出文件应使用 .html 扩展名。');
  const markdown=fs.readFileSync(inputPath,'utf8');
  const html=createPreview(markdown,{output:outputPath,theme});
  fs.mkdirSync(path.dirname(outputPath),{recursive:true});
  // Replace the whole file atomically; the preview's identity is tied to its path.
  const temporary=`${outputPath}.${process.pid}.tmp`;
  try {fs.writeFileSync(temporary,html);fs.renameSync(temporary,outputPath);} finally {if(fs.existsSync(temporary)) fs.unlinkSync(temporary);}
  return outputPath;
}
function openBrowser(file) {
  const command=process.platform==='darwin'?'open':process.platform==='win32'?'rundll32.exe':'xdg-open';
  const args=process.platform==='win32'?['url.dll,FileProtocolHandler',file]:[file];
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{stdio:'ignore',shell:false});
    child.once('error',reject);
    child.once('exit',code=>code===0?resolve():reject(new Error(`无法自动打开浏览器（${command}，退出码 ${code}），请打开生成的 HTML。`)));
  });
}
async function cli() {
  const args=process.argv.slice(2),options={};
  for(let i=0;i<args.length;i++) {
    const key=args[i];
    if(key==='--open'||key==='--help') options[key.slice(2)]=true;
    else if(['--input','--output','--theme'].includes(key)) {
      if(!args[i+1]||args[i+1].startsWith('--')) throw new Error(`${key} 缺少值。`);
      options[key.slice(2)]=args[++i];
    } else throw new Error(`未知参数：${key}`);
  }
  if(options.help) {console.log('node scripts/render.mjs --input resume.md --output resume.html [--theme classic|serif] [--open]');return;}
  if(!options.input||!options.output) throw new Error('请提供 --input 和 --output。');
  const output=renderFile(options.input,options.output,options.theme||'classic');
  console.log(JSON.stringify({preview:output}));
  if(options.open) await openBrowser(output);
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) cli().catch(error=>{console.error(error.message);process.exitCode=1;});
