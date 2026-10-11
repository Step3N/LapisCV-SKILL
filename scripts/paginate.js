// SPDX-License-Identifier: GPL-3.0-only
// Paginate the resume container so preview and print share identical page content.
export const pageHeight = 297 * 96 / 25.4;
export const pageGap = 6 * 96 / 25.4;
const millimeter = 96 / 25.4;
export function paginateDocument(doc, html, target = doc.body) {
    target.replaceChildren();
    const source = doc.createElement('main');
    source.innerHTML = html;
    let page;
    let content;
    let parents = new Map();
    const view = doc.defaultView;
    const pageList = [];
    function createPage() {
        parents = new Map();
        page = doc.createElement('section');
        page.className = 'resume-page';
        page.setAttribute('aria-label', `第 ${pageList.length + 1} 页`);
        content = doc.createElement('main');
        content.className = 'page-content';
        page.append(content);
        target.append(page);
        pageList.push(page);
    }
    function fits() {
        const limit = page.getBoundingClientRect().top + pageHeight - parseFloat(view.getComputedStyle(page).paddingBottom) - millimeter;
        return Array.from(content.querySelectorAll('*')).every(element => element.getBoundingClientRect().bottom <= limit + 0.5)
            && content.getBoundingClientRect().bottom <= limit + 0.5;
    }
    function cleanEmpty() {
        for (const element of Array.from(content.querySelectorAll('*')).reverse()) {
            if (Array.from(parents.values()).includes(element) && !element.hasChildNodes())
                element.remove();
        }
    }
    function parentFor(path) {
        let parent = content;
        for (const original of path) {
            let clone = parents.get(original);
            if (!clone?.isConnected) {
                clone = original.cloneNode(false);
                if (original.tagName === 'TABLE') {
                    for (const header of original.querySelectorAll(':scope > caption, :scope > thead'))
                        clone.append(header.cloneNode(true));
                }
                parent.append(clone);
                parents.set(original, clone);
            }
            parent = clone;
        }
        return parent;
    }
    function nextPage() {
        cleanEmpty();
        // Carry section/entry headings with their first paragraph or list item.
        const headings = [];
        let last = content.lastElementChild;
        while (last?.matches('h2,h3,h4,h5,h6,.entry-title,div[alt="entry-title"]')) {
            headings.unshift(last);
            last = last.previousElementSibling;
        }
        if (!last)
            headings.length = 0;
        for (const heading of headings)
            heading.parentNode.removeChild(heading);
        createPage();
        content.append(...headings);
    }
    function append(node, path = []) {
        if (node.nodeType === 3 && !node.textContent?.trim())
            return;
        const clone = node.cloneNode(true);
        parentFor(path).append(clone);
        if (fits())
            return;
        const pageStyle = view.getComputedStyle(page);
        const availableHeight = pageHeight - parseFloat(pageStyle.paddingTop) - parseFloat(pageStyle.paddingBottom) - millimeter;
        const oversized = clone.nodeType === 1 && clone.getBoundingClientRect().height > availableHeight;
        clone.parentNode.removeChild(clone);
        cleanEmpty();
        const element = node.nodeType === 1 ? node : null;
        // Lists and table bodies can continue across pages at item/row boundaries.
        const container = element?.matches('ul,ol,table,thead,tbody,tfoot');
        if (!container && !oversized && content.textContent?.trim()) {
            nextPage();
            parentFor(path).append(clone);
            if (fits())
                return;
            clone.parentNode.removeChild(clone);
            cleanEmpty();
        }
        if (element && (container || Array.from(element.children).some(child => child.matches('div,p,ul,ol,table,section,article,h1,h2,h3,h4,h5,h6')))) {
            const children = Array.from(element.childNodes);
            let ordinal = Number(element.getAttribute('start') || 1);
            for (const child of children) {
                if (element.tagName === 'TABLE' && child.nodeType === 1 && child.matches('caption,thead'))
                    continue;
                if (element.tagName === 'OL' && child.nodeType === 1 && child.tagName === 'LI') {
                    const item = child;
                    ordinal = item.hasAttribute('value') ? item.value : ordinal;
                    item.value = ordinal++;
                }
                append(child, [...path, element]);
            }
            return;
        }
        const text = node.textContent || '';
        if (!text)
            throw new Error('内容无法放入 A4 页面，请检查图片或表格大小。');
        function point(root, offset) {
            const textNodes = [];
            const walker = doc.createTreeWalker(root, 4);
            let current;
            while ((current = walker.nextNode()))
                textNodes.push(current);
            for (const part of textNodes) {
                if (offset <= part.length)
                    return [part, offset];
                offset -= part.length;
            }
            const last = textNodes[textNodes.length - 1];
            return [last, last.length];
        }
        function fragment(start, end) {
            if (!element)
                return doc.createTextNode(text.slice(start, end));
            // Trim a full clone instead of cloning a text-only Range: this retains
            // enclosing emphasis/link tags even when both ends are inside one tag.
            const wrapper = element.cloneNode(true);
            const range = doc.createRange();
            if (end < text.length) {
                range.setStart(...point(wrapper, end));
                range.setEnd(wrapper, wrapper.childNodes.length);
                range.deleteContents();
            }
            if (start > 0) {
                range.setStart(wrapper, 0);
                range.setEnd(...point(wrapper, start));
                range.deleteContents();
            }
            if (start > 0)
                wrapper.classList.add('pagination-continuation');
            return wrapper;
        }
        // Split oversized paragraphs on grapheme boundaries, keeping inline markup.
        const offsets = [0, ...Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), part => part.index + part.segment.length)];
        let start = 0;
        while (start < offsets.length - 1) {
            let low = start + 1;
            let high = offsets.length - 1;
            let end = start;
            const parent = parentFor(path);
            while (low <= high) {
                const middle = Math.floor((low + high) / 2);
                const candidate = fragment(offsets[start], offsets[middle]);
                parent.append(candidate);
                const fitsPage = fits();
                parent.removeChild(candidate);
                if (fitsPage) {
                    end = middle;
                    low = middle + 1;
                }
                else
                    high = middle - 1;
            }
            if (end === start)
                throw new Error('内容无法放入 A4 页面，请检查字号、图片或表格大小。');
            // Prefer a nearby word/punctuation boundary to splitting a word.
            if (end < offsets.length - 1) {
                for (let index = end; index > Math.max(start, end - 40); index--) {
                    if (/[\s，。；、！？,.!?;]/u.test(text.slice(offsets[index - 1], offsets[index]))) {
                        end = index;
                        break;
                    }
                }
            }
            parent.append(fragment(offsets[start], offsets[end]));
            start = end;
            if (start < offsets.length - 1)
                nextPage();
        }
    }
    createPage();
    for (const child of Array.from(source.childNodes)) {
        if (child.nodeType === 1 && child.tagName === 'HR') {
            if (content.textContent?.trim()) createPage();
            continue;
        }
        append(child);
    }
    if (pageList.length > 1 && !content.textContent?.trim()) {
        pageList.pop().remove();
    }
    let horizontalOverflow = false;
    for (const sheet of pageList) {
        const main = sheet.firstElementChild;
        const bounds = main.getBoundingClientRect();
        const paper = sheet.getBoundingClientRect();
        const check = (rect, avatar = false) => {
            if (rect.width && (rect.left < (avatar ? paper.left : bounds.left) - 1 || rect.right > (avatar ? paper.right : bounds.right) + 1))
                horizontalOverflow = true;
        };
        for (const element of main.querySelectorAll('*'))
            check(element.getBoundingClientRect(), element.matches('.avatar,img[alt="avatar"]'));
        const walker = doc.createTreeWalker(main, 4);
        const range = doc.createRange();
        let node;
        while ((node = walker.nextNode())) {
            range.selectNodeContents(node);
            for (const rect of range.getClientRects())
                check(rect);
        }
    }
    return { pages: pageList.length, horizontalOverflow };
}
