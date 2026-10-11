// SPDX-License-Identifier: GPL-3.0-only
(() => {
  const payload=JSON.parse(document.getElementById('resume-payload').textContent);
  const root=document.getElementById('resume-pages');
  const size=document.getElementById('preview-size');
  const viewport=document.querySelector('.preview-viewport');
  const themeStyle=document.getElementById('resume-theme');
  const themeSelect=document.getElementById('theme');
  const upload=document.getElementById('photo-upload');
  const toggle=document.getElementById('photo-toggle');
  const clear=document.getElementById('photo-clear');
  const fileInput=document.getElementById('photo-input');
  const print=document.getElementById('print');
  const feedback=document.getElementById('feedback');
  const storageKey=`lapiscv-skill:${payload.session}`;
  let state={theme:payload.initialTheme,photo:'',enabled:false};
  let durable=true;
  let rendering=0;
  let uploading=0;
  let busy=false;
  let pages=1;
  let transientMessage='';
  let printing=false;
  window.resumeStatus={ready:false,pages:0};

  function isPhoto(value) {return typeof value==='string' && value.length<2*1024*1024 && /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/]+=*$/i.test(value);}
  try {
    const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
    if(saved && ['classic','serif'].includes(saved.theme)) {
      state={theme:saved.theme,photo:isPhoto(saved.photo)?saved.photo:'',enabled:!!saved.enabled&&isPhoto(saved.photo)};
    }
  } catch {durable=false;}
  function save() {
    try {localStorage.setItem(storageKey,JSON.stringify(state));durable=true;}
    catch {durable=false;}
  }
  function controls() {
    themeSelect.value=state.theme;
    upload.textContent=busy?'读取照片…':state.photo?'更换照片':'添加照片';
    toggle.hidden=!state.photo;
    clear.hidden=!state.photo;
    toggle.textContent=state.enabled?'关闭头像':'恢复头像';
    toggle.setAttribute('aria-pressed',String(state.enabled));
    print.disabled=busy||!window.resumeStatus.ready||!!window.resumeStatus.horizontalOverflow;
  }
  function message(text,error=false) {
    feedback.textContent=text;
    feedback.dataset.error=String(error);
  }
  function scalePreview() {
    if(printing) return;
    const actualScale=Math.min(1,Math.max(.1,viewport.clientWidth/(210*96/25.4)));
    root.style.transform=`scale(${actualScale})`;
    size.style.width=`${210*96/25.4*actualScale}px`;
    size.style.height=`${(pages*pageHeight+(pages-1)*pageGap)*actualScale}px`;
  }
  function applyTheme() {
    const css=payload.styles[state.theme].replace(/url\(['"]?\.\.\/fonts\/([^'"?)]+)(?:\?[^'"\)]*)?['"]?\)/g,(_,file)=>{
      if(!payload.fonts[file]) throw new Error('随附字体不完整。');
      return `url('data:font/ttf;base64,${payload.fonts[file]}')`;
    }).replace(/\bbody\b/g,'#resume-pages');
    themeStyle.textContent=css;
    root.className=`theme-${state.theme}`;
  }
  function contentWithPhoto() {
    const safe=sanitizeResume(document,DOMPurify,marked.parse(payload.markdown));
    const container=document.createElement('main');
    container.innerHTML=safe;
    const name=container.querySelector(':scope > h1');
    if(name) {
      const header=document.createElement('div');
      header.className='resume-header';
      name.before(header);
      header.append(name);
      const contact=container.querySelector(':scope > blockquote');
      if(contact) header.append(contact);
      if(state.enabled && state.photo) {
        header.classList.add('has-avatar');
        const frame=document.createElement('div');
        frame.className='photo-frame';
        const image=document.createElement('img');
        image.className='avatar';
        image.alt='avatar';
        image.src=state.photo;
        frame.append(image);header.append(frame);
      }
    }
    return container.innerHTML;
  }
  async function render() {
    const generation=++rendering;
    window.resumeStatus={ready:false,pages};
    message('正在加载字体并排版…');
    controls();
    try {
      applyTheme();
      const content=contentWithPhoto();
      root.style.transform='none';
      root.innerHTML=`<section class="resume-page"><main class="page-content">${content}</main></section>`;
      root.getBoundingClientRect();
      await document.fonts.ready;
      await Promise.all(Array.from(root.querySelectorAll('img')).map(image=>image.decode()));
      if(generation!==rendering) return;
      if(Array.from(document.fonts).some(font=>font.status==='error')) throw new Error('字体加载失败，请重新打开预览。');
      const result=paginateDocument(document,content,root);
      pages=result.pages;
      window.resumeStatus={ready:true,...result,theme:state.theme,hasAvatar:state.enabled&&!!state.photo,durable};
      scalePreview();controls();
      if(result.horizontalOverflow) message('内容超出页面宽度，请让 AI 调整较长的标题或文字后再导出。',true);
      else if(!durable) message(`共 ${pages} 页 A4 · 当前浏览器无法保存照片和偏好，刷新后可能需要重新选择。`);
      else message(`共 ${pages} 页 A4${transientMessage?` · ${transientMessage}`:''}`);
      transientMessage='';
    } catch(error) {
      if(generation!==rendering) return;
      window.resumeStatus={ready:false,error:error.message||'简历排版失败。'};
      message(window.resumeStatus.error,true);controls();scalePreview();
    }
  }
  async function readPhoto(file) {
    if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error('请选择 PNG、JPEG、WebP 或 GIF 照片。');
    if(file.size>20*1024*1024) throw new Error('照片不能超过 20 MB。');
    const data=await new Promise((resolve,reject)=>{
      const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('照片读取失败。'));reader.readAsDataURL(file);
    });
    const image=new Image();image.src=data;
    try {await image.decode();} catch {throw new Error('照片无法解码，请选择有效图片。');}
    if(!image.naturalWidth||!image.naturalHeight) throw new Error('照片尺寸无效。');
    const edge=Math.min(image.naturalWidth,image.naturalHeight);
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=640;
    const context=canvas.getContext('2d');
    if(!context) throw new Error('浏览器不支持照片处理。');
    context.fillStyle='#fff';context.fillRect(0,0,640,640);
    context.drawImage(image,(image.naturalWidth-edge)/2,(image.naturalHeight-edge)/2,edge,edge,0,0,640,640);
    return canvas.toDataURL('image/jpeg',.9);
  }
  upload.addEventListener('click',()=>fileInput.click());
  fileInput.addEventListener('change',async()=>{
    const file=fileInput.files?.[0];fileInput.value='';if(!file) return;
    const current=++uploading;busy=true;controls();
    try {
      const photo=await readPhoto(file);
      if(current!==uploading) return;
      state.photo=photo;state.enabled=true;save();
      transientMessage='照片已在本机保存';
      await render();
    } catch(error) {if(current===uploading) message(error.message,true);}
    finally {if(current===uploading) {busy=false;controls();}}
  });
  toggle.addEventListener('click',()=>{uploading++;busy=false;state.enabled=!state.enabled;save();render();});
  clear.addEventListener('click',()=>{uploading++;busy=false;state.photo='';state.enabled=false;save();render();});
  themeSelect.addEventListener('change',()=>{state.theme=themeSelect.value;save();render();});
  print.addEventListener('click',()=>{
    if(!window.resumeStatus.ready||window.resumeStatus.horizontalOverflow||busy) return;
    try {window.print();} catch {message('当前浏览器无法打开打印，请使用桌面 Chrome 或 Edge。',true);}
  });
  window.addEventListener('beforeprint',()=>{printing=true;});
  window.addEventListener('afterprint',()=>{printing=false;scalePreview();});
  const observer=new ResizeObserver(scalePreview);observer.observe(viewport);
  controls();render();
})();
