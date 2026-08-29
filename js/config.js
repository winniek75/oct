/* =========================================================
   ★ お店側で編集するのはこのファイルだけでOK ★
   料金・車種・決済リンク（Stripe Payment Links）を設定します。
========================================================= */
const OCTO_CONFIG = {

  // 車種と料金（円・税込）。durationキー: 3h=3時間 / 1d=1日 / 2d=1泊2日
  bikes: [
    {
      id: "ebike",
      img: "images/bike-ebike.jpg",
      price: { "3h": 3000, "1d": 5000, "2d": 8000 },
      name: { ja: "eバイク（電動アシスト）", en: "E-Bike (Pedal Assist)", ko: "전기자전거 (E-Bike)", zh: "电动辅助自行车 (E-Bike)" },
      tag:  { ja: "一番人気・坂道もラクラク", en: "Most popular · Effortless on hills", ko: "가장 인기 · 언덕도 편하게", zh: "最受欢迎 · 上坡轻松" },
      desc: { ja: "ARCHON DESIGN A03など、プロショップ整備のeバイク。坂道の多い世田谷エリアもラクラク、観光の行動範囲が一気に広がります。",
              en: "Pro-maintained e-bikes like the ARCHON DESIGN A03. Tackle Setagaya's hills effortlessly and cover 3x the ground.",
              ko: "ARCHON DESIGN A03 등 프로숍이 정비한 전기자전거. 세타가야의 언덕도 편하게, 관광 반경이 확 넓어집니다.",
              zh: "ARCHON DESIGN A03等专业车店维护的电动自行车，轻松应对世田谷的坡道，观光范围扩大三倍。" }
    },
    {
      id: "cruiser",
      img: "images/bike-cruiser.jpg",
      price: { "3h": 2000, "1d": 3500, "2d": 6000 },
      name: { ja: "ストレッチクルーザー", en: "Stretch Cruiser", ko: "스트레치 크루저", zh: "拉伸巡航车" },
      tag:  { ja: "写真映え No.1", en: "Best for photos", ko: "인생샷 No.1", zh: "拍照最上镜" },
      desc: { ja: "BRONX BUGGY STRETCHなど西海岸スタイルのクルーザー。世田谷の街を流すだけで絵になります。",
              en: "West-coast style cruisers like the BRONX BUGGY STRETCH. Cruise Setagaya streets — every ride is a photo op.",
              ko: "BRONX BUGGY STRETCH 등 웨스트코스트 스타일 크루저. 세타가야 거리를 달리는 것만으로 그림이 됩니다.",
              zh: "BRONX BUGGY STRETCH等西海岸风格巡航车，骑行世田谷街头，处处皆是美景。" }
    },
    {
      id: "city",
      img: "images/bike-city.jpg",
      price: { "3h": 1500, "1d": 2500, "2d": 4000 },
      name: { ja: "シティバイク", en: "City Bike", ko: "시티 바이크", zh: "城市自行车" },
      tag:  { ja: "気軽に街乗り", en: "Easy city riding", ko: "가볍게 시내 라이딩", zh: "轻松市区骑行" },
      desc: { ja: "カゴ付きで買い物や下町散策に。初めての方にもおすすめ。",
              en: "Basket included — perfect for shopping streets and old-town strolls.",
              ko: "바구니 장착. 쇼핑과 시내 산책에 최적.",
              zh: "带车筐，适合逛街和老街漫步。" }
    }
  ],

  // ★ Stripeの「支払いリンク（Payment Links）」を作成してURLを貼るだけで決済が動きます。
  //    Stripeダッシュボード → 商品 → 支払いリンクを作成（数量変更を許可にチェック）
  //    未設定（空文字）の場合は、問い合わせメールでの仮予約に自動フォールバックします。
  paymentLinks: {
    "ebike_3h": "",   // 例: "https://buy.stripe.com/xxxx"
    "ebike_1d": "",
    "ebike_2d": "",
    "cruiser_3h": "",
    "cruiser_1d": "",
    "cruiser_2d": "",
    "city_3h": "",
    "city_1d": "",
    "city_2d": ""
  },

  // 予約メールのフォールバック先
  contactEmail: "info@octobicycle.com"
};

/* =========================================================
   ▼▼ ここから追加設定（TRB型の機能。すべてこのファイルで編集できます） ▼▼
========================================================= */

// ---- 機能スイッチ：true/false で表示を切り替え ----
OCTO_CONFIG.features = {
  promoBanner: true,      // 予約チケット内の「公式サイト特典」帯
  delivery: false,        // ホテル/宿への配達セクション（運用を始めたら true に）
  trustBar: true,         // レビュー・SNSへの導線バー
  stickyCta: true         // スマホ下部の固定「予約」ボタン
};

