/* =========================================================
   OCTO BICYCLE — 予約台帳API v2（在庫管理つき）
   予約受付＋空き状況チェック＋台帳記録＋通知＋多言語自動返信

   ◆在庫の変更はここ（台数を書き換えるだけ）
========================================================= */
const INVENTORY = {
  cross: 2,   // クロスバイクの保有台数
  mtb:   0    // マウンテンバイク（導入したら台数を入れる。サイト側config.jsのbookableもtrueに）
};

/* script.google.com で直接プロジェクトを作る場合はシートIDを貼る。
   シートの「拡張機能→Apps Script」から開いた場合は空欄のままでOK。 */
const SHEET_ID = "";

const SHEET_NAME   = "予約台帳";
const SALES_SHEET_NAME = "販売車両";   // 中古販売の掲載管理タブ
const NOTIFY_EMAIL = "octobicycle@gmail.com";   // 管理者通知先（台帳アカウント）
const REPLY_FROM_NAME = "OCTO BICYCLE";

/* 予約が「在庫を使用中」とみなされる状態。
   キャンセル・返却済みの行は空き計算から自動で除外されます。 */
const ACTIVE_STATUSES = ["新規", "確認済み", "決済済み", "貸出中"];

/* ---------- 初回セットアップ（1回だけ実行） ----------
   ※旧版の「予約台帳」タブがある場合は、先にタブを削除してから実行 */
function setup() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(["予約ID", "受付日時", "開始日", "終了日", "車種", "車種ID",
                  "プラン", "台数", "配達", "お届けエリア", "配達料", "合計金額",
                  "お名前", "連絡先", "言語", "状態", "メモ"]);
    sh.setFrozenRows(1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["新規", "確認済み", "決済済み", "貸出中", "返却済み", "キャンセル"], true)
      .build();
    sh.getRange("P2:P2000").setDataValidation(rule);
    sh.autoResizeColumns(1, 17);
  }

  // ---- 販売車両タブ（中古販売の掲載管理） ----
  let sv = ss.getSheetByName(SALES_SHEET_NAME);
  if (!sv) sv = ss.insertSheet(SALES_SHEET_NAME);
  if (sv.getLastRow() === 0) {
    sv.appendRow(["掲載ID", "車種名", "カテゴリ", "サイズ", "年式", "状態", "価格",
                  "写真URL1", "写真URL2", "写真URL3", "説明", "説明(English)", "ステータス", "メモ(非公開)", "決済リンク(Stripe)"]);
    sv.setFrozenRows(1);
    const srule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["販売中", "商談中", "売約済", "非公開"], true)
      .build();
    sv.getRange("M2:M2000").setDataValidation(srule);
    sv.appendRow(["U001", "（記入例）TREK FX 3 クロスバイク", "クロスバイク", "M（170-180cm）", "2022年式",
                  "整備済・良好", "58000",
                  "https://drive.google.com/file/d/ここに写真のファイルIDが入ったURL/view", "", "",
                  "前後タイヤ新品交換済み。ワイヤー類調整済み。", "Both tires replaced, cables tuned.",
                  "非公開", "記入例です。ステータスを「販売中」にするとサイトに表示されます", ""]);
    sv.autoResizeColumns(1, 15);
  }
}

/* ---------- 空き台数の計算 ----------
   期間 [start, end]（両端含む）に重なるアクティブ予約の台数を差し引く */
function availability_(bikeId, startStr, endStr) {
  const total = INVENTORY[bikeId];
  if (total === undefined) return { ok: false, error: "unknown bike: " + bikeId };
  const s = new Date(startStr), e = new Date(endStr);
  if (isNaN(s) || isNaN(e)) return { ok: false, error: "bad date" };

  const sh = sheet_();
  const rows = sh.getLastRow() > 1
    ? sh.getRange(2, 1, sh.getLastRow() - 1, 17).getValues()
    : [];
  let booked = 0;
  rows.forEach((r) => {
    const rStart = new Date(r[2]), rEnd = new Date(r[3]);
    // 手動入力行にも対応：車種IDが空なら「車種」の文字から推定
    let rBikeId = String(r[5] || "").trim();
    if (!rBikeId) {
      const label = String(r[4] || "");
      if (label.indexOf("クロス") !== -1 || /cross/i.test(label)) rBikeId = "cross";
      else if (label.indexOf("マウンテン") !== -1 || /mtb|mountain/i.test(label)) rBikeId = "mtb";
    }
    const rQty = Number(r[7]) || 1;
    // 手動入力で状態が空欄の行は「新規」扱い（在庫を消費する）
    const rStatus = String(r[15] || "").trim() || "新規";
    if (rBikeId !== bikeId) return;
    if (ACTIVE_STATUSES.indexOf(rStatus) === -1) return;
    if (isNaN(rStart.getTime()) || isNaN(rEnd.getTime())) return;
    if (rStart <= e && rEnd >= s) booked += rQty;   // 期間が重なる
  });
  return { ok: true, total: total, booked: booked, available: Math.max(0, total - booked) };
}

