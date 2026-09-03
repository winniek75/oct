/* =========================================================
   OCTO BICYCLE — 予約台帳API（Google Apps Script）
   サイトの予約ボタン → このAPIが受信 → スプレッドシートに自動記録
   ＋管理者(8octo.bicycle@gmail.com)へ通知 ＋ お客様へ自動返信

   ◆設置手順（約10分・無料）
   1. 8octo.bicycle@gmail.com でログインし、Googleスプレッドシートを新規作成（例「OCTO予約台帳」）
   2. メニュー「拡張機能」→「Apps Script」を開き、このファイルの中身を全部貼り付けて保存
   3. 上部の関数選択で「setup」を選んで実行（初回のみ・権限を許可）
   4. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
      - 実行ユーザー: 自分
      - アクセスできるユーザー: 全員
      → デプロイして表示された「ウェブアプリURL」をコピー
   5. サイトの js/config.js の bookingApiUrl: "" にそのURLを貼る → アップロード
   これで予約リクエストが自動で台帳に入ります。
========================================================= */

/* ★ 解決法B用：script.google.com で直接プロジェクトを作る場合は、
   台帳にしたいスプレッドシートのURLのうち
   https://docs.google.com/spreadsheets/d/【この部分】/edit
   をコピーして下に貼ってください。
   スプレッドシートの「拡張機能→Apps Script」から開けた場合は空欄のままでOK。 */
const SHEET_ID = "";

const SHEET_NAME   = "予約台帳";
const NOTIFY_EMAIL = "8octo.bicycle@gmail.com";   // 管理者通知先（台帳アカウント）
const REPLY_FROM_NAME = "OCTO BICYCLE";

/* ---------- 初回セットアップ（1回だけ実行） ---------- */
function setup() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(["予約ID", "受付日時", "開始日", "車種", "プラン", "台数",
                  "配達", "お届けエリア", "配達料", "合計金額",
                  "お名前", "連絡先", "言語", "状態", "メモ"]);
    sh.setFrozenRows(1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["新規", "確認済み", "決済済み", "貸出中", "返却済み", "キャンセル"], true)
      .build();
    sh.getRange("N2:N2000").setDataValidation(rule);
    sh.autoResizeColumns(1, 15);
  }
}

/* ---------- GET: 動作確認用 ---------- */
function doGet() {
  return json_({ ok: true, service: "octo-booking-api" });
}

/* ---------- POST: 予約の記録（サイトから自動送信） ---------- */
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const sh = sheet_();
    const id = "OCTO-" + Utilities.formatDate(new Date(), "Asia/Tokyo", "yyMMdd-HHmmss");
    sh.appendRow([
      id, new Date(), d.start || "", d.bike || "", d.plan || "", d.qty || 1,
      d.delivery ? "あり" : "なし", d.area || "", d.fee || 0, d.total || "",
      d.name || "", d.contact || "", d.lang || "", "新規", ""
    ]);

    // 管理者へ通知
    MailApp.sendEmail(
      NOTIFY_EMAIL,
      "【新規予約】" + (d.start || "日付未定") + " " + (d.bike || "") + " ×" + (d.qty || 1) + "（" + id + "）",
      "サイトから新しい予約リクエストが入りました。\n\n" +
      "予約ID: " + id +
      "\n開始日: " + (d.start || "未入力") +
      "\n車種: " + (d.bike || "") +
      "\nプラン: " + (d.plan || "") +
      "\n台数: " + (d.qty || 1) +
      "\n配達: " + (d.delivery ? "あり（" + (d.area || "") + " +¥" + (d.fee || 0) + "）" : "なし") +
      "\n合計: ¥" + (d.total || "") +
      "\nお名前: " + (d.name || "未入力") +
      "\n連絡先: " + (d.contact || "未入力") +
      "\n言語: " + (d.lang || "") + "\n\n" +
      "対応後、台帳の「状態」列を更新してください。\n" +
      "台帳: " + ss_().getUrl()
    );

    // 連絡先がメールならお客様へ自動返信（言語別）
    if (/@/.test(d.contact || "")) {
      const msgs = {
        ja: { sub: "【OCTO BICYCLE】予約リクエストを受け付けました（" + id + "）",
              body: d.name + " 様\n\nご予約リクエストありがとうございます。\n空き状況を確認のうえ、担当者よりご連絡いたします。\n\n受付番号: " + id + "\n開始日: " + d.start + "\n車種: " + d.bike + "\nプラン: " + d.plan + "\n台数: " + d.qty + "\n合計目安: ¥" + d.total + "\n\nOCTO BICYCLE\n〒156-0042 東京都世田谷区羽根木1-29-13 第二羽根木コーポ103" },
        en: { sub: "[OCTO BICYCLE] Booking request received (" + id + ")",
              body: "Dear " + d.name + ",\n\nThank you for your booking request. We will check availability and get back to you shortly.\n\nRequest ID: " + id + "\nStart date: " + d.start + "\nBike: " + d.bike + "\nPlan: " + d.plan + "\nQty: " + d.qty + "\nEstimated total: ¥" + d.total + "\n\nOCTO BICYCLE\n#103 Dai-ni Haneki Corp, 1-29-13 Haneki, Setagaya-ku, Tokyo 156-0042" },
        ko: { sub: "[OCTO BICYCLE] 예약 신청이 접수되었습니다 (" + id + ")",
              body: d.name + " 님\n\n예약 신청 감사합니다. 예약 가능 여부를 확인한 후 연락드리겠습니다.\n\n접수번호: " + id + "\n시작일: " + d.start + "\n차종: " + d.bike + "\n플랜: " + d.plan + "\n대수: " + d.qty + "\n예상 합계: ¥" + d.total + "\n\nOCTO BICYCLE" },
        zh: { sub: "[OCTO BICYCLE] 已收到您的预约申请（" + id + "）",
              body: d.name + " 您好\n\n感谢您的预约申请。我们将确认车辆情况后尽快与您联系。\n\n受理编号: " + id + "\n开始日期: " + d.start + "\n车型: " + d.bike + "\n方案: " + d.plan + "\n台数: " + d.qty + "\n预计合计: ¥" + d.total + "\n\nOCTO BICYCLE" }
      };
      const msg = msgs[d.lang] || msgs.en;
      MailApp.sendEmail(d.contact, msg.sub, msg.body, { name: REPLY_FROM_NAME });
    }

    return json_({ ok: true, id: id });
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