// ---- 公式サイト特典の文言（4言語） ----
OCTO_CONFIG.promo = {
  ja: "公式サイト予約がいちばんお得（ベストレート）",
  en: "Best rate guaranteed — book direct on our site",
  ko: "공식 사이트 예약이 가장 저렴합니다 (베스트 레이트)",
  zh: "官网直订享最优价格（最佳价格保证）"
};

// ---- クチコミ・SNSへのリンク（空文字 "" にするとボタンが消えます） ----
OCTO_CONFIG.links = {
  googleReview: "https://www.google.com/maps/search/?api=1&query=OCTO+BICYCLE+%E4%B8%96%E7%94%B0%E8%B0%B7",
  tripadvisor: "",                                        // 掲載されたらURLを貼る
  instagram: "https://www.instagram.com/octobicycle/",
  whatsapp: "",   // 例: "https://wa.me/817032276440"（欧米圏のお客様向け・推奨）
  line: ""        // 例: "https://line.me/R/ti/p/@xxxx"
};

// ---- おすすめライドプラン（TRBのツアーカード型。自走モデルコース） ----
// recommend: 予約ウィジェットに自動セットされる車種ID / duration
OCTO_CONFIG.plans = [
  {
    id: "gotokuji",
    img: "images/area2.jpg",
    recommend: { bike: "city", duration: "3h" },
    badge: { ja: "一番人気", en: "MOST POPULAR", ko: "가장 인기", zh: "最受欢迎" },
    name: { ja: "豪徳寺・招き猫ループ", en: "Gotokuji Lucky-Cat Loop", ko: "고토쿠지 마네키네코 루프", zh: "豪德寺招财猫环线" },
    desc: {
      ja: "招き猫発祥の豪徳寺、松陰神社、ボロ市通りをめぐる下町ループ。写真好きに最適。",
      en: "Ride to Gotokuji — the birthplace of the lucky cat — plus Shoin Shrine and Boro-ichi Street. A photographer's dream.",
      ko: "마네키네코의 발상지 고토쿠지, 쇼인 신사, 보로이치 거리를 도는 로컬 루프. 사진 찍기 좋아요.",
      zh: "骑行前往招财猫发源地豪德寺，途经松阴神社与跳蚤市场街。拍照绝佳。"
    },
    chips: {
      ja: ["⏱ 約3時間", "📍 8km", "📸 写真スポット多数"],
      en: ["⏱ ~3 hours", "📍 8 km", "📸 Photo spots"],
      ko: ["⏱ 약 3시간", "📍 8km", "📸 포토 스팟"],
      zh: ["⏱ 约3小时", "📍 8公里", "📸 拍照胜地"]
    }
  },
  {
    id: "tamariver",
    img: "images/area1.jpg",
    recommend: { bike: "ebike", duration: "1d" },
    badge: null,
    name: { ja: "多摩川リバーサイド1日ライド", en: "Tama River Full-Day Ride", ko: "다마가와 리버사이드 1일 라이드", zh: "多摩川河畔一日骑行" },
    desc: {
      ja: "信号の少ない河川敷サイクリングロードを二子玉川方面へ。eバイクなら往復もラクラク。",
      en: "Cruise the car-free riverside cycling road toward Futako-Tamagawa. Effortless on an e-bike.",
      ko: "신호가 적은 강변 자전거도로를 따라 후타코타마가와 방면으로. 전기자전거라면 왕복도 편하게.",
      zh: "沿几乎无红绿灯的河畔骑行道前往二子玉川方向，骑电动车轻松往返。"
    },
    chips: {
      ja: ["⏱ 半日〜1日", "📍 20–30km", "⚡ eバイク推奨"],
      en: ["⏱ Half–full day", "📍 20–30 km", "⚡ E-bike recommended"],
      ko: ["⏱ 반나절~1일", "📍 20–30km", "⚡ 전기자전거 추천"],
      zh: ["⏱ 半天至一天", "📍 20–30公里", "⚡ 推荐电动车"]
    }
  },
  {
    id: "komazawa",
    img: "images/area3.jpg",
    recommend: { bike: "cruiser", duration: "2d" },
    badge: null,
    name: { ja: "駒沢パーク＆サンセットクルーズ", en: "Komazawa Park & Sunset Cruise", ko: "고마자와 공원 & 선셋 크루즈", zh: "驹泽公园与日落巡航" },
    desc: {
      ja: "1964年五輪の駒沢公園から二子玉川の夕景へ。1泊2日プランなら夜の街乗りも楽しめます。",
      en: "From 1964-Olympic Komazawa Park to Futako-Tamagawa at sunset. The 2-day plan lets you keep riding after dark.",
      ko: "1964년 올림픽의 고마자와 공원에서 후타코타마가와의 석양까지. 1박 2일 플랜이면 야간 라이딩도 OK.",
      zh: "从1964年奥运会场驹泽公园骑到二子玉川看日落。选择两天一夜方案，夜骑也没问题。"
    },
    chips: {
      ja: ["🌇 夕方〜", "📍 12km", "🚲 クルーザーで映える"],
      en: ["🌇 Golden hour", "📍 12 km", "🚲 Cruiser-perfect"],
      ko: ["🌇 해질녘", "📍 12km", "🚲 크루저 감성"],
      zh: ["🌇 黄昏时分", "📍 12公里", "🚲 巡航车出片"]
    }
  }
];

