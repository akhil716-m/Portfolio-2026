/* Visit notes for the Receipt app. No cookies, no IP, no names.
   Sends: page views, time on each page, clicks on links/buttons, and where the visit came from.
   Turn it off for your own browser by opening any page with ?notrack (and back on with ?track). */
(function () {
  var URL_ = "https://hi.akhilmale.in/e";
  if (!/(^|\.)akhilmale\.in$/.test(location.hostname)) return;
  try {
    var q = location.search;
    if (/[?&]notrack\b/.test(q)) localStorage.setItem("_vo", "1");
    if (/[?&]track\b/.test(q)) localStorage.removeItem("_vo");
    if (localStorage.getItem("_vo")) return;
  } catch (e) {}

  function id() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function keep(store, key) {
    try { var v = store.getItem(key); if (!v) { v = id(); store.setItem(key, v); } return v; }
    catch (e) { return id(); }
  }
  var vid = keep(localStorage, "_vid");       // same browser coming back
  var fresh = false;
  try { fresh = !sessionStorage.getItem("_sid"); } catch (e) {}
  var sid = keep(sessionStorage, "_sid");     // this visit (this tab)
  var path = location.pathname.replace(/\.html$/, "").replace(/\/index$/, "/") || "/";

  function send(ev) {
    ev.v = vid; ev.s = sid; ev.p = path;
    var body = JSON.stringify(ev);
    if (navigator.sendBeacon && navigator.sendBeacon(URL_, body)) return;
    try { fetch(URL_, { method: "POST", body: body, keepalive: true, mode: "no-cors" }); } catch (e) {}
  }

  // where they came from: utm_source, else the referring site (only on the first page of a visit)
  var ref = null;
  if (fresh) {
    var m = location.search.match(/[?&]utm_source=([^&]+)/);
    if (m) ref = decodeURIComponent(m[1]);
    else if (document.referrer) {
      try { var h = new URL(document.referrer).hostname; if (!/(^|\.)akhilmale\.in$/.test(h)) ref = h; } catch (e) {}
    }
  }
  send({ t: "view", r: ref });

  // time on the page, counted only while the tab is visible
  var shownAt = document.visibilityState === "visible" ? Date.now() : 0, spent = 0;
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") { shownAt = Date.now(); return; }
    if (shownAt) { spent += Date.now() - shownAt; shownAt = 0; }
    if (spent > 500) { send({ t: "leave", d: spent }); spent = 0; }
  });

  // clicks on anything clickable: the label people see, and where it goes
  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest && e.target.closest("a, button, [data-track]");
    if (!el) return;
    var label = el.getAttribute("data-track") || el.getAttribute("aria-label") ||
                (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    var href = el.getAttribute("href") || "";
    if (!label && href) label = href.replace(/^mailto:/, "").replace(/^https?:\/\/(www\.)?/, "").split(/[/?#]/)[0];
    send({ t: "click", l: (label || el.tagName.toLowerCase()).slice(0, 80), h: href.slice(0, 200) });
  }, true);
})();
