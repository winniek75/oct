/* =========================================================
   OCTO BICYCLE — main.js
   言語切替 / 動的レンダリング / 予約ウィジェット
   （通常このファイルを編集する必要はありません。設定は js/config.js へ）
========================================================= */
(function () {
  const C = OCTO_CONFIG;
  const yen = (n) => "¥" + Number(n).toLocaleString("ja-JP");

  /* ---------- 言語 ---------- */
  const LANGS = ["ja", "en", "ko", "zh"];
  function detectLang() {
    const p = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(p)) return p;
    const saved = localStorage.getItem("octo_lang");
    if (LANGS.includes(saved)) return saved;
    const nav = (navigator.language || "ja").toLowerCase();
    if (nav.startsWith("ja")) return "ja";
    if (nav.startsWith("ko")) return "ko";
    if (nav.startsWith("zh")) return "zh";
    return "en";
  }
  let lang = detectLang();

  const t = (key) => (OCTO_I18N[lang] && OCTO_I18N[lang][key]) || OCTO_I18N.ja[key] || key;
  const tx = (obj) => (obj && (obj[lang] || obj.ja)) || "";

  function applyI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.lang === lang);
    });
  }

  function setLang(next) {
    lang = next;
    localStorage.setItem("octo_lang", next);
    const url = new URL(location);
    url.searchParams.set("lang", next);
    history.replaceState(null, "", url);
    applyI18n();
    renderAll();
  }

  document.querySelectorAll(".lang-btn").forEach((b) =>
    b.addEventListener("click", () => setLang(b.dataset.lang))
  );

  /* ---------- 静的データ流し込み ---------- */
  function renderStatic() {
    // 連絡先・住所
    document.querySelectorAll("[data-email]").forEach((el) => {
      el.textContent = C.customerEmail;
      if (el.tagName === "A") el.href = "mailto:" + C.customerEmail;
    });
    document.querySelectorAll("[data-email-href]").forEach((el) => {
      el.href = "mailto:" + C.customerEmail;
    });
    const addr = document.getElementById("addr");
    if (addr) addr.textContent = (lang === "ja" ? "〒" + C.location.postal + " " : "") + tx(C.location.address);
    const closed = document.getElementById("closedDays");
    if (closed) closed.textContent = tx(C.location.closedDays);
    const locNote = document.getElementById("locNote");
    if (locNote) locNote.textContent = tx(C.location.note);
    const mapLink = document.getElementById("mapLink");
    if (mapLink) mapLink.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.location.mapQuery);
    const mapFrame = document.getElementById("mapFrame");
    if (mapFrame && !mapFrame.src) mapFrame.src = "https://www.google.com/maps?q=" + encodeURIComponent(C.location.mapQuery) + "&output=embed";
    const delNote = document.getElementById("deliveryNote");
    if (delNote) delNote.textContent = tx(C.delivery.note);

    // 料金表
    const P = C.pricing;
    setText("priceDay", yen(P.day1));
    setText("priceDayNote", t("pricing.dayNote"));
    setText("priceWeek", yen(P.week));
    setText("priceMonth", yen(P.month));

    // SNSリンク
    linkOrHide("lnkInsta", C.links.instagram);
    linkOrHide("lnkReview", C.links.googleReview);
    linkOrHide("lineFab", C.links.line);
    linkOrHide("lnkLineContact", C.links.line);
    linkOrHide("footInsta", C.links.instagram);
    linkOrHide("footReview", C.links.googleReview);
    linkOrHide("footLine", C.links.line);
  }
  function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
  function linkOrHide(id, url) {
    const el = document.getElementById(id);
    if (!el) return;
    if (url) { el.href = url; el.hidden = false; } else { el.hidden = true; }
  }

  /* ---------- 車種カード ---------- */
  function renderBikes() {
    const wrap = document.getElementById("bikeCards");
    if (!wrap) return;
    wrap.innerHTML = C.bikes.map((b) => `
      <article class="bike-card">
        <div class="bike-photo"><img src="${b.img}" alt="${tx(b.name)}" loading="lazy"></div>
        <div class="bike-body">
          <p class="bike-tag">${tx(b.tag)}</p>
          <h3>${tx(b.name)}</h3>
          <p class="bike-desc">${tx(b.desc)}</p>
        </div>
      </article>`).join("");
  }

  /* ---------- 事業内容 ---------- */
  const ICONS = {
    cart: "M4 5h2l2.4 10.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 2-1.5L21 8H7",
    bike: "M5 17a3.5 3.5 0 1 0 0 .01M19 17a3.5 3.5 0 1 0 0 .01M5 17l4-8h5l3 8M9 9h6l-2-3h-3",
    wrench: "M14.5 6.5a4 4 0 0 0-5.4 5L4 16.6 6.4 19l5.1-5.1a4 4 0 0 0 5-5.4l-2.6 2.6-2-2z",
    gear: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8 4l2-1-1-3-2.2.4a8 8 0 0 0-1.5-1.5L17.7 4l-3-1-1 2a8 8 0 0 0-2.2 0l-1-2-3 1 .4 2.2A8 8 0 0 0 5.4 8L3 7.6l-1 3 2 1",
    recycle: "M7 19h7l-1.5 2M7 19l3-5m7 5l-3.5-6M17 19h2.5L21 16l-2-3.5m-3-1L14 8l2.5-1.5M14 8l-2-3.5h-3L7.5 8l3 1.5",
    truck: "M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 18a1.5 1.5 0 1 0 0 .01M17 18a1.5 1.5 0 1 0 0 .01",
    building: "M4 21V5l7-2v18M11 21h9V9l-5-1.5M7 8h.01M7 12h.01M7 16h.01M15 12h.01M15 16h.01",
    chat: "M4 5h16v11H9l-4 4V5z"
  };
  function renderServices() {
    const wrap = document.getElementById("serviceList");
    if (!wrap) return;
    wrap.innerHTML = C.services.map((s, idx) => `
      <article class="svc" id="svc-${s.id}">
        <div class="svc-photo">
          <img src="${s.photo}" alt="${tx(s.name)}" loading="lazy">
          <span class="svc-num">${String(idx + 1).padStart(2, "0")}</span>
          <span class="svc-latin">${s.latin || ""}</span>
        </div>
        <div class="svc-body">
          <h3><span class="svc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[s.icon] || ICONS.chat}"/></svg></span>${tx(s.name)}</h3>
          <p>${tx(s.desc)}</p>
          <p class="svc-more">${
            s.links
              ? s.links.map((l) => `<a href="${l.url}">${tx(l.label)}</a>`).join(" ／ ")
              : (C.links.line ? `<a href="${C.links.line}" target="_blank" rel="noopener" class="svc-line">${t("svc.line")}</a>` : "")
          }</p>
        </div>
      </article>`).join("");
    setText("servicesClosing", tx(C.servicesClosing));
  }

  /* ---------- FAQ ---------- */
  function renderFaq() {
    const wrap = document.getElementById("faqList");
    if (!wrap) return;
    wrap.innerHTML = C.faq.map((f) => `
      <details class="faq-item">
        <summary>${tx(f.q)}</summary>
        <p>${tx(f.a)}</p>
      </details>`).join("");
  }

  /* ---------- 予約ウィジェット ---------- */
  const $ = (id) => document.getElementById(id);

  function renderBookingOptions() {
    const bikeSel = $("bkBike");
    if (bikeSel) {
      const cur = bikeSel.value;
      bikeSel.innerHTML = C.bikes.map((b) => `<option value="${b.id}">${tx(b.name)}</option>`).join("");
      if (cur) bikeSel.value = cur;
    }
    const planSel = $("bkPlan");
    if (planSel) {
      const cur = planSel.value || "days";
      planSel.innerHTML = `
        <option value="days">${t("book.plan.days")}</option>
        <option value="week">${t("book.plan.week")} — ${yen(C.pricing.week)}</option>
        <option value="month">${t("book.plan.month")} — ${yen(C.pricing.month)}</option>`;
      planSel.value = cur;
    }
    updateBooking();
  }

  function calcTotal() {
    const P = C.pricing;
    const plan = $("bkPlan").value;
    const qty = Math.max(1, parseInt($("bkQty").value || "1", 10));
    let unit, days = 1;
    if (plan === "week") unit = P.week;
    else if (plan === "month") unit = P.month;
    else {
      days = Math.min(6, Math.max(1, parseInt($("bkDays").value || "1", 10)));
      unit = P.day1 + (days - 1) * P.dayExtra;
    }
    return { plan, qty, days, unit, total: unit * qty };
  }

  function updateBooking() {
    const r = calcTotal();
    $("bkDaysWrap").hidden = r.plan !== "days";
    $("bkTotal").textContent = yen(r.total);
    $("bkWeekHint").hidden = !(r.plan === "days" && r.unit >= C.pricing.week);
    // 決済ボタン：固定料金プラン & Stripeリンク設定時のみ
    const linkKey = r.plan === "days" ? (r.days === 1 ? "day1" : null) : r.plan;
    const payUrl = linkKey ? C.paymentLinks[linkKey] : "";
    const payBtn = $("bkPay");
    if (payBtn) {
      payBtn.hidden = !payUrl;
      if (payUrl) payBtn.href = payUrl;
    }
  }

  function sendBookingMail() {
    const r = calcTotal();
    const bike = C.bikes.find((b) => b.id === $("bkBike").value) || C.bikes[0];
    const planLabel =
      r.plan === "week" ? t("book.plan.week") :
      r.plan === "month" ? t("book.plan.month") :
      r.days + " " + t("book.daysUnit");
    const body = t("mail.body")
      .replace("{bike}", tx(bike.name))
      .replace("{plan}", planLabel)
      .replace("{start}", $("bkStart").value || "-")
      .replace("{qty}", String(r.qty))
      .replace("{delivery}", $("bkDelivery").checked ? "YES" : "NO")
      .replace("{total}", yen(r.total));
    location.href = "mailto:" + C.customerEmail +
      "?subject=" + encodeURIComponent(t("mail.subject")) +
      "&body=" + encodeURIComponent(body);
  }

  function initBooking() {
    if (!$("bkPlan")) return;
    ["bkPlan", "bkDays", "bkQty", "bkBike"].forEach((id) => {
      const el = $(id);
      el && el.addEventListener("input", updateBooking);
      el && el.addEventListener("change", updateBooking);
    });
    const start = $("bkStart");
    if (start) start.min = new Date().toISOString().slice(0, 10);
    $("bkSubmit").addEventListener("click", sendBookingMail);
  }

  /* ---------- 演出：ヘッダー変化・スクロール出現・動画 ---------- */
  function initEffects() {
    document.body.classList.add("home");
    const header = document.querySelector("header.site");
    const onScroll = () => {
      const top = window.scrollY < 40;
      header.classList.toggle("at-top", top);
      header.classList.toggle("scrolled", !top);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // スクロール出現
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll(".rv").forEach((el) => io.observe(el));
    } else {
      document.querySelectorAll(".rv").forEach((el) => el.classList.add("in"));
    }

    // ヒーロー動画：hero.mp4 が無ければ静止画にフォールバック
    const v = document.getElementById("heroVideo");
    if (v) {
      const src = v.querySelector("source");
      src && src.addEventListener("error", () => v.remove());
      v.addEventListener("error", () => v.remove());
    }
  }

  /* ---------- ヘッダー / モバイルメニュー / 固定CTA ---------- */
  function initChrome() {
    const burger = document.getElementById("burger");
    const nav = document.getElementById("nav");
    if (burger && nav) {
      burger.addEventListener("click", () => {
        const open = nav.classList.toggle("open");
        burger.setAttribute("aria-expanded", open);
      });
      nav.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => nav.classList.remove("open"))
      );
    }
    const sticky = document.getElementById("stickyCta");
    if (sticky && C.features.stickyCta) {
      const hero = document.getElementById("hero");
      window.addEventListener("scroll", () => {
        sticky.classList.toggle("show", window.scrollY > (hero ? hero.offsetHeight : 500));
      }, { passive: true });
    }
  }

  /* ---------- 起動 ---------- */
  function renderAll() {
    renderStatic();
    renderBikes();
    renderServices();
    renderFaq();
    renderBookingOptions();
  }
  applyI18n();
  renderAll();
  initBooking();
  initChrome();
  initEffects();
})();
