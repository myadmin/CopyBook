// 笔顺动画预览：先随读音逐笔演示（横/竖/…与语音同步），再循环整字书写（屏幕专用，不参与打印）
import { useEffect, useRef, useState } from 'react';
import { loadStrokeData } from '../core/strokes';
import { loadStrokeNames } from '../core/strokeNames';
import { charSpeechDone, speak, stopSpeaking } from '../core/speech';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function StrokePreview({ char }: { char: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [names, setNames] = useState<string[] | null>(null);
  const narrateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || !char) return;
    el.innerHTML = '<div class="stroke-err">加载中…</div>';
    setNames(null);
    narrateRef.current = null;
    let alive = true;
    let pass = 0; // 演示轮次：重播/换字后，旧循环凭此自停

    void (async () => {
      // hanzi-writer 只服务于这个预览，动态引入以挪出首屏包
      const { default: HanziWriter } = await import('hanzi-writer');
      const [d, ns] = await Promise.all([loadStrokeData(char), loadStrokeNames(char)]);
      if (!alive || !el) return;
      if (!d) {
        el.innerHTML = '<div class="stroke-err">无此字笔画数据</div>';
        return;
      }
      // 名称数与笔画数对不上时视为数据不可靠，退回仅读字音
      const validNames = ns && ns.length === d.strokes.length ? ns : null;
      setNames(validNames);
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

      const narrate = (interrupt: boolean) => {
        const run = ++pass;
        if (interrupt) stopSpeaking(); // 初始演示不打断点击时的字音，排队等它读完
        void (async () => {
          await charSpeechDone();
          await delay(120); // 朗读引擎换气，避免打断后立刻发声被吞掉
          if (validNames) {
            for (let i = 0; i < validNames.length; i++) {
              if (!alive || run !== pass) return;
              // 朗读与该笔动画同步：两者都结束后稍作停顿再下一笔
              await Promise.allSettled([writer.animateStroke(i), speak(validNames[i], 0.8)]);
              if (!alive || run !== pass) return;
              await delay(200);
            }
          } else {
            await writer.animateCharacter();
            if (!alive || run !== pass) return;
          }
          // 之后静默循环整字书写
          while (alive && run === pass) {
            await writer.animateCharacter();
            if (!alive || run !== pass) return;
            await delay(400);
          }
        })();
      };
      narrateRef.current = () => narrate(true);
      narrate(false);
    })();

    return () => {
      alive = false;
      pass++;
      narrateRef.current = null;
      el.innerHTML = '';
    };
  }, [char]);

  return (
    <>
      <div className="stroke-preview" ref={boxRef} />
      {names && (
        <div className="stroke-names">
          <span className="stroke-names-text" title={names.join('、')}>笔顺：{names.join('、')}</span>
          <button className="stroke-replay" onClick={() => narrateRef.current?.()}>🔊 再读一遍</button>
        </div>
      )}
    </>
  );
}