/* ---------- GET: 動作確認 ＆ 空き状況API ----------
   例: ...?action=avail&bike=cross&start=2026-09-10&end=2026-09-12 */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === "avail") {
    const a = availability_(p.bike, p.start, p.end);
    return json_(a);
  }
  if (p.action === "bikes") {
    const cache = CacheService.getScriptCache();
    const hit = cache.get("bikes_v1");
    if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
    const sh = ss_().getSheetByName(SALES_SHEET_NAME);
    const bikes = [];
    if (sh && sh.getLastRow() > 1) {
      const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 15).getValues();
      rows.forEach(function (r) {
        const status = String(r[12] || "").trim();
        if (!r[1] || status === "非公開") return;
        bikes.push({
          id: String(r[0] || ""), name: String(r[1] || ""), cat: String(r[2] || ""),
          size: String(r[3] || ""), year: String(r[4] || ""), cond: String(r[5] || ""),
          price: Number(r[6]) || 0,
          photos: [r[7], r[8], r[9]].map(function (v) { return String(v || "").trim(); })
                    .filter(function (v) { return v && v.indexOf("ここに写真") === -1; }),
          desc: String(r[10] || ""), descEn: String(r[11] || ""),
          status: status || "販売中",
          payLink: String(r[14] || "").trim()
        });
      });
    }
    const out = JSON.stringify({ ok: true, bikes: bikes });
    cache.put("bikes_v1", out, 60);   // 60秒キャッシュ（シート変更は最大1分で反映）
    return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
  }
  return json_({ ok: true, service: "octo-booking-api", version: 3 });
}

/* ---------- POST: 予約の記録（空きチェックつき） ---------- */
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const qty = Number(d.qty) || 1;

    // 在庫チェック：空きが足りなければ受け付けない
    const a = availability_(d.bikeId, d.start, d.end);
    if (!a.ok) return json_({ ok: false, error: a.error });
    if (qty > a.available) {
      return json_({ ok: false, code: "full", available: a.available });
    }

    const sh = sheet_();
    const id = "OCTO-" + Utilities.formatDate(new Date(), "Asia/Tokyo", "yyMMdd-HHmmss");
    sh.appendRow([
      id, new Date(), d.start || "", d.end || "", d.bike || "", d.bikeId || "",
      d.plan || "", qty,
      d.delivery ? "あり" : "なし", d.area || "", d.fee || 0, d.total || "",
      d.name || "", d.contact || "", d.lang || "", "新規", ""
    ]);

    MailApp.sendEmail(
      NOTIFY_EMAIL,
      "【新規予約】" + (d.start || "日付未定") + " " + (d.bike || "") + " ×" + qty + "（" + id + "）",
      "サイトから新しい予約リクエストが入りました。\n\n" +
      "予約ID: " + id +
      "\n期間: " + (d.start || "?") + " 〜 " + (d.end || "?") +
      "\n車種: " + (d.bike || "") +
      "\nプラン: " + (d.plan || "") +
      "\n台数: " + qty +
      "\nこの期間の残り台数（この予約を含めず）: " + a.available + "/" + a.total +
      "\n配達: " + (d.delivery ? "あり（" + (d.area || "") + " +¥" + (d.fee || 0) + "）" : "なし") +
      "\n合計: ¥" + (d.total || "") +
      "\nお名前: " + (d.name || "未入力") +
      "\n連絡先: " + (d.contact || "未入力") +
      "\n言語: " + (d.lang || "") + "\n\n" +
      "対応後、台帳の「状態」列を更新してください（キャンセル/返却済みにすると在庫が解放されます）。\n" +
      "台帳: " + ss_().getUrl()
    );

    if (/@/.test(d.contact || "")) {
      const msgs = {
        ja: { sub: "【OCTO BICYCLE】予約リクエストを受け付けました（" + id + "）",
              body: d.name + " 様\n\nご予約リクエストありがとうございます。\n空き状況を確認のうえ、担当者よりご連絡いたします。\n\n受付番号: " + id + "\n期間: " + d.start + " 〜 " + d.end + "\n車種: " + d.bike + "\nプラン: " + d.plan + "\n台数: " + qty + "\n合計目安: ¥" + d.total + "\n\nOCTO BICYCLE\n〒156-0042 東京都世田谷区羽根木1-29-13" },
        en: { sub: "[OCTO BICYCLE] Booking request received (" + id + ")",
              body: "Dear " + d.name + ",\n\nThank you for your booking request. We will confirm and get back to you shortly.\n\nRequest ID: " + id + "\nPeriod: " + d.start + " - " + d.end + "\nBike: " + d.bike + "\nPlan: " + d.plan + "\nQty: " + qty + "\nEstimated total: ¥" + d.total + "\n\nOCTO BICYCLE\n1-29-13 Haneki, Setagaya-ku, Tokyo 156-0042" },
        ko: { sub: "[OCTO BICYCLE] 예약 신청이 접수되었습니다 (" + id + ")",
              body: d.name + " 님\n\n예약 신청 감사합니다. 확인 후 연락드리겠습니다.\n\n접수번호: " + id + "\n기간: " + d.start + " ~ " + d.end + "\n차종: " + d.bike + "\n플랜: " + d.plan + "\n대수: " + qty + "\n예상 합계: ¥" + d.total + "\n\nOCTO BICYCLE" },
        zh: { sub: "[OCTO BICYCLE] 已收到您的预约申请（" + id + "）",
              body: d.name + " 您好\n\n感谢您的预约申请。确认后将尽快与您联系。\n\n受理编号: " + id + "\n期间: " + d.start + " ~ " + d.end + "\n车型: " + d.bike + "\n方案: " + d.plan + "\n台数: " + qty + "\n预计合计: ¥" + d.total + "\n\nOCTO BICYCLE" }
      };
      const msg = msgs[d.lang] || msgs.en;
      MailApp.sendEmail(d.contact, msg.sub, msg.body, { name: REPLY_FROM_NAME });
    }

    return json_({ ok: true, id: id, remaining: a.available - qty });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ---------- ヘルパー ---------- */
function ss_() {
  return SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}
function sheet_() {
  const sh = ss_().getSheetByName(SHEET_NAME);
  if (!sh) throw new Error("先に setup() を実行してください");
  return sh;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
