// 笔顺动画预览：hanzi-writer 循环书写演示（屏幕专用，不参与打印）
import { useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import { loadStrokeData } from '../core/strokes';

export default function StrokePreview({ char }: { char: string }) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || !char) return;
    el.innerHTML = '<div class="stroke-err">加载中…</div>';
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    loadStrokeData(char).then((d) => {
      if (!alive || !el) return;
      if (!d) {
        el.innerHTML = '<div class="stroke-err">无此字笔画数据</div>';
        return;
      }
      el.innerHTML = '';
      const writer = HanziWriter.create(el, char, {
        width: 150,
        height: 150,
        padding: 6,
        strokeColor: '#c0392b',
        radicalColor: '#2c6e49',
        outlineColor: '#dfe3e8',
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 280,
        showCharacter: false,
        showOutline: true,
        charDataLoader: (ch, onLoad, onError) => {
          loadStrokeData(ch).then((dd) => (dd ? onLoad(dd) : onError(new Error(`无「${ch}」笔画数据`))));
        },
      });
      const run = () => {
        if (!alive) return;
        writer.animateCharacter().then(() => {
          if (alive) timer = setTimeout(run, 400);
        });
      };
      run();
    });

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      el.innerHTML = '';
    };
  }, [char]);

  return <div className="stroke-preview" ref={boxRef} />;
}
