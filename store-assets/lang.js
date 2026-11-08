(function () {
  var key = "lani-lang";
  var root = document.documentElement;
  var allowed = { en: "ltr", ckb: "rtl", ar: "rtl", bad: "rtl" };

  function apply(lang) {
    if (!allowed[lang]) lang = "ckb";
    root.lang = lang;
    root.dir = allowed[lang];
    root.dataset.lang = lang;
    try {
      localStorage.setItem(key, lang);
    } catch (err) {
      /* private mode */
    }
    document.cookie = "lani_lang=" + lang + "; Path=/; Max-Age=31536000; SameSite=Lax";
    var title = document.querySelector("title");
    if (title) {
      var titled = title.getAttribute("data-" + (lang === "en" ? "en" : "ckb"));
      if (titled) title.textContent = titled;
    }
    document.querySelectorAll("a[data-lang], button[data-lang]").forEach(function (el) {
      var on = el.getAttribute("data-lang") === lang;
      if (el.tagName === "BUTTON") el.setAttribute("aria-pressed", on ? "true" : "false");
      else if (on) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });
    window.dispatchEvent(new CustomEvent("lani-lang", { detail: { lang: lang } }));
  }

  var params = new URLSearchParams(window.location.search);
  var fromQuery = params.get("lang");
  var saved = null;
  try {
    saved = localStorage.getItem(key);
  } catch (err) {
    saved = null;
  }
  apply(fromQuery || saved || root.getAttribute("lang") || "ckb");

  if (fromQuery) {
    params.delete("lang");
    var next = window.location.pathname + (params.toString() ? "?" + params.toString() : "") + window.location.hash;
    window.history.replaceState(null, "", next);
  }

  // Only language toggles — never <html data-lang>, or every bubbled click is cancelled.
  document.querySelectorAll("a[data-lang], button[data-lang]").forEach(function (el) {
    el.addEventListener("click", function (event) {
      event.preventDefault();
      apply(el.getAttribute("data-lang") || "ckb");
    });
  });

  var nav = document.querySelector("header.nav");
  if (nav) {
    var lastY = window.scrollY;
    var down = 0;
    var up = 0;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      var delta = y - lastY;
      lastY = y;
      if (y < 24) {
        nav.classList.remove("is-compact");
        down = 0;
        up = 0;
        return;
      }
      if (delta > 0) {
        down += delta;
        up = 0;
        if (down > 10) nav.classList.add("is-compact");
      } else if (delta < 0) {
        up += -delta;
        down = 0;
        if (up > 10) nav.classList.remove("is-compact");
      }
    }, { passive: true });
  }
})();
