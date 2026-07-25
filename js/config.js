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
      desc: { ja: "ARCHONなどプロショップ整備のeバイク。観光の行動範囲が一気に広がります。",
              en: "Pro-maintained e-bikes (ARCHON etc.). Cover 3x the ground with zero sweat.",
              ko: "프로숍이 정비한 전기자전거. 관광 반경이 확 넓어집니다.",
              zh: "专业车店维护的电动自行车，让您的观光范围扩大三倍。" }
    },
    {
      id: "cruiser",
      img: "images/bike-cruiser.jpg",
      price: { "3h": 2000, "1d": 3500, "2d": 6000 },
      name: { ja: "ストレッチクルーザー", en: "Stretch Cruiser", ko: "스트레치 크루저", zh: "拉伸巡航车" },
      tag:  { ja: "写真映え No.1", en: "Best for photos", ko: "인생샷 No.1", zh: "拍照最上镜" },
      desc: { ja: "BRONXなど西海岸スタイルのクルーザー。街を流すだけで絵になります。",
              en: "West-coast style cruisers (BRONX etc.). Just riding one is a photo op.",
              ko: "웨스트코스트 스타일 크루저. 타는 것만으로 그림이 됩니다.",
              zh: "西海岸风格巡航车，骑上它整条街都是你的取景地。" }
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
