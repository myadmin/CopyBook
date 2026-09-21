import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// 只引入实际用到的字重：正文 400 + 加粗 700。
// 全量 style.css 会一并带进「文楷 Mono」和 300 字重（项目从未引用），
// 即 6 套 × 97 个 unicode-range 分片，构建产物里多出约 20MB 字体文件。
import 'lxgw-wenkai-webfont/lxgwwenkai-regular.css';
import 'lxgw-wenkai-webfont/lxgwwenkai-bold.css';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
