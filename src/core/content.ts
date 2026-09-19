// 内容库：内置公版古诗词（按年级分组）、常用字表、蒙学经典、拼音专帖与英语词库。
// 每个条目的 text 直接写入练习文本；一行即一个练习行（换行 = 分页内的换行断点）。
// 分类标注 grid:'english' 的（拼音/英语），选篇时自动切换为四线格。

export interface ContentItem {
  name: string;
  text: string;
}

export interface ContentCategory {
  name: string;
  grid?: 'english';   // 选中本分类篇目时自动切换的格子（四线格）
  items: ContentItem[];
}

export const CONTENT_LIBRARY: ContentCategory[] = [
  {
    name: '拼音练习',
    grid: 'english',
    items: [
      { name: '单韵母（6个）', text: 'a o e i u ü' },
      { name: '声母（23个）', text: 'b p m f\nd t n l\ng k h\nj q x\nzh ch sh r\nz c s\ny w' },
      { name: '复韵母 · 特殊韵母', text: 'ai ei ui\nao ou iu\nie üe er' },
      { name: '前后鼻韵母（16个）', text: 'an en in un ün\nang eng ing ong' },
      { name: '整体认读音节（16个）', text: 'zhi chi shi ri\nzi ci si\nyi wu yu\nye yue yuan\nyin yun ying' },
      { name: '四声练习', text: 'ā á ǎ à\nō ó ǒ ò\nē é ě è\nī í ǐ ì\nū ú ǔ ù\nǖ ǘ ǚ ǜ' },
    ],
  },
  {
    name: '常用字表',
    items: [
      { name: '启蒙基本字（36字）', text: '一二三十 人大小 上下中\n口耳目 手足 日月水\n火山石 田土 云天\n风雨 丝 弓 刀 尺' },
      { name: '高频字 · 前96字', text: '的一是不了 人我在有 他这上们来 到时大地\n为子中你说 生国年着 就那和要她 出也得里\n后自以会家 可下而过 天去能对小 多然于心\n学么之都好 看起发当 没成只如事 把还用第\n样道想作种 开美总从无 情己面最女 但现前些所\n同日手又行 意动方期它 头经长儿回 位分爱老因' },
      { name: '一年级上册生字（节选）', text: '天地人 你我他 一二三四五 上下\n口耳目 手足 站坐 日月水火山石田土\n对云雨 风花鸟 六七八九十 爸妈马\n土不画 打棋鸡 字词语 句子桌纸文' },
      { name: '数字与方位', text: '一二三四五 六七八九十\n上下左右 前后内外 中\n东南西北 远近高低 多少' },
      { name: '自然与气象', text: '日月星光 风云雷雨 山水火石\n天地田土 草木禾苗 江河湖海\n春夏秋冬 冷暖干湿 花鸟虫鱼' },
      { name: '人体与动作', text: '口耳目手足 头面发眉眼\n走跑跳坐立 来去开关开合\n吃住说读写 听看画打唱' },
    ],
  },
  {
    name: '古诗词 · 一年级',
    items: [
      { name: '一上 · 咏鹅 · 骆宾王', text: '鹅，鹅，鹅，\n曲项向天歌。\n白毛浮绿水，\n红掌拨清波。' },
      { name: '一上 · 江南 · 汉乐府', text: '江南可采莲，\n莲叶何田田。\n鱼戏莲叶间，\n鱼戏莲叶东，\n鱼戏莲叶西。' },
      { name: '一上 · 画', text: '远看山有色，\n近听水无声。\n春去花还在，\n人来鸟不惊。' },
      { name: '一上 · 古朗月行（节选） · 李白', text: '小时不识月，\n呼作白玉盘。\n又疑瑶台镜，\n飞在青云端。' },
      { name: '一上 · 风 · 李峤', text: '解落三秋叶，\n能开二月花。\n过江千尺浪，\n入竹万竿斜。' },
      { name: '一下 · 静夜思 · 李白', text: '床前明月光，\n疑是地上霜。\n举头望明月，\n低头思故乡。' },
      { name: '一下 · 春晓 · 孟浩然', text: '春眠不觉晓，\n处处闻啼鸟。\n夜来风雨声，\n花落知多少。' },
      { name: '一下 · 小池 · 杨万里', text: '泉眼无声惜细流，\n树阴照水爱晴柔。\n小荷才露尖尖角，\n早有蜻蜓立上头。' },
      { name: '一下 · 赠汪伦 · 李白', text: '李白乘舟将欲行，\n忽闻岸上踏歌声。\n桃花潭水深千尺，\n不及汪伦送我情。' },
      { name: '一下 · 寻隐者不遇 · 贾岛', text: '松下问童子，\n言师采药去。\n只在此山中，\n云深不知处。' },
      { name: '一下 · 画鸡 · 唐寅', text: '头上红冠不用裁，\n满身雪白走将来。\n平生不敢轻言语，\n一叫千门万户开。' },
    ],
  },
  {
    name: '古诗词 · 二年级',
    items: [
      { name: '二上 · 登鹳雀楼 · 王之涣', text: '白日依山尽，\n黄河入海流。\n欲穷千里目，\n更上一层楼。' },
      { name: '二上 · 望庐山瀑布 · 李白', text: '日照香炉生紫烟，\n遥看瀑布挂前川。\n飞流直下三千尺，\n疑是银河落九天。' },
      { name: '二上 · 江雪 · 柳宗元', text: '千山鸟飞绝，\n万径人踪灭。\n孤舟蓑笠翁，\n独钓寒江雪。' },
      { name: '二上 · 夜宿山寺 · 李白', text: '危楼高百尺，\n手可摘星辰。\n不敢高声语，\n恐惊天上人。' },
      { name: '二上 · 敕勒歌 · 北朝民歌', text: '敕勒川，阴山下，\n天似穹庐，笼盖四野。\n天苍苍，野茫茫，\n风吹草低见牛羊。' },
      { name: '二下 · 村居 · 高鼎', text: '草长莺飞二月天，\n拂堤杨柳醉春烟。\n儿童散学归来早，\n忙趁东风放纸鸢。' },
      { name: '二下 · 咏柳 · 贺知章', text: '碧玉妆成一树高，\n万条垂下绿丝绦。\n不知细叶谁裁出，\n二月春风似剪刀。' },
      { name: '二下 · 赋得古原草送别（节选） · 白居易', text: '离离原上草，\n一岁一枯荣。\n野火烧不尽，\n春风吹又生。' },
      { name: '二下 · 悯农 · 李绅', text: '锄禾日当午，\n汗滴禾下土。\n谁知盘中餐，\n粒粒皆辛苦。' },
      { name: '二下 · 晓出净慈寺送林子方 · 杨万里', text: '毕竟西湖六月中，\n风光不与四时同。\n接天莲叶无穷碧，\n映日荷花别样红。' },
      { name: '二下 · 绝句 · 杜甫', text: '两个黄鹂鸣翠柳，\n一行白鹭上青天。\n窗含西岭千秋雪，\n门泊东吴万里船。' },
    ],
  },
  {
    name: '古诗词 · 三年级',
    items: [
      { name: '所见 · 袁枚', text: '牧童骑黄牛，\n歌声振林樾。\n意欲捕鸣蝉，\n忽然闭口立。' },
      { name: '山行 · 杜牧', text: '远上寒山石径斜，\n白云生处有人家。\n停车坐爱枫林晚，\n霜叶红于二月花。' },
      { name: '赠刘景文 · 苏轼', text: '荷尽已无擎雨盖，\n菊残犹有傲霜枝。\n一年好景君须记，\n最是橙黄橘绿时。' },
      { name: '夜书所见 · 叶绍翁', text: '萧萧梧叶送寒声，\n江上秋风动客情。\n知有儿童挑促织，\n夜深篱落一灯明。' },
      { name: '望天门山 · 李白', text: '天门中断楚江开，\n碧水东流至此回。\n两岸青山相对出，\n孤帆一片日边来。' },
      { name: '饮湖上初晴后雨 · 苏轼', text: '水光潋滟晴方好，\n山色空蒙雨亦奇。\n欲把西湖比西子，\n淡妆浓抹总相宜。' },
      { name: '望洞庭 · 刘禹锡', text: '湖光秋月两相和，\n潭面无风镜未磨。\n遥望洞庭山水翠，\n白银盘里一青螺。' },
      { name: '早发白帝城 · 李白', text: '朝辞白帝彩云间，\n千里江陵一日还。\n两岸猿声啼不住，\n轻舟已过万重山。' },
      { name: '忆江南 · 白居易', text: '江南好，\n风景旧曾谙。\n日出江花红胜火，\n春来江水绿如蓝。\n能不忆江南？' },
      { name: '元日 · 王安石', text: '爆竹声中一岁除，\n春风送暖入屠苏。\n千门万户曈曈日，\n总把新桃换旧符。' },
    ],
  },
  {
    name: '经典蒙学',
    items: [
      { name: '三字经（节选）', text: '人之初，性本善。\n性相近，习相远。\n苟不教，性乃迁。\n教之道，贵以专。' },
      { name: '千字文（节选）', text: '天地玄黄，宇宙洪荒。\n日月盈昃，辰宿列张。\n寒来暑往，秋收冬藏。\n闰余成岁，律吕调阳。' },
      { name: '百家姓（节选）', text: '赵钱孙李，周吴郑王。\n冯陈褚卫，蒋沈韩杨。\n朱秦尤许，何吕施张。\n孔曹严华，金魏陶姜。' },
      { name: '弟子规（节选）', text: '弟子规，圣人训。\n首孝弟，次谨信。\n泛爱众，而亲仁。\n有余力，则学文。' },
      { name: '笠翁对韵（节选）', text: '天对地，雨对风。\n大陆对长空。\n山花对海树，\n赤日对苍穹。' },
      { name: '声律启蒙 · 一东', text: '云对雨，雪对风，\n晚照对晴空。\n来鸿对去燕，\n宿鸟对鸣虫。' },
    ],
  },
  {
    name: '励志短句 · 对联',
    items: [
      { name: '励志短句', text: '好好学习，天天向上。\n书山有路勤为径，\n学海无涯苦作舟。\n千里之行，始于足下。' },
      { name: '五言联 · 读书', text: '书山勤为径\n学海苦作舟' },
      { name: '七言联 · 新春', text: '天增岁月人增寿\n春满乾坤福满门' },
      { name: '七言联 · 修身', text: '宝剑锋从磨砺出\n梅花香自苦寒来' },
      { name: '成语一组', text: '一心一意 三心二意 七上八下\n自高自大 绘声绘色 十全十美' },
    ],
  },
  {
    name: '英语词库',
    grid: 'english',
    items: [
      { name: '字母表 · 大小写', text: 'Aa Bb Cc Dd Ee Ff Gg\nHh Ii Jj Kk Ll Mm Nn Oo Pp\nQq Rr Ss Tt Uu Vv Ww Xx Yy Zz' },
      { name: '音标 · 元音20', text: 'i: i e æ ɑ: ɔ: ɜ: ə\nʌ ʊ u: ɒ\neɪ aɪ ɔɪ aʊ əʊ ɪə ʊə' },
      { name: '音标 · 辅音28', text: 'p b t d k ɡ f s θ\nʃ h r m n ŋ l\nv z ð ʒ w j\ntʃ dʒ tr dr ts dz' },
      { name: '主题词 · 文具', text: 'pen pencil book bag\nruler eraser crayon school\ndesk chair' },
      { name: '主题词 · 动物', text: 'cat dog duck pig bird fish\nbear panda monkey tiger\nelephant rabbit horse' },
      { name: '主题词 · 颜色', text: 'red yellow blue green\nblack white orange brown\npink purple grey' },
      { name: '主题词 · 数字', text: 'one two three four five\nsix seven eight nine ten' },
      { name: '主题词 · 水果', text: 'apple pear orange peach\nbanana grape mango\nwatermelon strawberry' },
      { name: '主题词 · 家庭', text: 'dad mom brother sister\ngrandpa grandma family\nbaby uncle aunt' },
      { name: '主题词 · 身体', text: 'head face eye ear nose\nmouth arm hand leg foot\nbody hair toe' },
      { name: '主题词 · 天气季节', text: 'rain snow wind cloud\nsunny cloudy warm cold\nspring summer autumn winter' },
    ],
  },
];