// ---- お客様の声（実際のレビューが集まったらここに追加。空 [] の間はセクション非表示） ----
// 例:
// OCTO_CONFIG.reviews = [
//   { name: "Sarah", flag: "🇦🇺", source: "Google",
//     text: { ja: "最高の体験でした！", en: "Best way to see Tokyo!", ko: "최고의 경험!", zh: "太棒了！" } }
// ];
// sample: true のレビューには「サンプル」バッジが付きます。
// 実際のレビューが集まったら sample 行を消して text を差し替えてください。
OCTO_CONFIG.reviews = [
  { name: "Sarah M.", flag: "🇦🇺", source: "Google", sample: true,
    text: {
      ja: "eバイクで多摩川へ。電車では絶対に見られない東京でした。スタッフの英語も完璧！",
      en: "Rode the e-bike out to the Tama River — a side of Tokyo you'll never see from a train. Staff's English was perfect!",
      ko: "전기자전거로 다마가와까지. 전철로는 절대 볼 수 없는 도쿄였어요. 직원분 영어도 완벽!",
      zh: "骑电动车去了多摩川，看到了坐电车绝对看不到的东京。店员英语也很棒！" } },
  { name: "김지현", flag: "🇰🇷", source: "Instagram", sample: true,
    text: {
      ja: "招き猫のお寺までクルーザーで。写真が最高に映えました。",
      en: "Cruised to the lucky-cat temple — the photos came out amazing.",
      ko: "크루저 타고 마네키네코 절까지. 인생샷 건졌습니다.",
      zh: "骑巡航车去了招财猫寺，照片拍得太好看了。" } },
  { name: "Wang L.", flag: "🇹🇼", source: "Google", sample: true,
    text: {
      ja: "予約から支払いまで1分。当日は乗るだけでした。ヘルメット無料も嬉しい。",
      en: "Booking and payment took one minute. Just showed up and rode. Free helmet was a nice touch.",
      ko: "예약부터 결제까지 1분. 당일엔 타기만 하면 됐어요. 헬멧 무료도 좋았습니다.",
      zh: "预约到付款只花了1分钟，当天到店就能骑。免费头盔也很贴心。" } }
];

/* =========================================================
   ▼▼ 在庫・空き状況管理（このサイトだけで自社運用するための設定） ▼▼
========================================================= */

// ---- 保有台数（車種ごと）。増車・減車したらここを変更 ----
OCTO_CONFIG.inventory = { ebike: 4, cruiser: 3, city: 5 };

// ---- 定休日（0=日,1=月,2=火...6=土）。火曜定休 ----
OCTO_CONFIG.closedDays = [2];

// ---- 手動ブロック日（満車・臨時休業・イベント貸切など）。"YYYY-MM-DD" 形式 ----
// 例: OCTO_CONFIG.blackoutDates = ["2026-09-15", "2026-09-16"];
OCTO_CONFIG.blackoutDates = [];

// ---- 空き状況API（Google Apps Script のURL）----
// gas/booking-api.gs を設置してURLを貼ると「リアルタイム残数表示＋予約自動記録」が有効になります。
// 空文字 "" の間は、上の inventory と blackoutDates だけで動く簡易モードです。
OCTO_CONFIG.availabilityApi = "";

/* =========================================================
   ▼▼ ジャーナル（ブログ）記事一覧 ▼▼
   記事を追加したら blog/ にHTMLを置き、ここに1件追加 → sitemap.xml にもURLを追加
========================================================= */
OCTO_CONFIG.posts = [
  {
    url: "blog/gotokuji-lucky-cat.html",
    img: "images/area2.jpg",
    date: "2026-08-29",
    title: {
      ja: "豪徳寺：招き猫のお寺へ自転車で行こう",
      en: "Gotokuji: Visit the Lucky Cat Temple by Bike",
      ko: "고토쿠지: 자전거로 가는 마네키네코의 절",
      zh: "豪德寺：骑自行车去招财猫的发源地"
    },
    excerpt: {
      ja: "1,000体の招き猫が並ぶ世田谷の隠れた名所へ、店から自転車で15分。",
      en: "1,000 beckoning cats, 15 minutes from our shop by bicycle. Tokyo's best-kept secret.",
      ko: "1,000개의 마네키네코가 있는 세타가야의 숨은 명소. 매장에서 자전거로 15분.",
      zh: "1,000只招财猫的世田谷隐藏名所，从本店骑车仅15分钟。"
    }
  }
];
