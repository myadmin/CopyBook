// 预览区缩略图导航：页面 ≥3 时右侧显示竖排缩略条，克隆各页 SVG 缩小绘制；
// 点击滚到该页，滚动高亮当前页。克隆体去掉 svg.sheet 类名，避免混进 PNG 导出查询。
import { useEffect, useRef } from 'react';

const MM_PX = 3.7795275591; // 1mm ≈ 3.78 CSS px
const SCALE = 0.085;

export default function PageNav({ sig, count }: { sig: unknown; count: number }) {
  const boxRef = useRef<HTMLDivElement>(null);

  // 重建缩略图：防抖 300ms，避免每次键入都克隆几十个大型 SVG
  useEffect(() => {
    if (count < 3) return;
    const timer = setTimeout(() => {
      const box = boxRef.current;
      if (!box) return;
      box.innerHTML = '';
      [...document.querySelectorAll<HTMLElement>('.sheet-wrap')].forEach((s, i) => {
        const svg = s.querySelector('svg');
        if (!svg) return;
        const btn = document.createElement('button');
        const clone = svg.cloneNode(true) as SVGSVGElement;
        clone.removeAttribute('class');
        clone.removeAttribute('width');
        clone.removeAttribute('height');
        const vb = (clone.getAttribute('viewBox') ?? '0 0 210 297').trim().split(/\s+/).map(Number);
        clone.style.width = `${Math.round(vb[2] * MM_PX * SCALE)}px`;
        clone.style.height = `${Math.round(vb[3] * MM_PX * SCALE)}px`;
        clone.style.display = 'block';
        clone.style.pointerEvents = 'none';
        btn.appendChild(clone);
        btn.title = `第 ${i + 1} 页`;
        btn.onclick = () => s.scrollIntoView({ behavior: 'smooth', block: 'start' });
        box.appendChild(btn);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [sig, count]);

  // 滚动跟随：视口上方 1/3 线以下的最后一页视为当前页
  useEffect(() => {
    if (count < 3) return;
    const onScroll = () => {
      const wraps = [...document.querySelectorAll<HTMLElement>('.sheet-wrap')];
      let cur = 0;
      wraps.forEach((w, i) => { if (w.getBoundingClientRect().top < window.innerHeight / 3) cur = i; });
      const box = boxRef.current;
      if (box) for (let i = 0; i < box.children.length; i++) box.children[i].className = i === cur ? 'active' : '';
    };
    document.addEventListener('scroll', onScroll, true);
    onScroll();
    return () => document.removeEventListener('scroll', onScroll, true);
  }, [count]);

  if (count < 3) return null;
  return <div className="page-nav" ref={boxRef} />;
}
