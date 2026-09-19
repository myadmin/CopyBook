// 字音朗读：浏览器原生 Web Speech API，点击笔顺字格时读出该字（屏幕专用，不参与打印/导出）
// 无语音能力时静默跳过；中文音色优先普通话，读两遍（第二遍放慢）方便小朋友跟读

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

/** 朗读一个汉字：读两遍加深印象；必须在用户点击等手势内同步调用（iOS 要求） */
export function speakChar(ch: string) {
  const synth = window.speechSynthesis;
  if (!synth || !ch) return;
  const speak = () => {
    synth.cancel(); // 快速连点其他字时打断上一段朗读
    for (const rate of [0.85, 0.65]) {
      const u = new SpeechSynthesisUtterance(ch);
      u.lang = 'zh-CN';
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = rate;
      synth.speak(u);
    }
  };
  if (pickVoice()) {
    speak();
  } else {
    // Chrome 等浏览器音色列表异步加载，首次可能为空：就绪后补读，超时兜底避免永不发声
    let spoken = false;
    const once = () => {
      if (spoken) return;
      spoken = true;
      synth.removeEventListener('voiceschanged', once);
      speak();
    };
    synth.addEventListener('voiceschanged', once);
    setTimeout(once, 1000);
  }
}
