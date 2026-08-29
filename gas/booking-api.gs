/* =========================================================
   OCTO BICYCLE — 予約・在庫管理API（Google Apps Script）
   Googleスプレッドシートを「予約台帳」として使い、
   サイトに残数表示＋予約の自動記録を追加します。

   ◆設置手順（約10分・無料）は 設置手順書.md の
   「在庫・空き状況管理のはじめかた」を参照してください。
========================================================= */

// ★ サイト側 js/config.js の inventory と同じ数に合わせてください
const INVENTORY = { ebike: 4, cruiser: 3, city: 5 };

// 予約シート名と通知先メール
const SHEET_NAME = "予約台帳";
const NOTIFY_EMAIL = "info@octobicycle.com";

/* ---------- 初回セットアップ：メニューから1回だけ実行 ---------- */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(["予約ID", "受付日時", "利用日", "車種", "時間", "台数",
                  "お名前", "メール", "言語", "金額", "状態", "メモ"]);
    sh.setFrozenRows(1);
    // 状態列（K列）にプルダウン
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["仮予約", "決済済み", "貸出中", "返却済み", "キャンセル"], true)
      .build();
    sh.getRange("K2:K1000").setDataValidation(rule);
  }
}

/* ---------- GET: 空き状況の返却 ----------
   /exec?action=availability&date=YYYY-MM-DD                     */
function doGet(e) {
  const action = (e.parameter && e.parameter.action) || "";
  if (action === "availability") {
    return json_({ ok: true, remaining: remainingFor_(e.parameter.date) });
  }
  return json_({ ok: true, service: "octo-booking-api" });
}

/* ---------- POST: 予約の記録（サイトの予約ボタンから自動送信） ---------- */
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const sh = sheet_();
    const id = "OCTO-" + Utilities.formatDate(new Date(), "Asia/Tokyo", "yyMMdd-HHmmss");
    sh.appendRow([id, new Date(), d.date, d.bike, d.duration, d.qty,
                  d.name || "", d.email || "", d.lang || "", d.total || "", "仮予約", ""]);
    // 店主へ通知メール
    MailApp.sendEmail(
      NOTIFY_EMAIL,
      "【新規予約】" + d.date + " " + d.bike + " ×" + d.qty + "（" + id + "）",
      "サイトから新しい予約が入りました。\n\n" +
      "予約ID: " + id + "\n利用日: " + d.date + "\n車種: " + d.bike +
      "\n時間: " + d.duration + "\n台数: " + d.qty +
      "\nお名前: " + (d.name || "未入力") + "\nメール: " + (d.email || "未入力") +
      "\n金額: ¥" + d.total + "\n\n" +
      "Stripeの決済通知メールと突き合わせて、台帳の状態を「決済済み」に変更してください。\n" +
      "スプレッドシート: " + SpreadsheetApp.getActiveSpreadsheet().getUrl()
    );
    return json_({ ok: true, id: id });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ---------- 残数計算 ----------
   ・「キャンセル」以外の行を予約中としてカウント
   ・1泊2日（2d）は利用日と翌日の2日分の在庫を使用          */
function remainingFor_(dateStr) {
  const used = { ebike: 0, cruiser: 0, city: 0 };
  const rows = sheet_().getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const rDate = toYmd_(r[2]);
    const bike = String(r[3]);
    const dur = String(r[4]);
    const qty = Number(r[5]) || 0;
    const status = String(r[10]);
    if (!rDate || status === "キャンセル" || !(bike in used)) continue;
    const occupies = (rDate === dateStr) ||
                     (dur === "2d" && nextDay_(rDate) === dateStr);
    if (occupies) used[bike] += qty;
  }
  const remaining = {};
  Object.keys(INVENTORY).forEach(function (k) {
    remaining[k] = Math.max(0, INVENTORY[k] - used[k]);
  });
  return remaining;
}

/* ---------- ヘルパー ---------- */
function sheet_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh) throw new Error("先に setup() を実行してください");
  return sh;
}
function toYmd_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, "Asia/Tokyo", "yyyy-MM-dd");
  return String(v || "").slice(0, 10);
}
function nextDay_(ymd) {
  const d = new Date(ymd + "T00:00:00+09:00");
  d.setDate(d.getDate() + 1);
  return Utilities.formatDate(d, "Asia/Tokyo", "yyyy-MM-dd");
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
