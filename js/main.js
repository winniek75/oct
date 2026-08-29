/* ===== OCTO BICYCLE RENTAL — main.js ===== */
(function () {
  const LANGS = ["ja", "en", "ko", "zh"];
  let lang = detectLang();

  /* ---------- 言語判定：?lang= → 保存済み → ブラウザ言語 ---------- */
  function detectLang() {
    const p = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(p)) return p;
    try {
      const s = localStorage.getItem("octo_lang");
      if (LANGS.includes(s)) return s;
    } catch (e) {}
    const b = (navigator.language || "en").slice(0, 2);
    return LANGS.includes(b) ? b : "en";
  }

  function t(key) {
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || "";
  }

  /* ---------- 翻訳の適用 ---------- */
  function applyLang() {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.title = t("meta.title");
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", t("meta.desc"));
    document.querySelectorAll(".lang-switch button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.lang === lang);
    });
    renderFleet();
    renderBikeOptions();
    updateTotal();
    renderPlans();
    renderReviews();
    renderJournal();
    applyExtras();
    refreshAvailability();
    try { localStorage.setItem("octo_lang", lang); } catch (e) {}
  }

  document.querySelectorAll(".lang-switch button").forEach(function (b) {
    b.addEventListener("click", function () {
      lang = b.dataset.lang;
      const url = new URL(location.href);
      url.searchParams.set("lang", lang);
      history.replaceState(null, "", url);
      applyLang();
    });
  });

  /* ---------- モバイルメニュー ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle) toggle.addEventListener("click", function () { nav.classList.toggle("open"); });
  nav.addEventListener("click", function () { nav.classList.remove("open"); });

  /* ---------- 車両：エディトリアル型の互い違いレイアウト ---------- */
  function renderFleet() {
    const grid = document.getElementById("fleet-grid");
    if (!grid) return;
    grid.innerHTML = "";
    OCTO_CONFIG.bikes.forEach(function (bike) {
      const row = document.createElement("article");
      row.className = "fleet-row";
      row.innerHTML =
        '<div class="fr-media"><div class="fr-clip reveal-img"><img src="' + bike.img + '" alt="' + bike.name.en + '" loading="lazy" onerror="this.src=\'images/placeholder.svg\'"></div>' +
        '<span class="fr-price">¥' + bike.price["3h"].toLocaleString() + "<small>" + t("fleet.from") + "</small></span></div>" +
        '<div class="fr-body reveal">' +
        '<p class="fr-tag">' + bike.tag[lang] + "</p>" +
        "<h3>" + bike.name[lang] + "</h3>" +
        '<p class="fr-desc">' + bike.desc[lang] + "</p>" +
        '<button class="link-arrow" data-bike="' + bike.id + '"><span>' + t("fleet.select") + "</span><i>→</i></button>" +
        "</div>";
      grid.appendChild(row);
    });
    grid.querySelectorAll("button[data-bike]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.getElementById("bk-bike").value = btn.dataset.bike;
        refreshAvailability();
        document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
      });
    });
    observeReveals(grid);
  }

  /* ---------- 予約ウィジェット ---------- */
  const selBike = document.getElementById("bk-bike");
  const selDur = document.getElementById("bk-duration");
  const selQty = document.getElementById("bk-qty");
  const inpDate = document.getElementById("bk-date");
  const elTotal = document.getElementById("bk-total");
  const inpName = document.getElementById("bk-name");
  const inpEmail = document.getElementById("bk-email");
  const elAvail = document.getElementById("bk-avail");
  const btnPay = document.getElementById("bk-pay");
  let remainingCache = null; // {ebike:n,...} 選択日の残数

  function renderBikeOptions() {
    const current = selBike.value;
    selBike.innerHTML = "";
    OCTO_CONFIG.bikes.forEach(function (bike) {
      const o = document.createElement("option");
      o.value = bike.id;
      o.textContent = bike.name[lang];
      selBike.appendChild(o);
    });
    if (current) selBike.value = current;
  }

  function currentPrice() {
    const bike = OCTO_CONFIG.bikes.find(function (b) { return b.id === selBike.value; });
    if (!bike) return 0;
    return bike.price[selDur.value] * parseInt(selQty.value, 10);
  }

  function updateTotal() {
    elTotal.textContent = "¥" + currentPrice().toLocaleString();
  }

  [selBike, selDur, selQty].forEach(function (el) {
    el.addEventListener("change", updateTotal);
  });

  // 今日の日付を最小値に
  const today = new Date().toISOString().split("T")[0];
  inpDate.min = today;
  inpDate.value = today;


  /* ---------- 空き状況エンジン ----------
     ローカルモード: inventory − blackoutDates/定休日 のみで判定
     APIモード(availabilityApi設定時): GASから当日の残数を取得して表示 ---------- */
  function fmtDate(d) { return d; } // input[type=date] は既に YYYY-MM-DD

  function isClosed(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr + "T00:00:00");
    if ((OCTO_CONFIG.closedDays || []).indexOf(d.getDay()) !== -1) return "closed";
    if ((OCTO_CONFIG.blackoutDates || []).indexOf(dateStr) !== -1) return "blackout";
    return false;
  }

  function setAvail(state, n) {
    if (!elAvail) return;
    elAvail.hidden = false;
    elAvail.className = "bk-avail " + state;
    if (state === "ok")       elAvail.textContent = "◯ " + t("avail.ok").replace("{n}", n);
    else if (state === "low") elAvail.textContent = "△ " + t("avail.ok").replace("{n}", n);
    else if (state === "none") elAvail.textContent = "× " + t("avail.none");
    else if (state === "closed") elAvail.textContent = "× " + t("avail.closed");
    else if (state === "checking") elAvail.textContent = "… " + t("avail.checking");
    else if (state === "error") elAvail.textContent = t("avail.error");
    const blocked = (state === "none" || state === "closed");
    btnPay.disabled = blocked;
    btnPay.style.opacity = blocked ? ".45" : "";
    btnPay.style.cursor = blocked ? "not-allowed" : "";
  }

  function rebuildQty(max) {
    const cap = Math.max(0, Math.min(5, max));
    const cur = parseInt(selQty.value, 10) || 1;
    selQty.innerHTML = "";
    for (let i = 1; i <= Math.max(1, cap); i++) {
      const o = document.createElement("option");
      o.value = o.textContent = i;
      selQty.appendChild(o);
    }
    selQty.value = Math.min(cur, Math.max(1, cap));
  }

  function refreshAvailability() {
    const dateStr = inpDate.value;
    const closed = isClosed(dateStr);
    if (closed) { remainingCache = null; setAvail("closed"); return; }

    const api = OCTO_CONFIG.availabilityApi;
    if (!api) {
      // ローカルモード：保有台数を上限として表示
      const inv = OCTO_CONFIG.inventory || {};
      const n = inv[selBike.value] || 0;
      remainingCache = inv;
      rebuildQty(n);
      setAvail(n === 0 ? "none" : (n <= 1 ? "low" : "ok"), n);
      updateTotal();
      return;
    }
    // APIモード
    setAvail("checking");
    fetch(api + "?action=availability&date=" + encodeURIComponent(dateStr))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        remainingCache = res.remaining || {};
        const n = remainingCache[selBike.value];
        rebuildQty(typeof n === "number" ? n : 5);
        if (typeof n !== "number") { setAvail("error"); return; }
        setAvail(n === 0 ? "none" : (n <= 1 ? "low" : "ok"), n);
        updateTotal();
      })
      .catch(function () { remainingCache = null; setAvail("error"); });
  }

  inpDate.addEventListener("change", refreshAvailability);
  selBike.addEventListener("change", refreshAvailability);

  /* ---------- 予約をGASに記録（APIモード時） ---------- */
  function recordBooking(payload) {
    const api = OCTO_CONFIG.availabilityApi;
    if (!api) return Promise.resolve({ ok: true });
    return fetch(api, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // preflight回避
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); });
  }

  /* ---------- 決済ボタン：Stripe Payment Link → 無ければメール仮予約 ---------- */
  document.getElementById("bk-pay").addEventListener("click", function () {
    const dateStr = inpDate.value;
    if (isClosed(dateStr)) { refreshAvailability(); return; }
    // APIモードでは残数を最終チェック
    if (OCTO_CONFIG.availabilityApi && remainingCache) {
      const n = remainingCache[selBike.value];
      if (typeof n === "number" && parseInt(selQty.value, 10) > n) { refreshAvailability(); return; }
    }
    // APIモードではメール必須（予約記録・連絡用）
    if (OCTO_CONFIG.availabilityApi && !(inpEmail.value && inpEmail.checkValidity())) {
      inpEmail.focus(); inpEmail.style.borderColor = "#e5484d";
      return;
    }

    const key = selBike.value + "_" + selDur.value;
    const link = OCTO_CONFIG.paymentLinks[key];
    const bike = OCTO_CONFIG.bikes.find(function (b) { return b.id === selBike.value; });
    const summary =
      "\n- " + t("book.bike") + ": " + bike.name[lang] +
      "\n- " + t("book.date") + ": " + dateStr +
      "\n- " + t("book.duration") + ": " + selDur.options[selDur.selectedIndex].text +
      "\n- " + t("book.qty") + ": " + selQty.value +
      "\n- " + t("book.total") + ": ¥" + currentPrice().toLocaleString() +
      (inpName.value ? "\n- Name: " + inpName.value : "") +
      (inpEmail.value ? "\n- Email: " + inpEmail.value : "");

    const payload = {
      date: dateStr, bike: selBike.value, duration: selDur.value,
      qty: parseInt(selQty.value, 10), name: inpName.value, email: inpEmail.value,
      lang: lang, total: currentPrice()
    };

    btnPay.disabled = true;
    const orig = btnPay.textContent;
    btnPay.textContent = "…";

    recordBooking(payload)
      .catch(function () { /* 記録失敗でも決済へは進める（メール通知でカバー） */ })
      .then(function (res) {
        const bookingId = (res && res.id) || (selBike.value + "-" + dateStr + "-" + selDur.value + "x" + selQty.value);
        if (link) {
          const url = new URL(link);
          url.searchParams.set("client_reference_id", String(bookingId).slice(0, 200));
          if (inpEmail.value) url.searchParams.set("prefilled_email", inpEmail.value);
          location.href = url.toString();
        } else {
          location.href = "mailto:" + OCTO_CONFIG.contactEmail +
            "?subject=" + encodeURIComponent(t("book.mailSubject") + (res && res.id ? " [" + res.id + "]" : "")) +
            "&body=" + encodeURIComponent(t("book.mailBody") + summary);
          btnPay.disabled = false;
          btnPay.textContent = orig;
        }
      });
  });

  /* ---------- ライドプラン：フルワイドのマガジンバンド ---------- */
  function renderPlans() {
    const grid = document.getElementById("plans-grid");
    if (!grid || !OCTO_CONFIG.plans) return;
    grid.innerHTML = "";
    OCTO_CONFIG.plans.forEach(function (p) {
      const band = document.createElement("article");
      band.className = "plan-band reveal-img";
      const badge = p.badge ? '<span class="plan-badge">' + p.badge[lang] + "</span>" : "";
      const chips = (p.chips[lang] || []).join('<span class="dot">・</span>');
      band.innerHTML =
        '<div class="pb-media"><img src="' + p.img + '" alt="' + p.name.en + '" loading="lazy" onerror="this.src=\'images/placeholder.svg\'"></div>' +
        '<div class="pb-content">' + badge +
        "<h3>" + p.name[lang] + "</h3>" +
        '<p class="pb-desc">' + p.desc[lang] + "</p>" +
        '<p class="pb-chips">' + chips + "</p>" +
        '<button class="link-arrow light" data-plan="' + p.id + '"><span>' + t("plans.use") + "</span><i>→</i></button>" +
        "</div>";
      grid.appendChild(band);
    });
    grid.querySelectorAll("button[data-plan]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const p = OCTO_CONFIG.plans.find(function (x) { return x.id === btn.dataset.plan; });
        if (p && p.recommend) {
          if (p.recommend.bike) document.getElementById("bk-bike").value = p.recommend.bike;
          if (p.recommend.duration) document.getElementById("bk-duration").value = p.recommend.duration;
          refreshAvailability();
        }
        document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
      });
    });
    observeReveals(grid);
  }

  /* ---------- お客様の声：枠なしプルクォート ---------- */
  function renderReviews() {
    const sec = document.getElementById("reviews");
    const grid = document.getElementById("reviews-grid");
    if (!sec || !grid) return;
    const list = OCTO_CONFIG.reviews || [];
    if (!list.length) { sec.hidden = true; return; }
    sec.hidden = false;
    grid.innerHTML = "";
    list.forEach(function (r) {
      const el = document.createElement("figure");
      el.className = "review-quote reveal";
      const text = typeof r.text === "string" ? r.text : (r.text[lang] || r.text.en);
      const sampleTag = r.sample ? '<span class="rv-sample">' + t("rv.sample") + "</span>" : "";
      el.innerHTML = sampleTag +
        "<blockquote>" + text + "</blockquote>" +
        "<figcaption>" + (r.flag || "") + " " + r.name + (r.source ? ' <span class="rv-src">— ' + r.source + "</span>" : "") + "</figcaption>";
      grid.appendChild(el);
    });
    observeReveals(grid);
  }

  /* ---------- 機能スイッチ・リンクの適用 ---------- */
  function applyExtras() {
    const f = OCTO_CONFIG.features || {};
    const L = OCTO_CONFIG.links || {};

    // 公式サイト特典バッジ
    const promo = document.getElementById("ticket-promo");
    if (promo) {
      const txt = OCTO_CONFIG.promo && OCTO_CONFIG.promo[lang];
      promo.hidden = !(f.promoBanner && txt);
      if (txt) document.getElementById("ticket-promo-text").textContent = txt;
    }

    // トラストバー
    const bar = document.getElementById("trust-bar");
    if (bar) {
      const pairs = [["trust-google", L.googleReview], ["trust-tripadvisor", L.tripadvisor], ["trust-instagram", L.instagram]];
      let any = false;
      pairs.forEach(function (pr) {
        const a = document.getElementById(pr[0]);
        if (a) { a.hidden = !pr[1]; if (pr[1]) { a.href = pr[1]; any = true; } }
      });
      bar.hidden = !(f.trustBar && any);
    }

    // 配達セクション
    const dl = document.getElementById("delivery");
    if (dl) {
      dl.hidden = !f.delivery;
      const m = document.getElementById("dl-mail");
      if (m) m.href = "mailto:" + OCTO_CONFIG.contactEmail + "?subject=" + encodeURIComponent(t("dl.title"));
    }

    // スマホ固定CTA・連絡ボタン
    const cta = document.getElementById("sticky-cta");
    if (cta) cta.hidden = !f.stickyCta;
    const cf = document.getElementById("contact-float");
    if (cf) {
      const wa = document.getElementById("cf-whatsapp");
      const ln = document.getElementById("cf-line");
      if (wa) { wa.hidden = !L.whatsapp; if (L.whatsapp) wa.href = L.whatsapp; }
      if (ln) { ln.hidden = !L.line; if (L.line) ln.href = L.line; }
      cf.hidden = !(L.whatsapp || L.line);
    }
  }


  /* ---------- ジャーナル：枠なしエディトリアル ---------- */
  function renderJournal() {
    const sec = document.getElementById("journal");
    const grid = document.getElementById("journal-grid");
    if (!sec || !grid) return;
    const posts = OCTO_CONFIG.posts || [];
    if (!posts.length) { sec.hidden = true; return; }
    sec.hidden = false;
    grid.innerHTML = "";
    posts.forEach(function (p) {
      const a = document.createElement("a");
      a.className = "journal-item reveal";
      a.href = p.url;
      a.innerHTML =
        '<div class="ji-media reveal-img"><img src="' + p.img + '" alt="" loading="lazy" onerror="this.src=\'images/placeholder.svg\'"></div>' +
        "<time>" + p.date + "</time>" +
        '<h3><span class="u">' + p.title[lang] + "</span></h3>" +
        "<p>" + p.excerpt[lang] + "</p>" +
        '<span class="jc-read">' + t("blog.read") + " →</span>";
      grid.appendChild(a);
    });
    observeReveals(grid);
  }

  /* ---------- ヒーロー動画  /* ---------- ヒーロー動画：hero.mp4 が無ければ静止画にフォールバック ---------- */
  (function () {
    const v = document.querySelector(".hero-video");
    if (!v) return;
    const s = v.querySelector("source");
    function drop() { v.remove(); }
    if (s) s.addEventListener("error", drop);
    v.addEventListener("error", drop);
  })();

  /* ---------- モーションシステム：スタッガー表示・画像リビール ---------- */
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

  function observeReveals(root) {
    const els = (root || document).querySelectorAll(".reveal:not(.on), .reveal-img:not(.on)");
    els.forEach(function (el, i) {
      el.style.setProperty("--d", (i % 6) * 90 + "ms");
      io.observe(el);
    });
  }

  document.querySelectorAll(".section-head, .steps li, .area-card, .faq-list details, .company-inner, .support-card, .rules-box, .delivery-inner")
    .forEach(function (el) { el.classList.add("reveal"); });
  observeReveals(document);

  /* ---------- ヘッダー：スクロールで隠す/出す・背景切替 ---------- */
  (function () {
    const header = document.querySelector(".site-header");
    let last = 0;
    window.addEventListener("scroll", function () {
      const y = window.scrollY;
      header.classList.toggle("scrolled", y > 40);
      header.classList.toggle("hide", y > 320 && y > last);
      last = y;
    }, { passive: true });
  })();

  /* ---------- ヒーロー：パララックス（reduced-motion時は無効） ---------- */
  (function () {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bg = document.querySelector(".hero-bg");
    if (!bg) return;
    let ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.2) bg.style.transform = "translateY(" + y * 0.22 + "px)";
        ticking = false;
      });
    }, { passive: true });
  })();

  /* ---------- ロード時のヒーロー登場シーケンス ---------- */
  requestAnimationFrame(function () {
    setTimeout(function () { document.body.classList.add("is-loaded"); }, 80);
  });

    document.getElementById("year").textContent = new Date().getFullYear();

  applyLang();
})();
