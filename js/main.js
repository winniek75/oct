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

  /* ---------- 車両カード生成 ---------- */
  function renderFleet() {
    const grid = document.getElementById("fleet-grid");
    if (!grid) return;
    grid.innerHTML = "";
    OCTO_CONFIG.bikes.forEach(function (bike) {
      const card = document.createElement("article");
      card.className = "bike-card reveal on";
      card.innerHTML =
        '<img src="' + bike.img + '" alt="' + bike.name.en + '" onerror="this.src=\'images/placeholder.svg\'">' +
        '<div class="bc-body">' +
        "<h3>" + bike.name[lang] + "</h3>" +
        '<span class="bc-tag">' + bike.tag[lang] + "</span>" +
        "<p>" + bike.desc[lang] + "</p>" +
        '<div class="bc-price">¥' + bike.price["3h"].toLocaleString() +
        " <small>" + t("fleet.from") + "</small></div>" +
        "<button data-bike=\"" + bike.id + "\">" + t("fleet.select") + "</button>" +
        "</div>";
      grid.appendChild(card);
    });
    grid.querySelectorAll("button[data-bike]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.getElementById("bk-bike").value = btn.dataset.bike;
        updateTotal();
        document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* ---------- 予約ウィジェット ---------- */
  const selBike = document.getElementById("bk-bike");
  const selDur = document.getElementById("bk-duration");
  const selQty = document.getElementById("bk-qty");
  const inpDate = document.getElementById("bk-date");
  const elTotal = document.getElementById("bk-total");

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

  /* ---------- 決済ボタン：Stripe Payment Link → 無ければメール仮予約 ---------- */
  document.getElementById("bk-pay").addEventListener("click", function () {
    const key = selBike.value + "_" + selDur.value;
    const link = OCTO_CONFIG.paymentLinks[key];
    const bike = OCTO_CONFIG.bikes.find(function (b) { return b.id === selBike.value; });
    const summary =
      "\n- " + t("book.bike") + ": " + bike.name[lang] +
      "\n- " + t("book.date") + ": " + inpDate.value +
      "\n- " + t("book.duration") + ": " + selDur.options[selDur.selectedIndex].text +
      "\n- " + t("book.qty") + ": " + selQty.value +
      "\n- " + t("book.total") + ": ¥" + currentPrice().toLocaleString();

    if (link) {
      // Stripeの支払いリンクへ。client_reference_idに予約内容を添付
      const url = new URL(link);
      url.searchParams.set("client_reference_id",
        (selBike.value + "-" + inpDate.value + "-" + selDur.value + "x" + selQty.value).slice(0, 200));
      location.href = url.toString();
    } else {
      // フォールバック：メールで仮予約
      location.href = "mailto:" + OCTO_CONFIG.contactEmail +
        "?subject=" + encodeURIComponent(t("book.mailSubject")) +
        "&body=" + encodeURIComponent(t("book.mailBody") + summary);
    }
  });

  /* ---------- スクロールで表示 ---------- */
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".section-head, .steps li, .area-card, .faq-list details, .company-inner")
    .forEach(function (el) { el.classList.add("reveal"); io.observe(el); });

  document.getElementById("year").textContent = new Date().getFullYear();

  applyLang();
})();
