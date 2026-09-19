// 朗读：浏览器原生 Web Speech API（屏幕专用，不参与打印/导出）
// 无语音能力时静默降级；中文音色优先普通话，读两遍（第二遍放慢）方便小朋友跟读

let voice: SpeechSynthesisVoice | null = null;
let voicePicked = false;

function pickVoice(): SpeechSynthesisVoice | null {
  if (voicePicked) return voice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // 优先简体中文普通话音色，其次任意简中，再次任意中文；都没有则交给引擎按 lang 兜底
  voice =
    voices.find(v => /zh[-_](CN|SG)/i.test(v.lang) && /普通话|xiaoxiao|xiaoyi|tingting|meijia|hanhan|yunxi/i.test(v.name)) ??
    voices.find(v => /zh[-_](CN|SG)/i.test(v.lang)) ??
    voices.find(v => /^zh/i.test(v.lang)) ??
    null;
  voicePicked = true;
  return voice;
}

// 打断代数：每次打断自增；被打断的朗读链凭代号过期，不再续播
let generation = 0;

/** 朗读一段文本；resolve 于读完。不会打断已在排队的内容，需要打断请先调 stopSpeaking() */
export function speak(text: string, rate = 0.85): Promise<void> {
  const gen = generation;
  return new Promise(resolve => {
    const synth = window.speechSynthesis;
    if (!synth || !text || gen !== generation) { resolve(); return; }
    let done = false;
    let watchdog: ReturnType<typeof setTimeout>;
    const finish = () => { if (!done) { done = true; clearTimeout(watchdog); resolve(); } };
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = rate;
    u.onend = finish;
    u.onerror = finish;
    // 兜底：个别环境不触发 onend/onerror，避免永远挂起阻塞后续朗读
    watchdog = setTimeout(finish, Math.max(4000, text.length * 3000));
    synth.speak(u);
  });
}

/** 立即打断当前及排队中的朗读（进行中的朗读链随之作废） */
export function stopSpeaking() {
  generation++;
  window.speechSynthesis?.cancel();
}

// 最近一次「读字音」的完成时机：笔顺预览借此等字音读完，再开始逐笔朗读
let charSpeech: Promise<void> = Promise.resolve();
export const charSpeechDone = () => charSpeech;

/** 朗读一个汉字（读两遍加深印象）；必须在用户点击等手势内同步调用（iOS 要求首次朗读发生在手势里） */
export function speakChar(ch: string) {
  const synth = window.speechSynthesis;
  if (!synth || !ch) return;
  const read = () => {
    const gen = generation;
    return speak(ch, 0.85).then(() => (gen === generation ? speak(ch, 0.65) : undefined));
  };
  if (pickVoice()) {
    stopSpeaking();
    charSpeech = read();
  } else {
    // Chrome 等浏览器音色列表异步加载，首次可能为空：等 voiceschanged（或 1s 超时）后补读；
    // charSpeech 先占位挂起，保证笔顺预览等真正的字音读完才开始逐笔朗读
    let spoken = false;
    charSpeech = new Promise<void>(resolve => {
      const once = () => {
        if (spoken) return;
        spoken = true;
        synth.removeEventListener('voiceschanged', once);
        stopSpeaking();
        read().then(resolve, resolve);
      };
      synth.addEventListener('voiceschanged', once);
      setTimeout(once, 1000);
    });
  }
}
