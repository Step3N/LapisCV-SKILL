// SPDX-License-Identifier: GPL-3.0-only
export function sanitizeResume(doc, purifier, html) {
  const fragment=purifier.sanitize(html,{
    ALLOWED_TAGS:['h1','h2','h3','p','blockquote','ul','li','strong','em','code','a','br','hr','div','span'],
    ALLOWED_ATTR:['class','alt','href'],
    ALLOW_DATA_ATTR:false,
    RETURN_DOM_FRAGMENT:true,
  });
  for(const element of fragment.querySelectorAll('*')) {
    const entry=element.tagName==='DIV' && (element.classList.contains('entry-title') || element.getAttribute('alt')==='entry-title');
    const icon=element.tagName==='SPAN' && element.classList.contains('icon');
    element.removeAttribute('class');
    element.removeAttribute('alt');
    if(entry) element.className='entry-title';
    if(icon) element.className='icon';
    if(element.tagName==='A') {
      const href=element.getAttribute('href')||'';
      if(!/^(https?:\/\/|mailto:|tel:)/i.test(href)) element.removeAttribute('href');
      element.setAttribute('target','_blank');
      element.setAttribute('rel','noopener noreferrer');
      element.setAttribute('referrerpolicy','no-referrer');
    }
  }
  const container=doc.createElement('main');
  container.append(fragment);
  return container.innerHTML;
}
