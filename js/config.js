/* =========================================================
   ★ お店側で編集するのはこのファイルだけでOK ★
   料金・車種・事業内容・連絡先・リンクをここで一元管理します。
========================================================= */
const OCTO_CONFIG = {

  /* ---- 連絡先 ----
     customerEmail : お客様向け（サイト上に表示・予約メールの宛先）
     adminEmail    : 予約スプレッドシート管理用（サイトには表示されません。
                     gas/booking-api.gs の通知先に使用） */
  customerEmail: "octobicycle@gmail.com",

  /* 予約台帳API（Google Apps Script）のウェブアプリURL。
     gas/booking-api.gs をスプレッドシートに設置してデプロイし、
     発行されたURLをここに貼ると、予約リクエストが自動でシートに記録されます。
     空欄("")の間は従来どおりメール作成にフォールバックします。 */
  bookingApiUrl: "https://script.google.com/macros/s/AKfycbwt8r4zikJc1yHHudhUj2Lt1uCxEzw_nh5SEF7Lbo3GKvkyXEETrZMe1tixvnf48xBG0g/exec",

  adminEmail: "octobicycle@gmail.com",
  phone: "+81-70-3227-6440",

  /* ---- 拠点（貸出・返却場所）---- */
  location: {
    /* 掲載するのは羽根木の拠点住所のみ。
       旧サイトの「世田谷2-28-21」（〒154-0017）は掲載しないこと。 */
    address: {
      ja: "〒156-0042 東京都世田谷区羽根木一丁目29-13",
      en: "1-29-13 Haneki, Setagaya-ku, Tokyo 156-0042",
      ko: "〒156-0042 도쿄도 세타가야구 하네기 1-29-13",
      zh: "〒156-0042 东京都世田谷区羽根木一丁目29-13"
    },
    mapQuery: "東京都世田谷区羽根木1-29-13",
    closedDays: { ja: "定休日なし", en: "Open every day", ko: "연중무휴", zh: "全年无休" },
    note: {
      ja: "貸出・返却は羽根木の拠点にて。時間はご予約時に調整します。",
      en: "Pick-up & return at our Haneki base. Times arranged when you book.",
      ko: "대여·반납은 하네기 거점에서. 시간은 예약 시 조정합니다.",
      zh: "取车·还车地点为羽根木据点。具体时间在预约时协商。"
    }
  },

  /* ---- レンタル車種（クロスバイク / マウンテンバイクのみ・共通料金）---- */
  bikes: [
    {
      id: "cross",
      img: "images/bike-cross.jpg",
      name: { ja: "クロスバイク", en: "Cross Bike (Hybrid)", ko: "크로스 바이크", zh: "混合动力自行车" },
      tag:  { ja: "街乗り・観光の定番", en: "Best for city & sightseeing", ko: "시내·관광의 정석", zh: "市区观光首选" },
      desc: {
        ja: "軽快で扱いやすく、世田谷の街から多摩川サイクリングロードまで幅広く活躍。初めての方にもおすすめです。",
        en: "Light and easy to handle — great for Setagaya streets and the Tama River cycling road alike.",
        ko: "가볍고 다루기 쉬워 세타가야 시내부터 다마가와 자전거도로까지 폭넓게 활약합니다.",
        zh: "轻快易操控，从世田谷街区到多摩川自行车道都能胜任，新手也能轻松驾驭。"
      }
    },
    {
      id: "mtb",
      img: "images/bike-mtb.jpg",
      bookable: false,   // 導入したら true にして、GASのINVENTORY.mtbにも台数を入れる
      name: { ja: "マウンテンバイク", en: "Mountain Bike", ko: "마운틴 바이크", zh: "山地自行车" },
      tag:  { ja: "近日導入予定", en: "Coming soon", ko: "곧 도입 예정", zh: "即将推出" },
      desc: {
        ja: "太めのタイヤとサスペンションで段差や砂利道も安心。長距離やアクティブなライドに。",
        en: "Wide tires and front suspension soak up curbs and gravel — built for longer, active rides.",
        ko: "두꺼운 타이어와 서스펜션으로 턱이나 자갈길도 안심. 장거리 라이딩에 적합합니다.",
        zh: "宽胎与前避震轻松应对台阶与碎石路，适合长距离和活力骑行。"
      }
    }
  ],

  /* ---- 料金（円・税込・クロス/MTB共通）----
     day1     : 1日目
     dayExtra : 2日目以降 1日あたり
     week     : 1週間
     month    : 1ヶ月 */
  pricing: { day1: 3500, dayExtra: 2500, week: 11000, month: 22000 },

  /* ---- Stripe 支払いリンク（任意）----
     固定料金プランのみ対応。作成したらURLを貼るだけで決済ボタンが有効になります。
     未設定（""）の場合はメールでの予約リクエストに自動フォールバック。 */
  paymentLinks: {
    day1:  "https://buy.stripe.com/28EeVc68x3CJ0A2aP96sw00",   // 1日プラン ¥3,500
    week:  "https://buy.stripe.com/28E9ASgNbehn0A29L56sw01",   // 1週間プラン ¥11,000
    month: ""    // 1ヶ月プラン ¥22,000
  },

  /* 配達込みプランのStripeリンク（プラン × 配達料金帯）
     Stripeで「プラン料金＋配達料」を合算した固定金額のPayment Linkを作成して貼ると、
     そのエリアの即時決済が有効になります。未設定（""）のエリアは自動的に
     メールでの予約リクエストにフォールバックします。
     例: day1の"1500" → ¥3,500+¥1,500=¥5,000 のリンク */
  paymentLinksWithDelivery: {
    day1:  { "1500": "", "2000": "", "2500": "", "3000": "", "3500": "", "4000": "" },
    week:  { "1500": "", "2000": "", "2500": "", "3000": "", "3500": "", "4000": "" },
    month: { "1500": "", "2000": "", "2500": "", "3000": "", "3500": "", "4000": "" }
  },

  /* ---- 配達（ホテル・指定場所への持込/引取）---- */
  delivery: {
    enabled: true,
    /* エリア別配達料金（東京23区・1予約あたり・円）
       区の追加や料金変更はこの表を編集するだけでOK。 */
    areas: [
      { fee: 1500, wards: [["世田谷区","Setagaya"]] },
      { fee: 2000, wards: [["目黒区","Meguro"],["渋谷区","Shibuya"],["杉並区","Suginami"],["中野区","Nakano"]] },
      { fee: 2500, wards: [["新宿区","Shinjuku"],["品川区","Shinagawa"],["大田区","Ota"]] },
      { fee: 3000, wards: [["港区","Minato"],["練馬区","Nerima"],["板橋区","Itabashi"],["豊島区","Toshima"]] },
      { fee: 3500, wards: [["千代田区","Chiyoda"],["中央区","Chuo"],["文京区","Bunkyo"]] },
      { fee: 4000, wards: [["江東区","Koto"],["墨田区","Sumida"],["台東区","Taito"],["荒川区","Arakawa"],["北区","Kita"],["足立区","Adachi"],["葛飾区","Katsushika"],["江戸川区","Edogawa"]] }
    ],
    note: {
      ja: "東京23区内のホテル・ご指定場所へのお届け／引き取りに対応（1予約あたり・下記料金）。",
      en: "Delivery & pick-up to hotels and locations across Tokyo's 23 wards (per booking, fees below).",
      ko: "도쿄 23구 내 호텔·지정 장소로의 배송/회수에 대응합니다(1예약당·아래 요금).",
      zh: "支持配送/回收至东京23区内的酒店或指定地点（每次预约·费用如下）。"
    }
  },

  /* ---- SNS・クチコミ ---- */
  links: {
    instagram: "https://www.instagram.com/octo_bicycle?igsi=a2VmczhqdnlnZTA4&utm_source=qr",
    googleReview: "https://www.google.com/search?kgmid=%2Fg%2F11vxm9050g&q=OCTO+BICYCLE",  // プロフィール直リンク,
    tripadvisor: "",
    whatsapp: "",
    line: "https://lin.ee/nXJCkVd"
  },

  /* ---- 機能スイッチ ---- */
  features: {
    trustBar: true,
    stickyCta: true
  },

  /* ---- 事業内容（一覧カード）----
     ja本文はご指定の文言そのまま。順序の入れ替え・追加はこの配列を編集。 */
  services: [
    {
      id: "sale", icon: "cart", photo: "images/specialimg03.jpg", latin: "SALES",
      name: { ja: "自転車販売", en: "Bicycle Sales", ko: "자전거 판매", zh: "自行车销售" },
      desc: {
        ja: "ロードバイクからクロスバイク、一般車、電動アシスト自転車まで、お客様の用途やライフスタイルに合わせた自転車をご提案します。初めての方からスポーツバイクを楽しむ方まで、購入前のご相談から車体選びまで丁寧にサポートします。",
        en: "From road bikes and hybrids to city bikes and e-assist bicycles, we propose the right bike for your needs and lifestyle — with careful support from pre-purchase consultation to choosing the frame, for beginners and sport riders alike.",
        ko: "로드바이크부터 크로스바이크, 일반 자전거, 전동 어시스트 자전거까지, 용도와 라이프스타일에 맞는 자전거를 제안합니다. 구매 전 상담부터 차체 선택까지 정성껏 지원합니다.",
        zh: "从公路车、混合动力车到普通自行车、电动助力车，根据您的用途与生活方式推荐合适的车型。从购前咨询到选车，全程细致支持。"
      }
    },
    {
      id: "rental", icon: "bike", photo: "images/bike-cross.jpg", latin: "RENTAL",
      links: [{ url: "#booking",
                label: { ja: "料金を見て予約する", en: "See pricing & book", ko: "요금 확인·예약", zh: "查看价格并预约" } }],
      name: { ja: "自転車レンタル", en: "Bicycle Rental", ko: "자전거 렌털", zh: "自行车租赁" },
      desc: {
        ja: "観光や日常の移動、短期間の利用など、さまざまな用途に合わせた自転車のレンタルサービスを提供しています。個人のお客様はもちろん、宿泊施設や法人・施設向けのレンタルにも対応します。",
        en: "Bicycle rental for sightseeing, daily transport and short-term use. We serve individual customers as well as hotels, businesses and facilities.",
        ko: "관광, 일상 이동, 단기 이용 등 다양한 용도에 맞는 자전거 렌털 서비스를 제공합니다. 개인 고객은 물론 숙박시설·법인·시설 대상 렌털에도 대응합니다.",
        zh: "提供适合观光、日常出行、短期使用等多种用途的自行车租赁服务。除个人客户外，也面向住宿设施、法人及机构提供租赁。"
      }
    },
    {
      id: "mobile-repair", icon: "wrench", photo: "images/specialimg02.jpg", latin: "ON-SITE REPAIR",
      links: [{ url: "services/shutcho-shuri.html",
                label: { ja: "出張修理の詳細を見る", en: "On-site repair details", ko: "출장 수리 자세히", zh: "上门维修详情" } }],
      name: { ja: "出張修理・出張メンテナンス", en: "On-site Repair & Maintenance", ko: "출장 수리·정비", zh: "上门修理·保养" },
      desc: {
        ja: "ご自宅や職場など、ご希望の場所へお伺いして自転車の修理・メンテナンスを行います。パンクやタイヤ交換、ブレーキ・変速調整など、日常的なトラブルにも対応しています。",
        en: "We come to your home or workplace to repair and service your bicycle — flat tires, tire replacement, brake and gear adjustment, and other everyday troubles.",
        ko: "자택이나 직장 등 원하시는 장소로 찾아가 자전거 수리·정비를 실시합니다. 펑크, 타이어 교체, 브레이크·변속 조정 등 일상적인 트러블에 대응합니다.",
        zh: "上门前往您的住所或工作地点进行自行车修理与保养。爆胎、换胎、刹车与变速调整等日常故障均可处理。"
      }
    },
    {
      id: "maintenance", icon: "gear", photo: "images/specialimg05.jpg", latin: "MAINTENANCE",
      name: { ja: "自転車メンテナンス・点検", en: "Maintenance & Inspection", ko: "자전거 정비·점검", zh: "自行车保养·检修" },
      desc: {
        ja: "日常点検から定期メンテナンス、スポーツバイクのオーバーホールまで、自転車を安全・快適に長く乗るためのメンテナンスを行っています。",
        en: "From routine checks and periodic maintenance to full sport-bike overhauls — keeping your bicycle safe, comfortable and running for years.",
        ko: "일상 점검부터 정기 정비, 스포츠 바이크 오버홀까지, 자전거를 안전하고 쾌적하게 오래 탈 수 있도록 정비합니다.",
        zh: "从日常检查、定期保养到运动自行车的大修，让您的自行车安全舒适、经久耐用。"
      }
    },
    {
      id: "used", icon: "recycle", photo: "images/specialimg00.jpg", latin: "USED & CONSIGN",
      name: { ja: "中古自転車・委託販売", en: "Used Bikes & Consignment", ko: "중고 자전거·위탁 판매", zh: "二手自行车·委托销售" },
      desc: {
        ja: "不要になった自転車や買い替えを検討している自転車の委託販売にも対応。状態を確認し、次に必要とする方へつなげます。",
        en: "We also handle consignment sales of bicycles you no longer need or plan to replace — checking their condition and passing them on to the next rider.",
        ko: "필요 없어진 자전거나 교체를 검토 중인 자전거의 위탁 판매에도 대응합니다. 상태를 확인해 다음 필요한 분께 연결합니다.",
        zh: "也受理闲置自行车或计划换购车辆的委托销售。确认车况后，将它交到下一位需要的人手中。"
      }
    },
    {
      id: "buyback", icon: "truck", photo: "images/specialimg07.jpg", latin: "BUY-BACK & PICK-UP",
      links: [{ url: "services/kaitori.html",
                label: { ja: "出張買取の詳細を見る", en: "Buy-back details", ko: "출장 매입 자세히", zh: "上门收购详情" } },
              { url: "services/haisha-kaishu.html",
                label: { ja: "廃車回収の詳細を見る", en: "Disposal pick-up details", ko: "폐자전거 회수 자세히", zh: "废车回收详情" } }],
      name: { ja: "出張買取・廃車回収", en: "Buy-back & Disposal Pick-up", ko: "출장 매입·폐자전거 회수", zh: "上门收购·废车回收" },
      desc: {
        ja: "ご自宅までお伺いし、不要になった自転車の買取・引き取りを行います。乗らなくなった廃自転車の回収もご相談ください。",
        en: "We visit your home to buy back or collect bicycles you no longer use. Ask us about disposal pick-up for bikes past riding condition.",
        ko: "자택까지 방문해 필요 없어진 자전거의 매입·수거를 실시합니다. 타지 않게 된 폐자전거 회수도 상담해 주세요.",
        zh: "上门收购或回收您不再使用的自行车。报废自行车的回收也欢迎咨询。"
      }
    },
    {
      id: "b2b", icon: "building", photo: "images/specialimg01.jpg", latin: "FOR BUSINESS",
      name: { ja: "法人・施設向け自転車サービス", en: "Services for Businesses & Facilities", ko: "법인·시설 대상 자전거 서비스", zh: "面向法人·设施的自行车服务" },
      desc: {
        ja: "民泊施設、ホテル、マンション、企業などを対象に、自転車の導入からレンタル、定期メンテナンス、管理までトータルでサポートします。複数台の導入や継続的なメンテナンスについてもご相談いただけます。",
        en: "For guesthouses, hotels, apartment buildings and companies: total support from bike introduction and rental to periodic maintenance and fleet management, including multi-unit deployments.",
        ko: "민박시설, 호텔, 맨션, 기업 등을 대상으로 자전거 도입부터 렌털, 정기 정비, 관리까지 토털 지원합니다. 여러 대 도입이나 지속적인 정비도 상담 가능합니다.",
        zh: "面向民宿、酒店、公寓、企业等，提供从自行车引进、租赁到定期保养与管理的一站式支持。多辆引进及持续保养亦可咨询。"
      }
    },
    {
      id: "consult", icon: "chat", photo: "images/specialimg06.jpg", latin: "CONSULTATION",
      name: { ja: "自転車に関する各種ご相談", en: "Any Bicycle Questions", ko: "자전거 관련 각종 상담", zh: "自行车相关咨询" },
      desc: {
        ja: "「どんな自転車を選べばいい？」「修理した方がいい？買い替えた方がいい？」など、自転車に関するさまざまな疑問やご相談にも対応しています。",
        en: "\u201CWhich bike should I choose?\u201D \u201CShould I repair it or replace it?\u201D — we're happy to help with any bicycle question.",
        ko: "\u201C어떤 자전거를 고르면 좋을까?\u201D \u201C수리할까, 새로 살까?\u201D 등 자전거에 관한 다양한 궁금증과 상담에 대응합니다.",
        zh: "\u201C该选什么样的自行车？\u201D\u201C是修理好还是换新好？\u201D等各种自行车相关疑问，欢迎随时咨询。"
      }
    }
  ],

  /* ---- 事業内容のしめの一文 ---- */
  servicesClosing: {
    ja: "自転車を「買う・借りる・直す・整える・長く使う」まで。地域の皆さまの快適な自転車ライフをサポートします。",
    en: "Buy it, rent it, fix it, tune it, keep it running — we support every part of your bicycle life.",
    ko: "자전거를 \u2018사고, 빌리고, 고치고, 정비하고, 오래 타는\u2019 것까지. 지역 여러분의 쾌적한 자전거 라이프를 지원합니다.",
    zh: "从\u201C购买、租赁、修理、保养\u201D到\u201C长久使用\u201D——我们支持社区每一位的舒适自行车生活。"
  },

  /* ---- FAQ ---- */
  faq: [
    {
      q: { ja: "予約は必要ですか？", en: "Do I need to book in advance?", ko: "예약이 필요한가요?", zh: "需要预约吗？" },
      a: { ja: "台数に限りがあるため、事前のご予約をおすすめします。サイト上部の予約フォームまたはメールからどうぞ。",
           en: "Yes, we recommend booking ahead as bikes are limited. Use the booking form at the top of this page or email us.",
           ko: "대수가 한정되어 있어 사전 예약을 권장합니다. 페이지 상단의 예약 폼 또는 메일로 부탁드립니다.",
           zh: "车辆数量有限，建议提前预约。请使用页面顶部的预约表单或发送邮件。" }
    },
    {
      q: { ja: "貸出・返却はどこで行いますか？", en: "Where do I pick up and return the bike?", ko: "대여·반납은 어디서 하나요?", zh: "在哪里取车和还车？" },
      a: { ja: "〒156-0042 世田谷区羽根木1-29-13です。ホテルやご指定場所へのお届け・引き取りも別途料金で承ります。",
           en: "At 1-29-13 Haneki, Setagaya-ku. Hotel / custom-location delivery and pick-up is available for an extra fee.",
           ko: "세타가야구 하네기 1-29-13입니다. 호텔·지정 장소 배송/회수는 별도 요금으로 가능합니다.",
           zh: "位于世田谷区羽根木1-29-13。酒店或指定地点的配送/回收可另行付费办理。" }
    },
    {
      q: { ja: "支払い方法は？", en: "How can I pay?", ko: "결제 방법은?", zh: "如何付款？" },
      a: { ja: "オンライン決済（クレジットカード等）と現地でのお支払いに対応しています。詳細はご予約時にご案内します。",
           en: "Online card payment and on-site payment are both available. Details are provided when you book.",
           ko: "온라인 결제(신용카드 등)와 현장 결제 모두 가능합니다. 자세한 내용은 예약 시 안내드립니다.",
           zh: "支持在线支付（信用卡等）与现场支付。详情将在预约时告知。" }
    },
    {
      q: { ja: "ヘルメットや鍵は付きますか？", en: "Are helmets and locks included?", ko: "헬멧과 자물쇠가 포함되나요?", zh: "含头盔和车锁吗？" },
      a: { ja: "鍵は全車に付属します。ヘルメットの貸出をご希望の場合はご予約時にお知らせください。",
           en: "A lock comes with every bike. If you'd like a helmet, just let us know when booking.",
           ko: "자물쇠는 전 차량에 포함됩니다. 헬멧 대여를 원하시면 예약 시 알려주세요.",
           zh: "所有车辆均配车锁。如需头盔，请在预约时告知。" }
    },
    {
      q: { ja: "定休日はありますか？", en: "Are you closed on certain days?", ko: "정기 휴무일이 있나요?", zh: "有固定休息日吗？" },
      a: { ja: "定休日はありません。貸出・返却の時間はご予約時に調整します。",
           en: "No — we're open every day. Pick-up and return times are arranged when you book.",
           ko: "정기 휴무일은 없습니다. 대여·반납 시간은 예약 시 조정합니다.",
           zh: "全年无休。取车与还车时间在预约时协商确定。" }
    }
  ]
};
